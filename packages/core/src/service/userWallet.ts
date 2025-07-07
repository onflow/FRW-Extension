import * as secp from '@noble/secp256k1';
import * as fcl from '@onflow/fcl';
import type { Account as FclAccount } from '@onflow/typedefs';
import * as ethUtil from 'ethereumjs-util';
import { getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth/web-extension';

import { DEFAULT_WEIGHT, FLOW_BIP44_PATH } from '@/shared/constant/algo-constants';
import {
  combinePubPkString,
  type PublicPrivateKeyTuple,
  tupleToPrivateKey,
} from '@/shared/types/key-types';
import {
  type AccountKeyRequest,
  type DeviceInfoRequest,
  type FlowNetwork,
  networkToChainId,
} from '@/shared/types/network-types';
import {
  type ActiveAccountType,
  type ChildAccountMap,
  type EvmAddress,
  type FlowAddress,
  getActiveAccountTypeForAddress,
  type MainAccount,
  type PendingTransaction,
  type PublicKeyAccount,
  type WalletAccount,
  type WalletAddress,
} from '@/shared/types/wallet-types';
import {
  ensureEvmAddressPrefix,
  isValidEthereumAddress,
  isValidFlowAddress,
  withPrefix,
} from '@/shared/utils/address';
import {
  accountBalanceKey,
  accountBalanceRefreshRegex,
  mainAccountsKey,
  mainAccountsRefreshRegex,
  mainAccountStorageBalanceKey,
  mainAccountStorageBalanceRefreshRegex,
  type MainAccountStorageBalanceStore,
  pendingAccountCreationTransactionsKey,
  pendingAccountCreationTransactionsRefreshRegex,
  placeholderAccountsKey,
  placeholderAccountsRefreshRegex,
  userMetadataKey,
  type UserMetadataStore,
} from '@/shared/utils/cache-data-keys';
import { consoleError, consoleWarn } from '@/shared/utils/console-log';
import { getEmojiByIndex } from '@/shared/utils/emoji-util';
import { retryOperation } from '@/shared/utils/retryOperation';
import storage from '@/shared/utils/storage';
import { removeUserData, setUserData } from '@/shared/utils/user-data-access';
import {
  activeAccountsKey,
  type ActiveAccountsStore,
  getActiveAccountsData,
  userWalletsKey,
  type UserWalletStore,
} from '@/shared/utils/user-data-keys';

import { defaultAccountKey, pubKeyAccountToAccountKey } from '../utils/account-key';
import {
  clearCachedData,
  getCachedData,
  getValidData,
  registerBatchRefreshListener,
  registerRefreshListener,
  setCachedData,
} from '../utils/data-cache';
import { fclConfig, fclConfirmNetwork } from '../utils/fclConfig';
import {
  getAccountsByPublicKeyTuple,
  getAccountsWithPublicKey,
} from '../utils/modules/findAddressWithPubKey';
import {
  formPubKeyTuple,
  pk2PubKeyTuple,
  seed2PublicPrivateKey,
  seedWithPathAndPhrase2PublicPrivateKey,
  signWithKey,
} from '../utils/modules/publicPrivateKey';
import createPersistStore from '../utils/persistStore';

import keyringService from './keyring';
import { mixpanelTrack } from './mixpanel';
import openapiService, { getScripts } from './openapi';
import remoteConfigService from './remoteConfig';

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

  init = async () => {
    this.store = await createPersistStore<UserWalletStore>({
      name: userWalletsKey,
      template: USER_WALLET_TEMPLATE,
    });

    // Initialize the account loaders
    initAccountLoaders();
  };

  clear = async () => {
    if (!this.store) {
      await this.init();
    } else {
      Object.assign(this.store, USER_WALLET_TEMPLATE);
    }
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
    this.preloadAllAccounts(this.store.network, pubkey);
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
    this.preloadAllAccounts(this.store.network, pubkey);
  };

  /**
   * Gets the keyindex of current account
   * @returns Number the keyindex of current account
   */
  getKeyIndex = async () => {
    try {
      const parentAccount = await this.getParentAccount();
      if (!parentAccount) {
        throw new Error('Current wallet not found in accounts');
      }
      const keyIndex = parentAccount.keyIndex;

      return keyIndex;
    } catch (error) {
      throw new Error('Failed to get key index: ' + error.message);
    }
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
    this.preloadAllAccounts(network, this.store.currentPubkey);
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
    const enableEmulatorMode = await remoteConfigService.getFeatureFlag('emulator_mode');
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
      const enableEmulatorMode = await remoteConfigService.getFeatureFlag('emulator_mode');
      if (!enableEmulatorMode) {
        emulatorModeToSet = false;
      }
    }
    this.store.emulatorMode = emulatorModeToSet;
    await this.setupFcl();
  };

  // Moved from WalletController to UserWallet
  allowFreeGas = async (): Promise<boolean> => {
    const isFreeGasFeeKillSwitch = await remoteConfigService.getFeatureFlag('free_gas');
    const isFreeGasFeeEnabled = await storage.get('lilicoPayer');
    return isFreeGasFeeKillSwitch && isFreeGasFeeEnabled;
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
  preloadAllAccounts = async (network: string, pubkey: string) => {
    if (!network || !pubkey) {
      // Simply return if the network or pubkey is not yet set
      // Other methods will throw an error if they are not set
      return;
    }

    try {
      // Get the main accounts
      const allAccounts = await preloadAllAccountsWithPubKey(network, pubkey);

      // Get the active accounts
      await this.loadActiveAccounts(network, pubkey);

      // Load the balances for the main accounts
      await loadAccountListBalance(
        network,
        allAccounts
          .filter((account) => account.address && account.address.trim() !== '')
          .map((account) => account.address)
      );
    } catch (error) {
      consoleError('Error loading accounts', error);
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
  loadActiveAccounts = async (network: string, pubkey: string): Promise<ActiveAccountsStore> => {
    if (!network || !pubkey) {
      throw new Error('Network or pubkey is not valid');
    }
    const activeAccounts: ActiveAccountsStore | undefined = await getActiveAccountsData(
      network,
      pubkey
    );
    const validatedActiveAccounts = await this.validateActiveAccountStore(
      network,
      pubkey,
      activeAccounts
    );
    if (validatedActiveAccounts.parentAddress === null) {
      const mainAccounts = await this.getMainAccounts();
      if (mainAccounts.length === 0) {
        // If the parent address is null, we need to reset to the first parent account
        await removeUserData(activeAccountsKey(network, pubkey));
        return {
          parentAddress: null,
          currentAddress: null,
        };
      }
    } else if (
      validatedActiveAccounts.parentAddress !== null &&
      validatedActiveAccounts.currentAddress !== null &&
      (validatedActiveAccounts.parentAddress !== activeAccounts?.parentAddress ||
        validatedActiveAccounts.currentAddress !== activeAccounts?.currentAddress)
    ) {
      // Only update the active accounts if they have changed and the addresses are not null
      await setUserData<ActiveAccountsStore>(
        activeAccountsKey(network, pubkey),
        validatedActiveAccounts
      );
    }

    return validatedActiveAccounts;
  };

  /**
   * --------------------------------------------
   * Accessing the current account addresses
   * --------------------------------------------
   */
  getActiveAccountsWithPubKey = async (
    network: string,
    pubkey: string
  ): Promise<ActiveAccountsStore> => {
    if (!network || !pubkey) {
      throw new Error('Network or pubkey is not set');
    }

    const activeAccounts = await getActiveAccountsData(network, pubkey);

    if (!activeAccounts) {
      return this.loadActiveAccounts(network, pubkey);
    }

    return activeAccounts;
  };

  getActiveAccounts = async (): Promise<ActiveAccountsStore> => {
    const network = this.getNetwork();
    const pubkey = this.getCurrentPubkey();
    return this.getActiveAccountsWithPubKey(network, pubkey);
  };

  // Get the main account address for the current public key
  // This is whichever main account is currently selected by the user
  // Defaults to the first main account if no selection is made
  // Will only ever return null if there are no main accounts
  getParentAddress = async (): Promise<FlowAddress | null> => {
    return (await this.getActiveAccounts()).parentAddress;
  };

  getCurrentAddress = async (): Promise<WalletAddress | null> => {
    return (await this.getActiveAccounts()).currentAddress;
  };

  getActiveAccountType = async (): Promise<ActiveAccountType> => {
    return getActiveAccountTypeForAddress(
      await this.getCurrentAddress(),
      await this.getParentAddress()
    );
  };

  private setActiveAccounts = async (newActiveAccounts: ActiveAccountsStore) => {
    const pubkey = this.store.currentPubkey;
    const network = this.store.network;
    if (!pubkey) {
      throw new Error('Current pubkey is not set');
    }
    if (!network) {
      throw new Error('Network is not set');
    }

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
    const activeAccounts = await this.getActiveAccounts();
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

  /*
   * Ensure the active accounts are valid
   * This will return the active accounts if they are valid
   * Otherwise, if the parent account is valid, set the active account to that
   * Otherwise, reset to the first parent account
   * If there are no main accounts, set the active accounts to null
   */
  validateActiveAccountStore = async (
    network: string,
    pubkey: string,
    activeAccounts: ActiveAccountsStore | undefined
  ): Promise<ActiveAccountsStore> => {
    // Get the main accounts
    const mainAccounts = await getMainAccountsWithPubKey(network, pubkey);
    if (mainAccounts.length === 0) {
      // There are no main accounts - so the parent address is null.
      // This indicates that we've loaded the active accounts but there are no main accounts
      return {
        parentAddress: null,
        currentAddress: null,
      };
    }
    if (!activeAccounts) {
      // No active accounts - so we need to reset to the first parent account
      return {
        parentAddress: mainAccounts[0].address as FlowAddress,
        currentAddress: mainAccounts[0].address as WalletAddress,
      };
    }

    // Check the parent address is valid
    const activeMainAccount = mainAccounts.find(
      (account) => account.address === activeAccounts.parentAddress
    );

    if (!activeMainAccount) {
      // The parent address is not a valid main account
      // Reset to the first parent account
      return {
        parentAddress: mainAccounts[0].address as FlowAddress,
        currentAddress: mainAccounts[0].address as WalletAddress,
      };
    }

    // At least one main account matches our parent address
    if (activeAccounts.currentAddress === activeAccounts.parentAddress) {
      // The current address is the same as the parent address
      // A valid main account is selected
      return activeAccounts;
    }
    if (isValidEthereumAddress(activeAccounts.currentAddress)) {
      // Check that the address matches the evm account address
      const evmAccount = await this.getEvmAccount();
      if (evmAccount?.address === activeAccounts.currentAddress) {
        // The active account matches the evm account of the parent
        return activeAccounts;
      }
    } else {
      // Check that the current address is a child address
      const childAccounts = await this.getChildAccounts();

      const childAccount = childAccounts.find(
        (account) => account.address === activeAccounts.currentAddress
      );

      if (childAccount) {
        // The current address is a valid child address
        return activeAccounts;
      }
    }
    // Reset to the parent account
    return {
      parentAddress: activeAccounts.parentAddress,
      currentAddress: activeAccounts.parentAddress,
    };
  };

  /**
   * --------------------------------------------
   * Accessing wallets of addresses
   * --------------------------------------------
   */

  getMainAccounts = async (): Promise<MainAccount[]> => {
    const network = this.getNetwork();
    const pubkey = this.getCurrentPubkey();

    return getMainAccountsWithPubKey(network, pubkey);
  };

  // Get the main account wallet for the current public key
  getParentAccount = async (): Promise<MainAccount | null> => {
    const address = await this.getParentAddress();
    if (!address) {
      // There are no main accounts against the current pubkey
      return null;
    }
    // Get the main accounts for the network
    const mainAccounts = await this.getMainAccounts();

    // Find the main account that matches the address
    const mainAccount = mainAccounts.find((account) => account.address === address);
    if (!mainAccount) {
      // The main account is not found - throw an error
      throw new Error('Parent account not found');
    }
    return mainAccount;
  };

  // Get the evm wallet of the current main account
  getEvmAccount = async (): Promise<WalletAccount | null> => {
    return this.getEvmAccountOfParent((await this.getParentAddress()) ?? '');
  };

  // Get the evm wallet of the current main account
  getEvmAccountOfParent = async (parentAddress: string): Promise<WalletAccount | null> => {
    if (!parentAddress) {
      // There are no main accounts against the current pubkey
      return null;
    }
    const mainAccounts = await this.getMainAccounts();
    const mainAccount = mainAccounts.find((account) => account.address === parentAddress);
    if (!mainAccount) {
      // The main account is not found - throw an error
      throw new Error('Parent account not found');
    }
    return mainAccount.evmAccount ?? null;
  };
  // Get the child accounts of the current main account
  getChildAccounts = async (): Promise<WalletAccount[]> => {
    const parentAddress = await this.getParentAddress();
    if (!parentAddress) {
      // There are no main accounts against the current pubkey
      return [];
    }
    const mainAccounts = await this.getMainAccounts();
    const mainAccount = mainAccounts.find((account) => account.address === parentAddress);
    if (!mainAccount) {
      // The main account is not found - throw an error
      throw new Error('Parent account not found');
    }
    return mainAccount.childAccounts ?? [];
  };

  private getChildAccount = async (): Promise<WalletAccount | null> => {
    const childAddress = await this.getCurrentAddress();
    if (!childAddress) {
      throw new Error('Child address is not set');
    }
    const childAccounts = await this.getChildAccounts();
    const childAccount = childAccounts.find((account) => account.address === childAddress);
    if (!childAccount) {
      throw new Error('Child account not found');
    }
    return childAccount;
  };

  getCurrentWallet = async (): Promise<WalletAccount | null> => {
    switch (await this.getActiveAccountType()) {
      case 'main':
        return this.getParentAccount();
      case 'evm':
        return this.getEvmAccount();
      case 'child':
        return this.getChildAccount();
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
    if (evmAccount.address === '') {
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
      const allowed = await this.allowFreeGas();
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
    const parentAccount = await this.getParentAccount();
    if (!parentAccount) {
      throw new Error('Current wallet not found in accounts');
    }
    const signAlgo = parentAccount.signAlgo;
    const hashAlgo = parentAccount.hashAlgo;

    const keyTuple = await keyringService.getCurrentPublicPrivateKeyTuple();
    let privateKey: string;
    if (pubKey === keyTuple.P256.pubK) {
      privateKey = keyTuple.P256.pk;
    } else if (pubKey === keyTuple.SECP256K1.pubK) {
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
    const address = fcl.withPrefix(await this.getParentAddress());
    const ADDRESS = fcl.withPrefix(address);
    // TODO: FIX THIS
    const KEY_ID = await this.getKeyIndex();
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

  getPayerAddressAndKeyId = async (): Promise<{ address: string; keyId: number }> => {
    try {
      const network = this.getNetwork();
      const remoteConfig = await remoteConfigService.getRemoteConfig();
      return remoteConfig.config.payer[network];
    } catch (err) {
      consoleError(err);
      throw new Error('Payer address and keyId not found');
    }
  };

  payerAuthFunction = async (account) => {
    // authorization function need to return an account
    const payer = await this.getPayerAddressAndKeyId();
    if (!payer) {
      throw new Error('Payer address and keyId not found');
    }
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

  getBridgeFeePayerAddressAndKeyId = async () => {
    try {
      const network = this.getNetwork();
      const remoteConfig = await remoteConfigService.getRemoteConfig();
      if (!remoteConfig.config.bridgeFeePayer) {
        throw new Error('Bridge fee payer not found');
      }
      return remoteConfig.config.bridgeFeePayer[network];
    } catch (err) {
      consoleError(err);
      throw new Error('Bridge fee payer address and keyId not found');
    }
  };

  bridgeFeePayerAuthFunction = async (account) => {
    // authorization function need to return an account
    const bridgeFeePayer = await this.getBridgeFeePayerAddressAndKeyId();
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
    await openapiService.loginV3(accountKeyRequest, deviceInfo, realSignature, replaceUser);

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
    const pubKeyTuple = await pk2PubKeyTuple(privateKey);
    // Combine the public key tuple and the private key
    const publicPrivateKey = combinePubPkString(pubKeyTuple, privateKey);
    // Login with the public private key
    return this.loginWithPublicPrivateKey(publicPrivateKey, replaceUser);
  };

  /**
   * @deprecated use loginWithMnemonic instead
   */
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
      return openapiService.loginV3(accountKey, deviceInfo, realSignature, replaceUser);
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
    const result = await openapiService.getLocation();
    const installationId = await openapiService.getInstallationId();
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
const preloadAllAccountsWithPubKey = async (
  network: string,
  pubKey: string
): Promise<WalletAccount[]> => {
  if (!network || !pubKey) {
    throw new Error('Network and pubkey are required');
  }

  let mainAccounts: MainAccount[] = [];
  try {
    mainAccounts = await retryOperation(
      async () => {
        try {
          const accounts = await getMainAccountsWithPubKey(network, pubKey);

          if (accounts && accounts.length > 0) {
            return accounts;
          }

          throw new Error('Main accounts not yet loaded');
        } catch (error) {
          throw error;
        }
      },
      MAX_LOAD_TIME / POLL_INTERVAL,
      POLL_INTERVAL
    );
  } catch (error) {
    consoleError('Failed to load main accounts after maximum retries:', error.message);
  }

  if (!mainAccounts || mainAccounts.length === 0) {
    consoleWarn(`No main accounts loaded for pubkey: ${pubKey}`);
    return [];
  }

  return mainAccounts;
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
    throw new Error('Network has been switched');
  }

  const script = await getScripts(network, 'basic', 'getFlowBalanceForAnyAccounts');

  const accountsBalances: { [address: string]: string } = await fcl.query({
    cadence: script,
    args: (arg, t) => [arg(addressList, t.Array(t.String))],
  });
  // Cache all the balances
  return Promise.all(
    addressList.map(async (address) => {
      await setCachedData(
        accountBalanceKey(network, address),
        accountsBalances[address] || '0.00000000',
        5_000
      );
      return accountsBalances[address];
    })
  );
};

export const loadAccountBalance = async (network: string, address: string) => {
  const balanceList = await loadAccountListBalance(network, [address]);
  if (balanceList.length !== 1) {
    throw new Error('Invalid balance list');
  }
  return balanceList[0];
};

export const loadMainAccountStorageBalance = async (
  network: string,
  address: string
): Promise<MainAccountStorageBalanceStore> => {
  // Check if the network is valid
  if (!(await fclConfirmNetwork(network))) {
    // Do nothing if the network is not valid
    throw new Error('Network has been switched');
  }
  if (!isValidFlowAddress(address)) {
    throw new Error('Invalid address');
  }
  const storageBalance: MainAccountStorageBalanceStore = await openapiService.getFlowAccountInfo(
    network,
    address
  );

  setCachedData(mainAccountStorageBalanceKey(network, address), storageBalance);
  return storageBalance;
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
  const indexOfKey = account.keys.findIndex((key) => key.publicKey === pubKey);
  if (indexOfKey === -1) {
    throw new Error('Key not found');
  }
  // Setup new account after registration is complete
  const mainAccounts: MainAccount[] = [
    {
      keyIndex: account.keys[indexOfKey].index,
      weight: account.keys[indexOfKey].weight,
      signAlgo: account.keys[indexOfKey].signAlgo,
      signAlgoString: account.keys[indexOfKey].signAlgoString,
      hashAlgo: account.keys[indexOfKey].hashAlgo,
      hashAlgoString: account.keys[indexOfKey].hashAlgoString,
      address: withPrefix(account.address) as string,
      publicKey: account.keys[indexOfKey].publicKey,
      chain: networkToChainId(network),
      id: indexOfKey,
      name: getEmojiByIndex(indexOfKey).name,
      icon: getEmojiByIndex(indexOfKey).emoji,
      color: getEmojiByIndex(indexOfKey).bgcolor,
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
 * Get the main accounts for a given public key
 * @param network - The network to load the accounts for
 * @param pubkey - The public key to load the accounts for
 * @returns The main accounts for the given public key or null if not found. Does not throw an error.
 */
const getMainAccountsWithPubKey = async (
  network: string,
  pubkey: string
): Promise<MainAccount[]> => {
  if (!network || !pubkey) {
    throw new Error('Network or pubkey is not set');
  }
  const mainAccounts = await getValidData<MainAccount[]>(mainAccountsKey(network, pubkey));
  if (!mainAccounts) {
    return loadMainAccountsWithPubKey(network, pubkey);
  }
  return mainAccounts;
};

// Cache for in-flight requests to prevent race conditions
const metadataRequestCache = new Map<
  string,
  Promise<Record<string, { background: string; icon: string; name: string }>>
>();

/**
 * Fetch user metadata from cache or API
 * @param pubKey - The public key to fetch metadata for
 * @returns Promise<Record<string, { background: string; icon: string; name: string }>>
 */
const fetchUserMetadata = async (
  pubKey: string
): Promise<Record<string, { background: string; icon: string; name: string }>> => {
  let customMetadata: Record<string, { background: string; icon: string; name: string }> = {};

  try {
    // Try to get from cache first
    const cachedMetadata = await getCachedData<UserMetadataStore>(userMetadataKey(pubKey));

    if (cachedMetadata) {
      customMetadata = cachedMetadata as UserMetadataStore;
    } else {
      // Check if there's already a request in progress for this pubKey
      const cacheKey = userMetadataKey(pubKey);
      if (metadataRequestCache.has(cacheKey)) {
        customMetadata = await metadataRequestCache.get(cacheKey)!;
      } else {
        const requestPromise = (async () => {
          const metadataResponse = await openapiService.getUserMetadata();
          let result: Record<string, { background: string; icon: string; name: string }> = {};

          if (metadataResponse?.data) {
            result = metadataResponse.data as UserMetadataStore;
          } else if (metadataResponse && typeof metadataResponse === 'object') {
            result = metadataResponse as UserMetadataStore;
          }

          // Cache the result
          await setCachedData(userMetadataKey(pubKey), result, 300_000);
          return result;
        })();

        metadataRequestCache.set(cacheKey, requestPromise);
        customMetadata = await requestPromise;
        metadataRequestCache.delete(cacheKey);
      }
    }
  } catch (error) {
    consoleError('Failed to fetch user metadata:', error);
  }

  return customMetadata;
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
  // Get the accounts for the current public key
  const accounts: PublicKeyAccount[] = await getAccountsWithPublicKey(pubKey, network);

  // Get the placeholder accounts for the current public key
  const placeholderAccounts = await getPlaceholderAccounts(network, pubKey);

  const filteredPlaceholderAccounts = placeholderAccounts.filter((placeholderAccount) => {
    // Filter out placeholder accounts that are indexed
    return !accounts.some((account) => account.address === placeholderAccount.address);
  });

  if (filteredPlaceholderAccounts.length < placeholderAccounts.length) {
    // Remove the placeholder accounts that are indexed
    await setCachedData(
      placeholderAccountsKey(network, pubKey),
      filteredPlaceholderAccounts,
      360_000
    );
  }

  const mainPublicKeyAccounts: PublicKeyAccount[] = [...accounts, ...filteredPlaceholderAccounts];

  // Fetch custom metadata from cache or API
  const customMetadata = await fetchUserMetadata(pubKey);

  // Transform the address array into MainAccount objects
  const mainAccounts: MainAccount[] = mainPublicKeyAccounts.map(
    (publicKeyAccount, index): MainAccount => {
      const defaultEmoji = getEmojiByIndex(index);

      // Check if there's custom metadata for this address
      const customData = customMetadata[publicKeyAccount.address];

      return {
        ...publicKeyAccount,
        chain: networkToChainId(network),
        id: index,
        name: customData?.name || defaultEmoji.name,
        icon: customData?.icon || defaultEmoji.emoji,
        color: customData?.background || defaultEmoji.bgcolor,
      };
    }
  );

  // Load all accounts detail
  const accountDetailMap = await loadAccountsDetail(
    network,
    mainAccounts.map((mainAccount) => mainAccount.address)
  );

  const mainAccountsWithDetail: MainAccount[] = mainAccounts.map((mainAccount) => {
    const accountDetail = accountDetailMap[mainAccount.address];
    const evmAccount = !!accountDetail.COAs?.length
      ? evmAddressToWalletAccount(network, accountDetail.COAs[0])
      : undefined;

    // Apply custom metadata to evmAccount if it exists
    if (evmAccount && evmAccount.address) {
      const evmCustomData = customMetadata[evmAccount.address];
      if (evmCustomData) {
        evmAccount.name = evmCustomData.name || evmAccount.name;
        evmAccount.icon = evmCustomData.icon || evmAccount.icon;
        evmAccount.color = evmCustomData.background || evmAccount.color;
      }
    }

    return {
      ...mainAccount,
      evmAccount,
      childAccounts: childAccountMapToWalletAccounts(network, accountDetail.childrens),
    };
  });

  // Save the merged accounts to the cache
  setCachedData(
    mainAccountsKey(network, pubKey),
    mainAccountsWithDetail,
    mainAccountsWithDetail.length > 0 ? 60_000 : 1_000
  );

  return mainAccountsWithDetail;
};

type AccountsDetail = {
  flowBalance: string;
  nftCounts: number;
  childrens: ChildAccountMap; // terrible spelling, but it's the name of the field in the script
  COAs: EvmAddress[];
};

type AccountDetailMap = {
  [key: string]: AccountsDetail;
};

/**
 * Load child and evm accounts for a list of main accounts
 * @param network - The network to load the accounts for
 * @param mainAccounts - The main accounts to load the accounts for
 * @returns The child and evm accounts for the given main accounts
 */

const loadAccountsDetail = async (
  network: string,
  mainAccountAddresses: string[]
): Promise<AccountDetailMap> => {
  const script = await getScripts(network, 'basic', 'getAccountsDetail');

  const accountsDetail: AccountDetailMap = await fcl.query({
    cadence: script,
    args: (arg, t) => [arg(mainAccountAddresses, t.Array(t.Address))],
  });

  return accountsDetail;
};

const childAccountMapToWalletAccounts = (
  network: string,
  childAccountMap: ChildAccountMap
): WalletAccount[] => {
  // Convert the child accounts to wallet accounts
  const childAccounts: WalletAccount[] = Object.entries(childAccountMap || {}).map(
    ([address, accountDetails], index) => {
      const childWallet: WalletAccount = {
        address: address,
        name: accountDetails?.name ?? 'Unknown',
        icon: accountDetails?.thumbnail?.url ?? '',
        chain: networkToChainId(network),
        id: index,
        color: '#FFFFFF',
      };
      return childWallet;
    }
  );
  return childAccounts;
};

/**
 * Convert an EVM address to a wallet account
 * @param network - The network to load the accounts for
 * @param evmAddress - The EVM address to convert to a wallet account
 * @returns The wallet account for the given EVM address or null if not found. Does not throw an error.
 */
const evmAddressToWalletAccount = (network: string, evmAddress?: EvmAddress): WalletAccount => {
  if (!evmAddress) {
    const nullEvmAccount: WalletAccount = {
      address: '',
      name: '',
      icon: '',
      color: '',
      chain: networkToChainId(network),
      id: 0,
    };
    return nullEvmAccount;
  }

  // This is the COA address we get straight from the script
  // This is where we encode the address in ERC-55 format
  const checksummedAddress = ethUtil.toChecksumAddress(ensureEvmAddressPrefix(evmAddress));

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

  return evmAccount;
};

/**
 * --------------------------------------------
 * Account Creation Pending Transactions and Accounts
 * --------------------------------------------
 */

/**
 * Step 1 - Add a pending account creation transaction
 * @param txId - The transaction ID
 * @param network - The network
 * @param pubkey - The public key
 * @param accountId - The account ID
 */
export const addPendingAccountCreationTransaction = async (
  network: string,
  pubkey: string,
  txId: string,
  replaceRandomTxId?: string
): Promise<void> => {
  const existingPending =
    (await getValidData<PendingTransaction[]>(
      pendingAccountCreationTransactionsKey(network, pubkey)
    )) || [];

  // Remove any existing pending transaction with the same txId
  const filtered = existingPending.filter(
    (pendingTxId) =>
      pendingTxId !== txId && (replaceRandomTxId ? pendingTxId !== replaceRandomTxId : true)
  );
  filtered.push(txId);

  // Set it to 3 minutes. That should be enough time to get the address created and indexed
  await setCachedData(pendingAccountCreationTransactionsKey(network, pubkey), filtered, 360_000);
};

/**
 * Remove a pending account creation transaction
 * @param network - The network
 * @param pubkey - The public key
 * @param txId - The transaction ID
 */
export const removePendingAccountCreationTransaction = async (
  network: string,
  pubkey: string,
  txId: string
): Promise<void> => {
  const existingPending =
    (await getValidData<PendingTransaction[]>(
      pendingAccountCreationTransactionsKey(network, pubkey)
    )) || [];

  const filtered = existingPending.filter((pendingTxId) => pendingTxId !== txId);
  await setCachedData(pendingAccountCreationTransactionsKey(network, pubkey), filtered, 360_000);
};

/**
 * Get the placeholder accounts for a given public key
 * @param network - The network to load the accounts for
 * @param pubkey - The public key to load the accounts for
 * @returns The placeholder accounts for the given public key or null if not found. Does not throw an error.
 */
const getPlaceholderAccounts = async (
  network: string,
  pubkey: string
): Promise<PublicKeyAccount[]> => {
  return (await getValidData<PublicKeyAccount[]>(placeholderAccountsKey(network, pubkey))) || [];
};

/**
 * Step 2 - Add a placeholder account with real account data after address creation succeeds
 * Updates existing placeholder or creates new account if placeholder not found
 * @param network - The network the account is on ('mainnet' or 'testnet')
 * @param pendingAccountId - The ID of the placeholder account to update
 * @param account - The FCL account object containing the real account data
 * @param txId - The transaction ID to remove from pending creation transactions
 * @returns void
 */
export const addPlaceholderAccount = async (
  network: string,
  pubkey: string,
  txId: string,
  account: FclAccount
) => {
  const keyIndex = account.keys.findIndex(
    (key) => key.publicKey === pubkey && key.weight >= DEFAULT_WEIGHT
  );
  if (keyIndex === -1) {
    throw new Error('Key not found');
  }

  const newAccount: PublicKeyAccount = {
    address: fcl.withPrefix(account.address),
    publicKey: pubkey,
    keyIndex: keyIndex,
    weight: account.keys[keyIndex].weight,
    signAlgo: account.keys[keyIndex].signAlgo,
    signAlgoString: account.keys[keyIndex].signAlgoString,
    hashAlgo: account.keys[keyIndex].hashAlgo,
    hashAlgoString: account.keys[keyIndex].hashAlgoString,
  };

  return await addPlaceholderPublicKeyAccount(network, pubkey, txId, newAccount);
};

export const addPlaceholderPublicKeyAccount = async (
  network: string,
  pubkey: string,
  txId: string,
  account: PublicKeyAccount
) => {
  const placeholderAccounts = await getPlaceholderAccounts(network, pubkey);

  // Update the pending accounts
  placeholderAccounts.push(account);

  // Set to 3 minutes. That should be enough time to get the account indexed
  await setCachedData(placeholderAccountsKey(network, pubkey), placeholderAccounts, 360_000);

  await loadMainAccountsWithPubKey(network, pubkey);

  // Provided no errors, remove the pending transaction
  // Remove from pending creation transactions once the account is created
  await removePendingAccountCreationTransaction(network, pubkey, txId);
};

const clearPlaceholderAccounts = async (network: string, pubkey: string) => {
  await clearCachedData(placeholderAccountsKey(network, pubkey));
};

const clearPendingAccountCreationTransactions = async (network: string, pubkey: string) => {
  await clearCachedData(pendingAccountCreationTransactionsKey(network, pubkey));
};

const initAccountLoaders = () => {
  registerRefreshListener(mainAccountsRefreshRegex, loadMainAccountsWithPubKey);

  // Use batch refresh for account balances to avoid hitting the backend too hard
  registerBatchRefreshListener(
    accountBalanceRefreshRegex,
    async (network: string, addresses: string[]) => {
      // Load the balances for all addresses
      const balances = await loadAccountListBalance(network, addresses);

      // Convert to a record keyed by address
      const result: Record<string, string> = {};
      addresses.forEach((address, index) => {
        result[address] = balances[index] || '0.00000000';
      });
      return result;
    },
    (matches) => matches[2], // Extract address from the regex match
    (network: string, address: string) => accountBalanceKey(network, address),
    100 // 100ms batch window
  );

  registerRefreshListener(mainAccountStorageBalanceRefreshRegex, loadMainAccountStorageBalance);
  registerRefreshListener(placeholderAccountsRefreshRegex, clearPlaceholderAccounts);
  registerRefreshListener(
    pendingAccountCreationTransactionsRefreshRegex,
    clearPendingAccountCreationTransactions
  );
};

export default new UserWallet();
