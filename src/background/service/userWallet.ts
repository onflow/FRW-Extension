import * as secp from '@noble/secp256k1';
import * as fcl from '@onflow/fcl';
import type { Account as FclAccount } from '@onflow/typedefs';
import * as ethUtil from 'ethereumjs-util';
import { getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth/web-extension';

import wallet from '@/background/controller/wallet';
import keyringService from '@/background/service/keyring';
import { mixpanelTrack } from '@/background/service/mixpanel';
import openapiService from '@/background/service/openapi';
import {
  signWithKey,
  seed2PublicPrivateKey,
  seedWithPathAndPhrase2PublicPrivateKey,
  formPubKeyTuple,
  pk2PubKey,
} from '@/background/utils/modules/publicPrivateKey';
import createPersistStore from '@/background/utils/persisitStore';
import {
  type PublicPrivateKeyTuple,
  tupleToPrivateKey,
  combinePubPkString,
} from '@/shared/types/key-types';
import {
  type FlowAddress,
  type EvmAddress,
  type WalletAccount,
  type ChildAccountMap,
  type ActiveAccountType,
  getActiveAccountTypeForAddress,
  type WalletAddress,
} from '@/shared/types/wallet-types';
import { ensureEvmAddressPrefix, isValidEthereumAddress, withPrefix } from '@/shared/utils/address';
import {
  FLOW_BIP44_PATH,
  HASH_ALGO_NUM_SHA2_256,
  HASH_ALGO_NUM_SHA3_256,
  SIGN_ALGO_NUM_ECDSA_P256,
  SIGN_ALGO_NUM_ECDSA_secp256k1,
} from '@/shared/utils/algo-constants';
import {
  mainAccountsKey,
  evmAccountKey,
  childAccountsKey,
  mainAccountsRefreshRegex,
  childAccountsRefreshRegex,
  evmAccountRefreshRegex,
  type EvmAccountStore,
  accountBalanceKey,
  accountBalanceRefreshRegex,
} from '@/shared/utils/cache-data-keys';
import { retryOperation } from '@/shared/utils/retryOperation';
import { setUserData } from '@/shared/utils/user-data-access';
import {
  userWalletsKey,
  type UserWalletStore,
  type ActiveAccountsStore,
  activeAccountsKey,
  getActiveAccountsData,
} from '@/shared/utils/user-data-keys';

import {
  networkToChainId,
  type AccountKeyRequest,
  type DeviceInfoRequest,
  type FlowNetwork,
} from '../../shared/types/network-types';
import { type PublicKeyAccount, type MainAccount } from '../../shared/types/wallet-types';
import { fclConfig, fclConfirmNetwork, fclEnsureNetwork } from '../fclConfig';
import { defaultAccountKey, pubKeyAccountToAccountKey } from '../utils/account-key';
import {
  clearCachedData,
  getValidData,
  registerRefreshListener,
  setCachedData,
} from '../utils/data-cache';
import { getEmojiByIndex } from '../utils/emoji-util';
import {
  getAccountsByPublicKeyTuple,
  getAccountsWithPublicKey,
} from '../utils/modules/findAddressWithPubKey';
import { storage } from '../webapi';

import { getScripts } from './openapi';

const USER_WALLET_TEMPLATE: UserWalletStore = {
  monitor: 'flowscan',
  network: 'mainnet',
  emulatorMode: false,
  currentPubkey: '',
};
class UserWallet {
  // PERSISTENT DATA
  // The user settings - network and other global settings
  private store!: UserWalletStore;
  // Map of the selected accounts for each network and pubkey
  private activeAccounts: Map<FlowNetwork, Map<string, ActiveAccountsStore>> = new Map();

  init = async () => {
    this.store = await createPersistStore<UserWalletStore>({
      name: userWalletsKey,
      template: USER_WALLET_TEMPLATE,
    });

    this.activeAccounts = new Map();
    // Initialize the account loaders
    initAccountLoaders();

    // Load the active accounts
    await this.loadActiveAccounts(this.store.network, this.store.currentPubkey);
  };

  clear = async () => {
    if (!this.store) {
      await this.init();
    } else {
      Object.assign(this.store, USER_WALLET_TEMPLATE);
    }
    this.activeAccounts = new Map();
    // clear all session storage
    await storage.clearSession();
  };

  isLocked = () => {
    return !keyringService.isUnlocked();
  };

  /**
   * --------------------------------------------
   * Getting and setting current state
   * --------------------------------------------
   */

  getCurrentPubkey = (): string => {
    if (this.isLocked()) {
      throw new Error('Wallet is locked');
    }
    return this.store.currentPubkey;
  };

  /**
   * Set the current pubkey
   * TODO: There are lots of async methods "get" the current pubkey before performing an action
   * Switching the pubkey mid action may cause unexpected behavior
   * It would be better practice to either pass the pubkey to actions or have class instances
   * for each pubkey and network combination
   * @param pubkey - The pubkey to set
   */
  setCurrentPubkey = async (pubkey: string) => {
    // Note that values that are set in the proxy store are immediately available through the proxy
    // It stores the value in memory immediately
    // However the value in storage may not be updated immediately
    this.store.currentPubkey = pubkey;

    // Load all data for the new pubkey. This is async but don't await it
    // NOTE: If this is remvoed... everything runs just fine (I've checked)
    this.loadAllAccounts(this.store.network, pubkey);
  };

  /**
   * Set the current pubkey in registered state
   * TODO: There are lots of async methods "get" the current pubkey before performing an action
   * Switching the pubkey mid action may cause unexpected behavior
   * It would be better practice to either pass the pubkey to actions or have class instances
   * for each pubkey and network combination
   * @param pubkey - The pubkey to set
   */
  registerCurrentPubkey = async (pubkey: string, account: FclAccount) => {
    // Note that values that are set in the proxy store are immediately available through the proxy
    // It stores the value in memory immediately
    // However the value in storage may not be updated immediately
    this.store.currentPubkey = pubkey;
    await setupNewAccount(this.store.network, pubkey, account);

    // Load all data for the new pubkey. This is async but don't await it
    this.loadAllAccounts(this.store.network, pubkey);
  };

  getNetwork = (): FlowNetwork => {
    if (!this.store) {
      // Just return mainnet for now
      return 'mainnet';
    }
    return this.store.network;
  };

  setNetwork = async (network: string) => {
    if (!this.store) {
      throw new Error('UserWallet not initialized');
    }
    if (network !== 'mainnet' && network !== 'testnet') {
      throw new Error('Invalid network');
    }
    this.store.network = network;

    // Load all data for the new network. This is async but don't await it
    this.loadAllAccounts(network, this.store.currentPubkey);
  };

  /**
   * Settings - these should be moved to preferences or some settings service
   */
  getMonitor = (): string => {
    return this.store.monitor;
  };

  setMonitor = (monitor: string) => {
    if (!this.store) {
      throw new Error('UserWallet not initialized');
    }
    this.store.monitor = monitor;
  };

  getEmulatorMode = async (): Promise<boolean> => {
    // Check feature flag first
    const enableEmulatorMode = await openapiService.getFeatureFlag('emulator_mode');
    if (!enableEmulatorMode) {
      return false;
    }
    if (!this.store) {
      throw new Error('UserWallet not initialized');
    }
    return this.store.emulatorMode;
  };

  setEmulatorMode = async (emulatorMode: boolean) => {
    let emulatorModeToSet = emulatorMode;
    if (emulatorModeToSet) {
      // check feature flag
      const enableEmulatorMode = await openapiService.getFeatureFlag('emulator_mode');
      if (!enableEmulatorMode) {
        emulatorModeToSet = false;
      }
    }
    this.store.emulatorMode = emulatorModeToSet;
    await this.setupFcl();
  };

  /**
   * --------------------------------------------
   * Loading accounts when the public key changes
   * --------------------------------------------
   */

  /**
   * Load all accounts for the given network and pubkey
   * This is called when the pubkey or network changes
   * It will safely return if either of those values are not yet set
   * This can be called multiple times asynchrously without causing issues
   * @param network - The network to load the accounts for
   * @param pubkey - The pubkey to load the accounts for
   * @returns A promise that resolves to the loaded accounts
   */
  loadAllAccounts = async (network: string, pubkey: string) => {
    if (!network || !pubkey) {
      // Simply return if the network or pubkey is not yet set
      // Other methods will throw an error if they are not set
      return;
    }

    try {
      await this.loadActiveAccounts(network, pubkey);
      // extenal method that ensures caches are loaded
      const allAccounts = await loadAllAccountsWithPubKey(network, pubkey);

      // Ensure the parent address is valid - this can only be called after the active and main accounts are loaded
      // Wonder if this is the best way to do this
      const activeAccounts = this.getActiveAccounts();
      console.log(
        'ensureValidActiveAccount - before',
        network,
        pubkey,
        structuredClone(activeAccounts)
      );
      await this.ensureValidActiveAccount(network, pubkey);
      console.log(
        'ensureValidActiveAccount - after',
        network,
        pubkey,
        structuredClone(activeAccounts)
      );
      // Load the balances for the main accounts
      await loadAccountListBalance(
        network,
        allAccounts.map((account) => account.address)
      );
    } catch (error) {
      console.error('Error loading accounts', error);
    }
  };

  /**
   * Load the active accounts for the given network and pubkey
   * This is called when the pubkey or network changes
   * It will safely return if either of those values are not yet set
   * This can be called multiple times asynchrously without causing issues
   * @param network - The network to load the accounts for
   * @param pubkey - The pubkey to load the accounts for
   * @returns A promise that resolves to the loaded accounts
   */
  loadActiveAccounts = async (network: string, pubkey: string) => {
    if (network) {
      if (!this.activeAccounts[network]) {
        this.activeAccounts[network] = new Map();
      }
      if (pubkey) {
        // Load from storage
        const activeAccounts = (await getActiveAccountsData(network, pubkey)) ?? {
          parentAddress: null,
          currentAddress: null,
        };
        // Store in memory
        this.activeAccounts[network][pubkey] = activeAccounts;
      }
    }
  };

  /*

  switchProfile = async (pubkey: string) => {
    if (!pubkey) {
      console.warn('Invalid pubkey provided to switchAccount');
      return;
    }

    const profileList: WalletProfile[] = this.accounts[this.store.network];

    let profile = profileList.find((group) => {
      const matches = group.publicKey === pubkey;

      return matches;
    });

    if (!profile) {
      // Create a new profile
      profile = await createSessionStore<ProfileAccountStore>({
        name: profileAccountsKey(this.store.network, pubkey),
        template: {
          accounts: [],
          publicKey: pubkey,
        },
      });
      // Add the new profile to the profile list
      profileList.push(profile);
    }
    // Set the current pubkey
    this.store.currentPubkey = pubkey;

    if (!profile.accounts.length) {
      console.warn(`No account found for pubkey: ${pubkey.slice(0, 10)}...`);
      return;
    }

  };



  getAccountsWithPublicKey = async (
    publicKey: string,
    network: string
  ): Promise<PublicKeyAccount[]> => {
    const accounts = await openapiService.getAccountsWithPublicKey(publicKey, network);
    return accounts;
  };

  setChildAccounts = async (
    childAccountMap: ChildAccountMap,
    address: FlowAddress,
    network: string
  ) => {
    const { account } = this.findAccount(address, network);

    if (!account) return;

    // Store the child accounts for address in the childAccountMap
    if (!!this.childAccountMap[address]) {
      // Update the existing session store
      this.childAccountMap[address].accounts = { ...childAccountMap };
    } else {
      // Create a new session store so the front end can access the child accounts
      this.childAccountMap[address] = await createSessionStore<ChildAccountStore>({
        name: childAccountsKey(network, address),
        template: {
          parentAddress: address,
          accounts: childAccountMap,
        },
      });
    }
  };

  /*
   * Set the evm address for the main account
   * This is invoked when loading the wallet
   * /
  setAccountEvmAddress = async (evmAddress: EvmAddress | null) => {
    const network = this.store.network;
    const address = this.store.parentAddress as FlowAddress;
    const { account } = this.findAccount(address, network);

    if (!account) {
      throw new Error(`Account not found: ${address}`);
    }

    if (!isValidFlowAddress(address)) {
      throw new Error(`Invalid address: ${address}`);
    }

    if (!isValidEthereumAddress(evmAddress)) {
      throw new Error(`Invalid evm address: ${evmAddress}`);
    }

    // Store the evm address for address in the evmAddressMap
    if (!this.evmAddressMap[address]) {
      this.evmAddressMap[address] = await createSessionStore<EvmAccountStore>({
        name: evmAccountKey(network, address),
        template: {
          parentAddress: address,
          evmAddress: evmAddress,
        },
      });
    } else {
      this.evmAddressMap[address].evmAddress = evmAddress;
    }
  };


  // TODO: Verify what this does... it doesn't look right
  setCurrentAccount = async (wallet: WalletAccount, key: ActiveChildType) => {
    this.store.currentAddress = wallet.address;
    if (isMainAccountType(key)) {
      // We're switching main accounts
      this.store.parentAddress = wallet.address;
    }
  };

  */

  /**
   * --------------------------------------------
   * Accessing the current account addresses
   * --------------------------------------------
   */

  getActiveAccounts = (): ActiveAccountsStore => {
    return (
      this.activeAccounts[this.store.network]?.[this.store.currentPubkey] ?? {
        parentAddress: null,
        currentAddress: null,
      }
    );
  };

  // Get the main account address for the current public key
  getParentAddress = (): FlowAddress | null => {
    return this.getActiveAccounts().parentAddress;
  };

  getCurrentAddress = (): WalletAddress | null => {
    return this.getActiveAccounts().currentAddress;
  };

  getActiveAccountType = (): ActiveAccountType => {
    return getActiveAccountTypeForAddress(this.getCurrentAddress(), this.getParentAddress());
  };

  private setActiveAccounts = async (newActiveAccounts: ActiveAccountsStore) => {
    const pubkey = this.store.currentPubkey;
    const network = this.store.network;
    console.trace('setActiveAccounts', network, newActiveAccounts);
    if (!pubkey) {
      throw new Error('Current pubkey is not set');
    }
    if (!network) {
      throw new Error('Network is not set');
    }
    this.activeAccounts[network][pubkey] = newActiveAccounts;

    // Save the data in storage
    await setUserData<ActiveAccountsStore>(activeAccountsKey(network, pubkey), newActiveAccounts);
  };
  /**
   * Set the current account - the actively selected account
   * Be careful to only call this once main accounts are loaded
   * If there is no active main account, it will select the first account in the list
   * @param parentAddress - The parent account address of whichever account you want to select
   * @param newCurrentAddress - The new current account address. This must either be:
   * - The parent address given in parentAddress
   * - The evm address of the parent account with parentAddress
   * - A child address of the parent account with parentAddress
   * @returns
   */
  setCurrentAccount = async (parentAddress: FlowAddress, newCurrentAddress: WalletAddress) => {
    // TODO: Should we validate the addresses here? How could it be possible to set an invalid address?
    await this.setActiveAccounts({
      parentAddress: parentAddress,
      currentAddress: newCurrentAddress,
    });
  };
  /**
   * Select the main account if a child account is selected
   * Be careful to only call this once main accounts are loaded
   * If there is no active main account, it will select the first account in the list
   * @returns
   */
  setCurrentAccountToParent = async () => {
    const activeAccounts = this.getActiveAccounts();
    if (activeAccounts.parentAddress) {
      await this.setActiveAccounts({
        parentAddress: activeAccounts.parentAddress,
        currentAddress: activeAccounts.parentAddress,
      });
    } else {
      await this.resetToFirstParentAccount();
    }
  };

  /**
   * Reset the selected address to the first account
   * Be careful to only call this once main accounts are loaded
   * @returns
   */
  resetToFirstParentAccount = async () => {
    const newActiveAccounts: ActiveAccountsStore = {
      parentAddress: null,
      currentAddress: null,
    };
    const mainAccounts = await this.getMainAccounts();
    if (mainAccounts) {
      // Main accounts are loaded
      if (mainAccounts.length > 0) {
        newActiveAccounts.parentAddress = mainAccounts[0].address as FlowAddress;
        newActiveAccounts.currentAddress = mainAccounts[0].address as WalletAddress;
      }
      await this.setActiveAccounts(newActiveAccounts);
    }
  };

  ensureValidActiveAccount = async (network: string, pubkey: string) => {
    // Get the main accounts
    const mainAccounts = await getValidData<MainAccount[]>(mainAccountsKey(network, pubkey));
    if (!mainAccounts) {
      // main accounts are not loaded yet
      throw new Error('Main accounts are not loaded before ensureValidActiveAccount is called');
    }
    // Get the active accounts
    const activeAccounts = this.getActiveAccounts();
    console.log(
      'ensureValidActiveAccount - before',
      network,
      pubkey,
      structuredClone(activeAccounts)
    );

    // Check the parent address is valid
    const activeMainAccount = mainAccounts.find(
      (account) => account.address === activeAccounts.parentAddress
    );
    if (!activeMainAccount) {
      // Reset to the first parent account
      return this.resetToFirstParentAccount();
    }
    // At least one main account matches our parent address
    if (activeAccounts.currentAddress === activeAccounts.parentAddress) {
      // The current address is the same as the parent address
      // So it must be a main account
      return;
    }
    if (isValidEthereumAddress(activeAccounts.currentAddress)) {
      // Check that the address matches the evm account address
      const evmAccount = await getValidData<EvmAccountStore>(
        evmAccountKey(network, activeAccounts.parentAddress as FlowAddress)
      );
      if (!evmAccount) {
        // Reset to the parent account
        return this.resetToFirstParentAccount();
      }
      if (evmAccount.address !== activeAccounts.currentAddress) {
        // Reset to the parent account
        return this.setActiveAccounts({
          parentAddress: activeAccounts.parentAddress,
          currentAddress: activeAccounts.parentAddress,
        });
      }
      // The current address is a valid evm address
      return;
    }
    // Check that the current address is a child address
    const childAccounts = await getValidData<WalletAccount[]>(
      childAccountsKey(network, activeAccounts.parentAddress as FlowAddress)
    );

    const childAccount = childAccounts?.find(
      (account) => account.address === activeAccounts.currentAddress
    );

    if (!childAccount) {
      // Reset to the parent account
      return this.setActiveAccounts({
        parentAddress: activeAccounts.parentAddress,
        currentAddress: activeAccounts.parentAddress,
      });
    }
    // The current address is a valid child address
    return;
  };

  /**
   * --------------------------------------------
   * Accessing wallets of addresses
   * --------------------------------------------
   */

  getMainAccounts = async (): Promise<MainAccount[] | null> => {
    const mainAccounts = await getValidData<MainAccount[]>(
      mainAccountsKey(this.getNetwork(), this.getCurrentPubkey())
    );
    return mainAccounts ?? null;
  };

  // Get the main account wallet for the current public key
  getParentAccount = async (): Promise<MainAccount | null> => {
    const address = this.getParentAddress();
    if (!address) {
      return null;
    }
    // Get the main accounts for the network
    const mainAccounts = await this.getMainAccounts();
    if (!mainAccounts) {
      return null;
    }

    // Find the main account that matches the address
    const mainAccount = mainAccounts.find((account) => account.address === address);
    if (mainAccount) {
      return mainAccount;
    }
    return null;
  };

  // Get the evm wallet of the current main account
  getEvmAccount = async (): Promise<WalletAccount | null> => {
    const parentAddress = this.getParentAddress() as FlowAddress;
    if (!parentAddress) {
      return null;
    }
    return await loadEvmAccountOfParent(this.store.network, parentAddress);
  };

  // Get the child accounts of the current main account
  getChildAccounts = async (): Promise<WalletAccount[] | null> => {
    const parentAddress = this.getParentAddress() as FlowAddress;
    if (!parentAddress) {
      return null;
    }
    const childAccounts = await getValidData<WalletAccount[]>(
      childAccountsKey(this.getNetwork(), parentAddress)
    );
    return childAccounts ?? null;
  };

  private getChildAccount = async (): Promise<WalletAccount | null> => {
    const childAddress = this.getCurrentAddress() as FlowAddress;
    const childAccounts = await this.getChildAccounts();
    if (!childAccounts) {
      // Child accounts are not loaded yet
      return null;
    }
    return childAccounts.find((account) => account.address === childAddress) ?? null;
  };

  getCurrentWallet = async (): Promise<WalletAccount | null> => {
    switch (this.getActiveAccountType()) {
      case 'main':
        return this.getParentAccount();
      case 'evm':
        return this.getEvmAccount();
      case 'child':
        try {
          return this.getChildAccount();
        } catch {
          console.error('Error getting child account');
          // We need to reset to the main account
          return null;
        }
      case 'none':
        return null;
    }
  };

  getCurrentEvmAddress = async (): Promise<EvmAddress | null> => {
    if (this.isLocked() || !this.getParentAddress()) {
      return null;
    }
    const evmAccount = await this.getEvmAccount();
    if (!evmAccount) {
      return null;
    }
    return evmAccount.address as EvmAddress;
  };

  /**
   * --------------------------------------------
   * User settings
   * --------------------------------------------
   */

  /**
   * --------------------------------------------
   * Transactions & Signing
   * --------------------------------------------
   */

  setupFcl = async () => {
    const isEmulatorMode = await this.getEmulatorMode();
    const network = this.getNetwork();
    await fclConfig(network, isEmulatorMode);
  };

  switchFclNetwork = async (network: FlowNetwork) => {
    const isEmulatorMode = await this.getEmulatorMode();
    await fclConfig(network, isEmulatorMode);
  };

  private extractScriptName = (cadence: string): string => {
    const scriptLines = cadence.split('\n');
    for (const line of scriptLines) {
      if (line.includes('// Flow Wallet')) {
        // '    // Flow Wallet - testnet Script  sendNFT - v2.31'
        const nameMatch = line.match(/\/\/ Flow Wallet -\s*(testnet|mainnet)\s*Script\s+(\w+)/);
        return nameMatch ? nameMatch[2] : 'unknown_script';
      }
    }
    return 'unknown_script';
  };

  sendTransaction = async (
    cadence: string,
    args: unknown[],
    shouldCoverFee: boolean = false
  ): Promise<string> => {
    const scriptName = this.extractScriptName(cadence);
    try {
      const allowed = await wallet.allowLilicoPay();
      const payerFunction = shouldCoverFee
        ? this.bridgeFeePayerAuthFunction
        : allowed
          ? this.payerAuthFunction
          : this.authorizationFunction;
      const txID = await fcl.mutate({
        cadence: cadence,
        args: () => args,
        proposer: this.authorizationFunction,
        authorizations: [
          this.authorizationFunction,
          shouldCoverFee ? this.bridgeFeePayerAuthFunction : null,
          // eslint-disable-next-line eqeqeq
        ].filter((auth) => auth != null),
        payer: payerFunction,
        limit: 9999,
      });

      return txID;
    } catch (error) {
      mixpanelTrack.track('script_error', {
        script_id: scriptName,
        error: error,
      });
      throw error;
    }
  };

  /**
   * Sign a message
   * @param signableMessage - The message to sign
   * @returns The signature
   */
  sign = async (signableMessage: string): Promise<string> => {
    // Ensure the wallet is unlocked as we're accessing the private key
    // Note we wouldn't be able to get the private key if the wallet is locked anyway..
    if (this.isLocked()) {
      throw new Error('Wallet is locked');
    }

    // Get the current public key
    const pubKey = this.store.currentPubkey;
    const keyTuple = await keyringService.getCurrentPublicPrivateKeyTuple();
    let signAlgo: number;
    let hashAlgo: number;
    let privateKey: string;
    if (pubKey === keyTuple.P256.pubK) {
      // The public key is the same as the private key
      // We can use the private key to sign the message
      signAlgo = SIGN_ALGO_NUM_ECDSA_P256;
      hashAlgo = HASH_ALGO_NUM_SHA3_256;
      privateKey = keyTuple.P256.pk;
    } else if (pubKey === keyTuple.SECP256K1.pubK) {
      // The public key is the SECP256K1 public key
      signAlgo = SIGN_ALGO_NUM_ECDSA_secp256k1;
      hashAlgo = HASH_ALGO_NUM_SHA2_256;
      privateKey = keyTuple.SECP256K1.pk;
    } else {
      throw new Error('Invalid public key');
    }
    // TODO: This is a temporary solution to get the private key
    const realSignature = await signWithKey(
      Buffer.from(signableMessage, 'hex').toString('hex'),
      signAlgo,
      hashAlgo,
      privateKey
    );
    return realSignature;
  };

  authorizationFunction = async (account) => {
    // authorization function need to return an account
    const address = fcl.withPrefix(await wallet.getMainAddress());
    const ADDRESS = fcl.withPrefix(address);
    // TODO: FIX THIS
    const KEY_ID = (await storage.get('keyIndex')) || 0;
    return {
      ...account, // bunch of defaults in here, we want to overload some of them though
      tempId: `${ADDRESS}-${KEY_ID}`, // tempIds are more of an advanced topic, for 99% of the times where you know the address and keyId you will want it to be a unique string per that address and keyId
      addr: fcl.sansPrefix(ADDRESS), // the address of the signatory, currently it needs to be without a prefix right now
      keyId: Number(KEY_ID), // this is the keyId for the accounts registered key that will be used to sign, make extra sure this is a number and not a string
      signingFunction: async (signable: { message: string }) => {
        // Singing functions are passed a signable and need to return a composite signature
        // signable.message is a hex string of what needs to be signed.
        return {
          addr: fcl.withPrefix(ADDRESS), // needs to be the same as the account.addr but this time with a prefix, eventually they will both be with a prefix
          keyId: Number(KEY_ID), // needs to be the same as account.keyId, once again make sure its a number and not a string
          signature: await this.sign(signable.message), // this needs to be a hex string of the signature, where signable.message is the hex value that needs to be signed
        };
      },
    };
  };

  signBridgeFeePayer = async (signable): Promise<string> => {
    const tx = signable.voucher;
    const message = signable.message;
    const envelope = await openapiService.signBridgeFeePayer(tx, message);
    const signature = envelope.envelopeSigs.sig;
    return signature;
  };

  signPayer = async (signable): Promise<string> => {
    const tx = signable.voucher;
    const message = signable.message;
    const envelope = await openapiService.signPayer(tx, message);
    const signature = envelope.envelopeSigs.sig;
    return signature;
  };

  signProposer = async (signable): Promise<string> => {
    const tx = signable.voucher;
    const message = signable.message;
    const envelope = await openapiService.signProposer(tx, message);
    const signature = envelope.envelopeSigs.sig;
    return signature;
  };

  proposerAuthFunction = async (account) => {
    // authorization function need to return an account
    const proposer = await openapiService.getProposer();
    const address = fcl.withPrefix(proposer.data.address);
    const ADDRESS = fcl.withPrefix(address);
    // TODO: FIX THIS
    const KEY_ID = proposer.data.keyIndex;
    return {
      ...account, // bunch of defaults in here, we want to overload some of them though
      tempId: `${ADDRESS}-${KEY_ID}`, // tempIds are more of an advanced topic, for 99% of the times where you know the address and keyId you will want it to be a unique string per that address and keyId
      addr: fcl.sansPrefix(ADDRESS), // the address of the signatory, currently it needs to be without a prefix right now
      keyId: Number(KEY_ID), // this is the keyId for the accounts registered key that will be used to sign, make extra sure this is a number and not a string
      signingFunction: async (signable) => {
        // Singing functions are passed a signable and need to return a composite signature
        // signable.message is a hex string of what needs to be signed.
        const signature = await this.signProposer(signable);
        return {
          addr: fcl.withPrefix(ADDRESS), // needs to be the same as the account.addr but this time with a prefix, eventually they will both be with a prefix
          keyId: Number(KEY_ID), // needs to be the same as account.keyId, once again make sure its a number and not a string
          signature: signature, // this needs to be a hex string of the signature, where signable.message is the hex value that needs to be signed
        };
      },
    };
  };

  payerAuthFunction = async (account) => {
    // authorization function need to return an account
    const payer = await wallet.getPayerAddressAndKeyId();
    const address = fcl.withPrefix(payer.address);
    const ADDRESS = fcl.withPrefix(address);
    // TODO: FIX THIS
    const KEY_ID = payer.keyId;
    return {
      ...account, // bunch of defaults in here, we want to overload some of them though
      tempId: `${ADDRESS}-${KEY_ID}`, // tempIds are more of an advanced topic, for 99% of the times where you know the address and keyId you will want it to be a unique string per that address and keyId
      addr: fcl.sansPrefix(ADDRESS), // the address of the signatory, currently it needs to be without a prefix right now
      keyId: Number(KEY_ID), // this is the keyId for the accounts registered key that will be used to sign, make extra sure this is a number and not a string
      signingFunction: async (signable) => {
        // Singing functions are passed a signable and need to return a composite signature
        // signable.message is a hex string of what needs to be signed.
        const signature = await this.signPayer(signable);
        return {
          addr: fcl.withPrefix(ADDRESS), // needs to be the same as the account.addr but this time with a prefix, eventually they will both be with a prefix
          keyId: Number(KEY_ID), // needs to be the same as account.keyId, once again make sure its a number and not a string
          signature: signature, // this needs to be a hex string of the signature, where signable.message is the hex value that needs to be signed
        };
      },
    };
  };
  bridgeFeePayerAuthFunction = async (account) => {
    // authorization function need to return an account
    const bridgeFeePayer = await wallet.getBridgeFeePayerAddressAndKeyId();
    const address = fcl.withPrefix(bridgeFeePayer.address);
    const ADDRESS = fcl.withPrefix(address);
    // TODO: FIX THIS
    const KEY_ID = bridgeFeePayer.keyId;
    return {
      ...account, // bunch of defaults in here, we want to overload some of them though
      tempId: `${ADDRESS}-${KEY_ID}`, // tempIds are more of an advanced topic, for 99% of the times where you know the address and keyId you will want it to be a unique string per that address and keyId
      addr: fcl.sansPrefix(ADDRESS), // the address of the signatory, currently it needs to be without a prefix right now
      keyId: Number(KEY_ID), // this is the keyId for the accounts registered key that will be used to sign, make extra sure this is a number and not a string
      signingFunction: async (signable) => {
        // Singing functions are passed a signable and need to return a composite signature
        // signable.message is a hex string of what needs to be signed.
        const signature = await this.signBridgeFeePayer(signable);
        return {
          addr: fcl.withPrefix(ADDRESS), // needs to be the same as the account.addr but this time with a prefix, eventually they will both be with a prefix
          keyId: Number(KEY_ID), // needs to be the same as account.keyId, once again make sure its a number and not a string
          signature: signature, // this needs to be a hex string of the signature, where signable.message is the hex value that needs to be signed
        };
      },
    };
  };

  /**
   * --------------------------------------------
   * Login & Sign In
   * --------------------------------------------
   */

  /**
   * Login with the current keyring
   * This is called immediately after switching unlocking or creating a keyring
   * That is - the keyring has been switched or created and we need to login with the new pubkey
   * The problem with this function is that we don't know which pubkey is the one to use
   * We have to query the indexer to find accounts for each pubkey in the tuple
   * @param pubKey - The public key to login with
   * @param replaceUser - Whether to replace the current user
   * @returns void
   */
  loginWithPublicPrivateKey = async (
    keyTuple: PublicPrivateKeyTuple,
    replaceUser = true
  ): Promise<void> => {
    // Get the network and store before we do anything async
    const network = this.getNetwork();
    // Get the public key tuple
    const pubKeyTuple = formPubKeyTuple(keyTuple);

    // Login anonymously if needed
    // We'll need to do this before we get the accounts
    const app = getApp(process.env.NODE_ENV!);
    const auth = getAuth(app);
    let idToken = await getAuth(app).currentUser?.getIdToken();
    if (idToken === null || !idToken) {
      // Sign in anonymously first
      const userCredential = await signInAnonymously(auth);
      idToken = await userCredential.user.getIdToken();
      if (idToken === null || !idToken) {
        throw new Error('Failed to get idToken - even after signing in anonymously');
      }
    }

    // Find any account with public key information
    const accounts = await getAccountsByPublicKeyTuple(pubKeyTuple, network);

    // If no accounts are found, then the registration process may not have been completed
    // Assume the default account key
    const accountKeyRequest =
      accounts.length === 0
        ? defaultAccountKey(pubKeyTuple)
        : pubKeyAccountToAccountKey(accounts[0]);

    // Get the private key from the private key tuple
    const privateKey = tupleToPrivateKey(keyTuple, accountKeyRequest.sign_algo);

    // Add the user domain tag
    const rightPaddedHexBuffer = (value, pad) =>
      Buffer.from(value.padEnd(pad * 2, 0), 'hex').toString('hex');
    const USER_DOMAIN_TAG = rightPaddedHexBuffer(Buffer.from('FLOW-V0.0-user').toString('hex'), 32);
    const message = USER_DOMAIN_TAG + Buffer.from(idToken, 'utf8').toString('hex');

    // Sign the message
    const realSignature = await signWithKey(
      message,
      accountKeyRequest.sign_algo,
      accountKeyRequest.hash_algo,
      privateKey
    );
    // Get the device info
    const deviceInfo = await this.getDeviceInfo();

    // Login with the signed message
    await wallet.openapi.loginV3(accountKeyRequest, deviceInfo, realSignature, replaceUser);

    // Set the current pubkey in userWallet provided we have been able to login
    this.setCurrentPubkey(accountKeyRequest.public_key);
  };
  /**
   * Login with the current keyring
   * This is called immediately after switching unlocking or creating a keyring
   * We also call it if we've been logged out but the wallet is unlocked
   * @param pubKey - The public key to login with
   * @param replaceUser - Whether to replace the current user
   * @returns The logged in account
   */
  loginWithKeyring = async (replaceUser = true) => {
    if (this.isLocked()) {
      // If the wallet is locked, we can't sign in
      return;
    }
    return this.loginWithPublicPrivateKey(
      // Get the current public private key tuple
      await keyringService.getCurrentPublicPrivateKeyTuple(),
      replaceUser
    );
  };

  /**
   * Login with a mnemonic
   * @param mnemonic - The mnemonic to login with
   * @param replaceUser - Whether to replace the current user
   * @param derivationPath - The derivation path to use
   * @param passphrase - The passphrase to use
   */
  loginWithMnemonic = async (
    mnemonic: string,
    replaceUser = true,
    derivationPath: string = FLOW_BIP44_PATH,
    passphrase: string = ''
  ) => {
    // Get the public private key
    const publicPrivateKey: PublicPrivateKeyTuple = await seedWithPathAndPhrase2PublicPrivateKey(
      mnemonic,
      derivationPath,
      passphrase
    );
    // Login with the public private key
    return this.loginWithPublicPrivateKey(publicPrivateKey, replaceUser);
  };

  /**
   * Sign in with a private key
   * @param privateKey - The private key to sign in with
   * @param replaceUser - Whether to replace the current user
   * @returns The logged in account
   */
  loginWithPk = async (privateKey: string, replaceUser = true) => {
    // Get the public key tuple
    const pubKeyTuple = await pk2PubKey(privateKey);
    // Combine the public key tuple and the private key
    const publicPrivateKey = combinePubPkString(pubKeyTuple, privateKey);
    // Login with the public private key
    return this.loginWithPublicPrivateKey(publicPrivateKey, replaceUser);
  };

  // @deprecated - use loginWithMnemonic instead
  loginV3_depreciated = async (
    mnemonic: string,
    accountKey: AccountKeyRequest,
    deviceInfo: DeviceInfoRequest,
    replaceUser = true
  ) => {
    const app = getApp(process.env.NODE_ENV!);
    const auth = getAuth(app);
    const idToken = await getAuth(app).currentUser?.getIdToken();
    if (idToken === null || !idToken) {
      signInAnonymously(auth);
      return;
    }

    const rightPaddedHexBuffer = (value, pad) =>
      Buffer.from(value.padEnd(pad * 2, 0), 'hex').toString('hex');
    const USER_DOMAIN_TAG = rightPaddedHexBuffer(Buffer.from('FLOW-V0.0-user').toString('hex'), 32);

    const hex = secp.utils.bytesToHex;
    const message = USER_DOMAIN_TAG + Buffer.from(idToken, 'utf8').toString('hex');

    const messageHash = await secp.utils.sha256(Buffer.from(message, 'hex'));

    // Get the private key tuple
    const publicPrivateKeyTuple = await seed2PublicPrivateKey(mnemonic);

    // NOTE: The private key for each type should be the same
    const privateKey: string = publicPrivateKeyTuple.SECP256K1.pk;

    // TODO: Look into the logic for this
    // We want to us a secp256k1 public key in this logic
    // We should be able to use the public key from the account key request...
    const publicKey = hex(secp.getPublicKey(privateKey).slice(1));
    if (accountKey.public_key === publicKey) {
      const signature = await secp.sign(messageHash, privateKey);
      const realSignature = secp.Signature.fromHex(signature).toCompactHex();
      return wallet.openapi.loginV3(accountKey, deviceInfo, realSignature, replaceUser);
    } else {
      return false;
    }
  };

  logoutCurrentUser = async () => {
    const app = getApp(process.env.NODE_ENV!);
    const auth = getAuth(app);
    await signInAnonymously(auth);
  };

  /**
   * Get the device info
   * @returns The device info
   */
  getDeviceInfo = async (): Promise<DeviceInfoRequest> => {
    const result = await wallet.openapi.getLocation();
    const installationId = await wallet.openapi.getInstallationId();
    // console.log('location ', userlocation);
    const userlocation = result.data;
    const deviceInfo: DeviceInfoRequest = {
      city: userlocation.city,
      continent: userlocation.country,
      continentCode: userlocation.countryCode,
      country: userlocation.country,
      countryCode: userlocation.countryCode,
      currency: userlocation.countryCode,
      device_id: installationId,
      district: '',
      ip: userlocation.query,
      isp: userlocation.as,
      lat: userlocation.lat,
      lon: userlocation.lon,
      name: 'FRW Chrome Extension',
      org: userlocation.org,
      regionName: userlocation.regionName,
      type: '2',
      user_agent: 'Chrome',
      zip: userlocation.zip,
    };
    return deviceInfo;
  };
}

// ------------------------------------------------------------------------------------------------
// Data loading methods for userWallet
// ------------------------------------------------------------------------------------------------
// We're going to keep polling the load of the main accounts for up to 2 mins
// It can take a while for a new account to be indexed by the indexer

const MAX_LOAD_TIME = 120_000; // 2 minutes
const POLL_INTERVAL = 2_000; // 2 seconds

/**
 * Load all accounts for a given public key
 * Called internally when the pubkey or network changes
 * Should not be awaited
 * @param network - The network to load the accounts for
 * @param pubKey - The public key to load the accounts for
 * @returns The main accounts for the given public key or null if not found. Does not throw an error.
 */
const loadAllAccountsWithPubKey = async (
  network: string,
  pubKey: string
): Promise<WalletAccount[]> => {
  if (!network || !pubKey) {
    throw new Error('Network and pubkey are required');
  }
  const mainAccounts = await retryOperation(
    async () => {
      const mainAccounts = await loadMainAccountsWithPubKey(network, pubKey);
      if (mainAccounts && mainAccounts.length > 0) {
        return mainAccounts;
      }
      throw new Error('Main accounts not yet loaded');
    },
    MAX_LOAD_TIME,
    POLL_INTERVAL
  );
  if (!mainAccounts || mainAccounts.length === 0) {
    throw new Error(
      `Failed to load main accounts even after trying for ${Math.round(MAX_LOAD_TIME / 1000 / 60)} minutes`
    );
  }
  // Now for each main account load the evm address and child accounts
  const childAndEvmAccounts = await Promise.all(
    mainAccounts.flatMap((mainAccount) => {
      return [
        loadEvmAccountOfParent(network, mainAccount.address),
        loadChildAccountsOfParent(network, mainAccount.address),
      ];
    })
  );

  return [...mainAccounts, ...childAndEvmAccounts.flatMap((account) => account)];
};

/**
 * Update the balances of a list of accounts, it is called after the main accounts are loaded and process asynchronously
 * Store in the data cache
 * @param network - The network to load the accounts for
 * @param addressList - The list of addresses to update
 */

const loadAccountListBalance = async (network: string, addressList: string[]) => {
  // Check if the network is valid
  if (!(await fclConfirmNetwork(network))) {
    // Do nothing if the network is not valid
    return;
  }

  const script = await getScripts(network, 'basic', 'getFlowBalanceForAnyAccounts');

  const accountsBalances = await fcl.query({
    cadence: script,
    args: (arg, t) => [arg(addressList, t.Array(t.String))],
  });
  // Cache all the balances
  return Promise.all(
    addressList.map((address) => {
      return setCachedData(
        accountBalanceKey(network, address),
        accountsBalances[address] || '0.00000000',
        Number(accountsBalances[address]) > 0 ? 60_000 : 1_000
      );
    })
  );
};

const loadAccountBalance = async (network: string, address: string) => {
  return loadAccountListBalance(network, [address]);
};

/**
 * Setup the main accounts for a given public key after registration is complete
 * Store in the data cache
 * @param network - The network to load the accounts for
 * @param pubKey - The public key to load the accounts for
 * @param account - The account structure getting from fcl after registration is complete
 * @returns The main accounts for the given public key or null if not found. Does not throw an error.
 */
const setupNewAccount = async (
  network: string,
  pubKey: string,
  account: FclAccount
): Promise<MainAccount[]> => {
  // Setup new account after
  const mainAccounts: MainAccount[] = [
    {
      keyIndex: account.keys[0].index,
      weight: account.keys[0].weight,
      signAlgo: account.keys[0].signAlgo,
      signAlgoString: account.keys[0].signAlgoString,
      hashAlgo: account.keys[0].hashAlgo,
      hashAlgoString: account.keys[0].hashAlgoString,
      address: withPrefix(account.address) as string,
      publicKey: account.keys[0].publicKey,
      chain: networkToChainId(network),
      id: 0,
      name: getEmojiByIndex(0).name,
      icon: getEmojiByIndex(0).emoji,
      color: getEmojiByIndex(0).bgcolor,
    },
  ];

  // Save the main accounts to the cache
  setCachedData(
    mainAccountsKey(network, pubKey),
    mainAccounts,
    mainAccounts.length > 0 ? 60_000 : 1_000
  );

  return mainAccounts;
};

/**
 * Load the main accounts for a given public key
 * Store in the data cache
 * @param network - The network to load the accounts for
 * @param pubKey - The public key to load the accounts for
 * @returns The main accounts for the given public key or null if not found. Does not throw an error.
 */
const loadMainAccountsWithPubKey = async (
  network: string,
  pubKey: string
): Promise<MainAccount[]> => {
  // Check if cache is still valid first
  const existing = await getValidData<MainAccount[]>(mainAccountsKey(network, pubKey));
  if (existing !== undefined) {
    return existing;
  }
  // Get the accounts for the current public key
  const accounts: PublicKeyAccount[] = await getAccountsWithPublicKey(pubKey, network);

  // Transform the address array into MainAccount objects
  const mainAccounts: MainAccount[] = (accounts || []).map(
    (publicKeyAccount, index): MainAccount => {
      const emoji = getEmojiByIndex(index);

      return {
        ...publicKeyAccount,
        chain: networkToChainId(network),
        id: index,
        name: emoji.name,
        icon: emoji.emoji,
        color: emoji.bgcolor,
      };
    }
  );

  // Save the main accounts to the cache
  setCachedData(
    mainAccountsKey(network, pubKey),
    mainAccounts,
    mainAccounts.length > 0 ? 60_000 : 1_000
  );

  return mainAccounts;
};

/**
 * Load the child accounts for a given main account address
 * Store in the data cache
 * @param network - The network to load the accounts for
 * @param mainAccountAddress - The main account address to load the accounts for
 * @returns The child accounts for the given main account address or null if not found. Does not throw an error.
 */ export const loadChildAccountsOfParent = async (
  network: string,
  mainAccountAddress: string
): Promise<WalletAccount[]> => {
  // Check if cache is still valid first
  const existing = await getValidData<WalletAccount[]>(
    childAccountsKey(network, mainAccountAddress)
  );
  if (existing !== undefined) {
    return existing;
  }
  const script = await getScripts(network, 'hybridCustody', 'getChildAccountMeta');

  if (!(await fclConfirmNetwork(network))) {
    // Do nothing if the network is switched
    // Don't update the cache
    return [];
  }
  const childAccountMap: ChildAccountMap = await fcl.query({
    cadence: script,
    args: (arg, t) => [arg(mainAccountAddress, t.Address)],
  });

  // Convert the child accounts to wallet accounts
  const childAccounts: WalletAccount[] = Object.entries(childAccountMap || {}).map(
    ([address, accountDetails], index) => {
      const childWallet: WalletAccount = {
        address: address,
        name: accountDetails.name ?? 'Unknown',
        icon: accountDetails.thumbnail.url ?? '',
        chain: networkToChainId(network),
        id: index,
        color: '#FFFFFF',
      };
      return childWallet;
    }
  );

  // Save the child accounts to the cache
  setCachedData(childAccountsKey(network, mainAccountAddress), childAccounts);

  return childAccounts;
};

// Load the EVM account
const loadEvmAccountOfParent = async (
  network: string,
  mainAccountAddress: string
): Promise<EvmAccountStore> => {
  // Check if cache is still valid first
  const existing = await getValidData<EvmAccountStore>(evmAccountKey(network, mainAccountAddress));
  if (existing) {
    return existing;
  }
  // TODO: If there's no EVM address, we might want to store null in the cache
  const nullEvmAccount: WalletAccount = {
    address: '',
    name: '',
    icon: '',
    color: '',
    chain: networkToChainId(network),
    id: 0,
  };
  if (!(await fclConfirmNetwork(network))) {
    // Do nothing if the network is switched
    // Don't update the cache
    return nullEvmAccount;
  }

  // this will only be called if the user's main account is valid
  const script = await getScripts(network as FlowNetwork, 'evm', 'getCoaAddr');

  const result = await fcl.query({
    cadence: script,
    args: (arg, t) => [arg(mainAccountAddress, t.Address)],
  });

  if (result) {
    // This is the COA address we get straight from the script
    // This is where we encode the address in ERC-55 format
    const checksummedAddress = ethUtil.toChecksumAddress(ensureEvmAddressPrefix(result));

    // The index of the evm wallet - always 0 as we only support one evm wallet
    const index = 0;
    // Add 9 to the index to get the evm emoji
    const emoji = getEmojiByIndex(index + 9);
    const evmAccount: WalletAccount = {
      address: checksummedAddress,
      name: emoji.name,
      icon: emoji.emoji,
      color: emoji.bgcolor,
      chain: networkToChainId(network),
      id: index,
    };
    // Save the EVM account to the cache
    setCachedData(evmAccountKey(network, mainAccountAddress), evmAccount);

    return evmAccount;
  } else {
    // If the script returns null, we need to clear the EVM account
    setCachedData(evmAccountKey(network, mainAccountAddress), nullEvmAccount);
    return nullEvmAccount;
  }
};

const initAccountLoaders = () => {
  registerRefreshListener(mainAccountsRefreshRegex, loadMainAccountsWithPubKey);
  registerRefreshListener(childAccountsRefreshRegex, loadChildAccountsOfParent);
  registerRefreshListener(evmAccountRefreshRegex, loadEvmAccountOfParent);
  registerRefreshListener(accountBalanceRefreshRegex, loadAccountBalance);
};

export default new UserWallet();
