import * as secp from '@noble/secp256k1';
import * as fcl from '@onflow/fcl';
import { getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth/web-extension';

import wallet from '@/background/controller/wallet';
import keyringService from '@/background/service/keyring';
import { mixpanelTrack } from '@/background/service/mixpanel';
import openapiService from '@/background/service/openapi';
import { getLoggedInAccount } from '@/background/utils/getLoggedInAccount';
import {
  signWithKey,
  seed2PublicPrivateKey,
  seed2PublicPrivateKeyTemp,
  seedWithPathAndPhrase2PublicPrivateKey,
} from '@/background/utils/modules/publicPrivateKey';
import createPersistStore from '@/background/utils/persisitStore';
import { type HashAlgoString, type SignAlgoString } from '@/shared/types/algo-types';
import { type PublicPrivateKeyTuple, type PublicKeyTuple } from '@/shared/types/key-types';
import {
  type LoggedInAccount,
  type ActiveChildType,
  type FlowAddress,
  type EvmAddress,
  type WalletAccount,
  type ChildAccountMap,
  type UserWalletStore,
  type ProfileAccountStore,
  type ChildAccountStore,
  type EvmAccountStore,
  isEvmAccountType,
  isMainAccountType,
} from '@/shared/types/wallet-types';
import { isValidEthereumAddress, isValidFlowAddress, withPrefix } from '@/shared/utils/address';
import { getHashAlgo, getSignAlgo } from '@/shared/utils/algo';
import { FLOW_BIP44_PATH } from '@/shared/utils/algo-constants';

import type { DeviceInfoRequest, FlowNetwork } from '../../shared/types/network-types';
import {
  type WalletProfile,
  type PublicKeyAccount,
  type MainAccount,
} from '../../shared/types/wallet-types';
import { fclConfig } from '../fclConfig';
import { createSessionStore } from '../utils';
import { findAddressWithPK } from '../utils/modules/findAddressWithPK';
import { getAccountsByPublicKeyTuple } from '../utils/modules/findAddressWithPubKey';
import { storage } from '../webapi';

const USER_WALLET_TEMPLATE: UserWalletStore = {
  activeChild: null,
  evmEnabled: false,
  monitor: 'flowscan',
  network: 'mainnet',
  emulatorMode: false,
  currentPubkey: '',
  currentAddress: '',
  parentAddress: '',
};
class UserWallet {
  store!: UserWalletStore;
  accounts: {
    mainnet: WalletProfile[];
    testnet: WalletProfile[];
  } = {
    mainnet: [],
    testnet: [],
  };

  // This is a map of the child accounts for each address
  childAccountMap: Map<FlowNetwork, Map<FlowAddress, ChildAccountStore>> = new Map();

  // This is a map of the evm addresses for each address
  evmAddressMap: Map<FlowNetwork, Map<FlowAddress, string>> = new Map();

  init = async () => {
    this.store = await createPersistStore<UserWalletStore>({
      name: 'userWallets',
      template: USER_WALLET_TEMPLATE,
    });

    this.accounts = {
      mainnet: [],
      testnet: [],
    };

    this.childAccountMap = new Map();
    this.evmAddressMap = new Map();
  };

  clear = async () => {
    if (!this.store) {
      await this.init();
    } else {
      Object.assign(this.store, USER_WALLET_TEMPLATE);
    }
    this.accounts = {
      mainnet: [],
      testnet: [],
    };
  };
  isLocked = () => {
    return !keyringService.isBooted() || !keyringService.memStore.getState().isUnlocked;
  };

  setMainAccounts = async (accounts: MainAccount[], pubKey: string, network: string) => {
    const profileList: WalletProfile[] = this.accounts[network];
    const accountIndex = profileList.findIndex((account) => account.publicKey === pubKey);
    this.setCurrentPubkey(pubKey);
    if (accountIndex !== -1) {
      // assign the accounts to the profile
      profileList[accountIndex].accounts = accounts;
    } else {
      // Create a new session store and push it to the profile list
      profileList.push(
        await createSessionStore<ProfileAccountStore>({
          name: `profile-accounts-${network}-${pubKey}`,
          template: {
            accounts: accounts,
            publicKey: pubKey,
          },
        })
      );
    }
    this.store.currentAddress = accounts[0].address;
    this.store.parentAddress = accounts[0].address;

    return profileList;
  };

  setCurrentPubkey = (pubkey: string) => {
    this.store.currentPubkey = pubkey;
  };

  switchAccount = (pubkey: string) => {
    if (!pubkey) {
      console.warn('Invalid pubkey provided to switchAccount');
      return;
    }

    const profileList: WalletProfile[] = this.accounts[this.store.network];

    const profile = profileList.find((group) => {
      const matches = group.publicKey === pubkey;

      return matches;
    });

    if (!profile || !profile.accounts.length) {
      console.warn(`No account found for pubkey: ${pubkey.slice(0, 10)}...`);
      return;
    }

    this.store.currentPubkey = pubkey;
    // Note we could support persisting the selected wallet for a given profile across sessions
    // For now just use the first main account as the current wallet
    this.store.currentAddress = profile.accounts[0].address;
    this.store.parentAddress = profile.accounts[0].address;
  };

  getCurrentPubkey = (): string => {
    return this.store.currentPubkey;
  };

  // Helper method to find account in current accounts
  private findAccount = (
    address: string,
    network: string
  ): {
    account: PublicKeyAccount | null;
    currentAccounts: WalletProfile[];
  } => {
    const profileList: WalletProfile[] = this.accounts[network];

    // First try to find account group using currentPubkey
    let accountGroupIndex = profileList.findIndex(
      (group) => group.publicKey === this.store.currentPubkey
    );

    // If not found with currentPubkey, fallback to searching by address
    if (accountGroupIndex === -1) {
      accountGroupIndex = profileList.findIndex((group) =>
        group.accounts.some((account) => account.address === address)
      );
    }

    if (accountGroupIndex === -1) {
      console.warn(`No account group found containing address ${address}`);
      return { account: null, currentAccounts: profileList };
    }

    const accountIndex = profileList[accountGroupIndex].accounts.findIndex(
      (account) => account.address === address
    );

    if (accountIndex === -1) {
      console.warn(`Address ${address} not found in account group`);
      return { account: null, currentAccounts: profileList };
    }

    return {
      account: profileList[accountGroupIndex].accounts[accountIndex] as PublicKeyAccount,
      currentAccounts: profileList,
    };
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
        name: `child-accounts-${network}-${address}`,
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
   */
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
        name: `evm-account-${network}-${address}`,
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

  getActiveAccountType = (): ActiveChildType => {
    const parentAddress = this.store.parentAddress;
    const currentAddress = this.store.currentAddress;

    if (parentAddress === currentAddress) {
      // If ActiveChildType is null, it means the active wallet is the main account
      return null;
    }
    if (isValidEthereumAddress(currentAddress)) {
      // The evm account is the active wallet
      return 'evm';
    } else if (isValidFlowAddress(currentAddress)) {
      // If ActiveChildType is a flow address, it means the active wallet is a child account
      return currentAddress;
    }
    throw new Error(`Invalid active wallet address: ${currentAddress}`);
  };

  getParentAddress = async (network: string): Promise<FlowAddress | null> => {
    if (!keyringService.isBooted() || !keyringService.memStore.getState().isUnlocked) {
      return null;
    }
    const address = this.store.parentAddress;
    const prefixedAddress = withPrefix(address);
    return isValidFlowAddress(prefixedAddress) ? prefixedAddress : null;
  };

  returnParentWallet = async (network: string): Promise<MainAccount | null> => {
    if (!keyringService.isBooted() || !keyringService.memStore.getState().isUnlocked) {
      return null;
    }
    const address = this.store.parentAddress;
    const pubkey = this.store.currentPubkey;
    const profileList: WalletProfile[] = this.accounts[network];
    const profile = profileList.find((account) => account.publicKey === pubkey);
    if (profile) {
      return profile.accounts.find((account) => account.address === address) || null;
    }
    return null;
  };

  getCurrentAddress = (): FlowAddress | EvmAddress | null => {
    const address = this.store.currentAddress;

    return withPrefix(address);
  };

  /*
  This returns the currently selected wallet for the current profile and current network
  Note in the future, we could support persisting the selected wallet for a given profile across sessions
  */

  getCurrentWallet = (): WalletAccount | null => {
    if (this.isLocked()) {
      return null;
    }
    const activeType = this.getActiveAccountType();

    const network = this.store.network;
    const address = this.store.parentAddress;
    const pubkey = this.store.currentPubkey;

    const profileList: WalletProfile[] = this.accounts[network];
    const profile = profileList.find((profile) => profile.publicKey === pubkey);
    if (profile) {
      const account = profile.accounts.find((account) => account.address === address) || null;
      if (!account) {
        return null;
      }
      if (isEvmAccountType(activeType)) {
        const evmWallet = {
          ...account,
          address: this.getCurrentEvmAddress() || '',
          name: 'Lemon',
          icon: '🍋',
          color: '#FFD700',
          pubK: this.store.currentPubkey,
        };
        return evmWallet;
      } else if (isMainAccountType(activeType)) {
        return account;
      } else {
        // activeType is the address of the child account
        const networkChildAccountStore: ChildAccountStore | undefined =
          this.childAccountMap[network]?.[address];
        const childAccountDetails = networkChildAccountStore?.accounts[activeType];
        const childWallet = {
          ...account,
          address: activeType,
          name: childAccountDetails?.name ?? 'Unknown',
          icon: childAccountDetails?.thumbnail?.url ?? '',
          pubK: this.store.currentPubkey,
        };
        return childWallet;
      }
    }
    return null;
  };

  getMainAccounts = (network: string): MainAccount[] | null => {
    const currentPubKey = this.store.currentPubkey;
    const profileList: WalletProfile[] = this.accounts[network];

    const profile = profileList.find((account) => account.publicKey === currentPubKey);
    if (profile) {
      return profile.accounts;
    } else {
      return null;
    }
  };

  getEvmAddressOfParentAccount = (address: FlowAddress): EvmAddress | null => {
    if (this.isLocked()) {
      return null;
    }
    const evmAddress = this.evmAddressMap[address]?.evmAddress;
    if (!evmAddress) {
      return null;
    }
    return evmAddress;
  };

  getCurrentEvmAddress = (): EvmAddress | null => {
    if (this.isLocked() || !this.store.parentAddress) {
      return null;
    }
    const address = this.store.parentAddress as FlowAddress;
    return this.getEvmAddressOfParentAccount(address);
  };

  getEvmWallet = (): WalletAccount | null => {
    if (this.isLocked()) {
      return null;
    }
    const evmAddress = this.getCurrentEvmAddress();
    if (!evmAddress) {
      return null;
    }
    const network = this.store.network;
    const evmWallet: WalletAccount = {
      address: evmAddress,
      name: 'Lemon',
      icon: '🍋',
      color: '#FFD700',
      chain: network === 'mainnet' ? 747 : 545,
      id: 0,
    };
    return evmWallet;
  };

  getChildAccounts = (): ChildAccountMap | null => {
    if (this.isLocked()) {
      return null;
    }

    const network = this.store.network;
    const address = this.store.parentAddress;
    const childAccountStore: ChildAccountStore | undefined =
      this.childAccountMap[network]?.[address];
    if (!childAccountStore) {
      return null;
    }
    // Return a shallow copy of the child accounts
    return { ...childAccountStore.accounts };
  };

  setWalletEmoji = (emoji, network, id) => {
    console.log('setWalletEmoji', emoji, network, id);
    // this.store.wallets[network][id].name = emoji.name;
    // this.store.wallets[network][id].icon = emoji.emoji;
    // this.store.wallets[network][id].color = emoji.bgcolor;
    // this.store.wallets[network][id].blockchain[0].name = emoji.name;
    // this.store.wallets[network][id].blockchain[0].icon = emoji.emoji;
    // this.store.wallets[network][id].blockchain[0].color = emoji.bgcolor;
  };

  refreshEvm = () => {
    const network = this.store.network;
    const address = this.store.parentAddress;

    // Remove the evm address from the map
    delete this.evmAddressMap[network]?.[address];

    this.store.evmEnabled = false;
  };

  /*
  New store for accounts are above
  */

  setNetwork = async (network: string) => {
    if (!this.store) {
      await this.init();
    }
    if (this.store.network !== network) {
      this.store.activeChild = null;
      // TODO: I think this line below should be put back in. It was removed to fix an account switching bug, but without it, it's possible for currentWallet to refer to address on another network. Either currentWallet should be cleared or the line below should be put back in.
      // this.store.currentWallet = this.store.wallets[network][0].blockchain[0];
    }
    this.store.network = network;
  };

  setMonitor = (monitor: string) => {
    this.store.monitor = monitor;
  };

  setEvmEnabled = (status: boolean) => {
    this.store.evmEnabled = status;
  };

  getEvmEnabled = () => {
    return this.store.evmEnabled;
  };

  getNetwork = async (): Promise<string> => {
    if (!this.store) {
      await this.init();
    }
    return this.store.network;
  };

  getEmulatorMode = async (): Promise<boolean> => {
    // Check feature flag first
    const enableEmulatorMode = await openapiService.getFeatureFlag('emulator_mode');
    if (!enableEmulatorMode) {
      return false;
    }
    if (!this.store) {
      await this.init();
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

  getMonitor = (): string => {
    return this.store.monitor;
  };

  setEvmEmoji = (emoji) => {
    console.log('setEvmEmoji', emoji);
    // this.store.evmWallet.name = emoji.name;
    // this.store.evmWallet.icon = emoji.emoji;
    // this.store.evmWallet.color = emoji.bgcolor;
  };

  // transaction functions below

  setupFcl = async () => {
    const isEmulatorMode = await this.getEmulatorMode();
    const network = (await this.getNetwork()) as FlowNetwork;
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
    args: any[],
    shouldCoverFee: boolean = false
  ): Promise<string> => {
    const scriptName = this.extractScriptName(cadence);
    //add proxy
    try {
      const allowed = await wallet.allowLilicoPay();
      const payerFunction = shouldCoverFee
        ? this.bridgeFeePayerAuthFunction
        : allowed
          ? this.payerAuthFunction
          : this.authorizationFunction;
      const txID = await fcl.mutate({
        cadence: cadence,
        args: (arg, t) => args,
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

  sign = async (signableMessage: string): Promise<string> => {
    const hashAlgo = await storage.get('hashAlgo');
    const signAlgo = await storage.get('signAlgo');
    const password = keyringService.password;
    const privateKey = await wallet.getPrivateKeyForCurrentAccount(password);
    const realSignature = await signWithKey(
      Buffer.from(signableMessage, 'hex'),
      signAlgo,
      hashAlgo,
      privateKey
    );
    return realSignature;
  };

  switchLogin = async (pubKey: PublicKeyTuple, replaceUser = true) => {
    const pubKeyP256 = pubKey.P256;
    const pubKeySECP256K1 = pubKey.SECP256K1;

    // The issue is here in using getStoragedAccount()
    let account: Partial<LoggedInAccount> & {
      hashAlgo: HashAlgoString;
      signAlgo: SignAlgoString;
      pubKey: string;
      weight: number;
    };
    try {
      // Try to get the account from  loggedInAccounts
      account = await getLoggedInAccount();
    } catch (error) {
      console.error('Error getting logged in account - recreate it', error);
      // Look for the account using the pubKey
      const network = (await this.getNetwork()) || 'mainnet';
      // Find the address associated with the pubKey
      // This should return an array of address information records
      const addressAndKeyInfoArray = await getAccountsByPublicKeyTuple(pubKey, network);
      // Find which signAlgo and hashAlgo is used on the account
      if (!Array.isArray(addressAndKeyInfoArray) || !addressAndKeyInfoArray.length) {
        throw new Error('No address found');
      }
      // Follow the same logic as freshUserInfo in openapi.ts
      // Look for the P256 key first

      let index = addressAndKeyInfoArray.findIndex((key) => key.publicKey === pubKeyP256.pubK);
      if (index === -1) {
        // If no P256 key is found, look for the SECP256K1 key
        index = addressAndKeyInfoArray.findIndex((key) => key.publicKey === pubKeySECP256K1.pubK);

        if (index === -1) {
          // Just use the first one
          index = 0;
        }
      }
      // Convert it to a LoggedInAccount
      const pubKeyAccount = addressAndKeyInfoArray[index];
      account = {
        ...pubKeyAccount,
        hashAlgo: pubKeyAccount.hashAlgoString,
        signAlgo: pubKeyAccount.signAlgoString,
        pubKey: pubKeyAccount.publicKey,
        weight: pubKeyAccount.weight,
        address: pubKeyAccount.address as FlowAddress,
      };
    }
    const keyType = getSignAlgo(account.signAlgo!);
    const keys = keyType === 1 ? pubKeyP256 : pubKeySECP256K1;
    let result = [
      {
        hashAlgo: account.hashAlgo!,
        signAlgo: account.signAlgo!,
        pubK: keys.pubK,
        weight: account.weight!,
      },
    ];
    const privateKey = await keyringService.getCurrentPrivateKey();
    if (!result[0].pubK) {
      console.log('No result found, creating a new result object');
      // Create a new result object with extension default setting
      const foundResult = await findAddressWithPK(privateKey, '');
      if (!foundResult) {
        throw new Error('Unable to find a address with the provided PK. Aborting login.');
      }

      result = foundResult.map((account) => ({
        hashAlgo: account.hashAlgoString,
        signAlgo: account.signAlgoString,
        pubK: account.publicKey,
        weight: account.weight,
      }));
    }
    const hashAlgo = result[0].hashAlgo;
    const signAlgo = result[0].signAlgo;
    const publicKey = result[0].pubK;

    await this.setCurrentPubkey(publicKey);
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
    const message = USER_DOMAIN_TAG + Buffer.from(idToken, 'utf8').toString('hex');

    // const messageHash = await secp.utils.sha256(Buffer.from(message, 'hex'));
    const accountKey = {
      public_key: publicKey,
      hash_algo: typeof hashAlgo === 'string' ? getHashAlgo(hashAlgo) : hashAlgo,
      sign_algo: typeof signAlgo === 'string' ? getSignAlgo(signAlgo) : signAlgo,
      weight: result[0].weight,
    };
    const deviceInfo = await this.getDeviceInfo();
    // const signature = await secp.sign(messageHash, privateKey);
    const realSignature = await signWithKey(
      Buffer.from(message, 'hex'),
      signAlgo,
      hashAlgo,
      privateKey
    );
    return wallet.openapi.loginV3(accountKey, deviceInfo, realSignature, replaceUser);
  };

  reSign = async () => {
    // Try to re-establish the session if the user's wallet is unlocked
    if (this.isLocked()) {
      // If the wallet is locked, we can't sign in
      return;
    }
    const password = keyringService.password;
    if (!password) {
      // No password means the wallet is not unlocked
      return;
    }
    const privateKey = await wallet.getPrivateKeyForCurrentAccount(password);
    return await this.sigInWithPk(privateKey);
  };

  authorizationFunction = async (account: any = {}) => {
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
      signingFunction: async (signable) => {
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

  signBridgeFeePayer = async (signable: any): Promise<string> => {
    const tx = signable.voucher;
    const message = signable.message;
    const envelope = await openapiService.signBridgeFeePayer(tx, message);
    const signature = envelope.envelopeSigs.sig;
    return signature;
  };

  signPayer = async (signable: any): Promise<string> => {
    const tx = signable.voucher;
    const message = signable.message;
    const envelope = await openapiService.signPayer(tx, message);
    const signature = envelope.envelopeSigs.sig;
    return signature;
  };

  signProposer = async (signable: any): Promise<string> => {
    const tx = signable.voucher;
    const message = signable.message;
    const envelope = await openapiService.signProposer(tx, message);
    const signature = envelope.envelopeSigs.sig;
    return signature;
  };

  proposerAuthFunction = async (account: any = {}) => {
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

  payerAuthFunction = async (account: any = {}) => {
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
  bridgeFeePayerAuthFunction = async (account: any = {}) => {
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

  signInWithMnemonic = async (
    mnemonic: string,
    replaceUser = true,
    derivationPath: string = FLOW_BIP44_PATH,
    passphrase: string = ''
  ) => {
    // Seperate this out as the private key is not returned from the getAccountsByPublicKeyTuple
    const publicPrivateKey: PublicPrivateKeyTuple = await seedWithPathAndPhrase2PublicPrivateKey(
      mnemonic,
      derivationPath,
      passphrase
    );
    const result = await getAccountsByPublicKeyTuple(publicPrivateKey, 'mainnet');
    if (!result) {
      throw new Error('No Address Found');
    }
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
    const message = USER_DOMAIN_TAG + Buffer.from(idToken, 'utf8').toString('hex');

    const hashAlgo: number = result[0].hashAlgo;
    const signAlgo: number = result[0].signAlgo;
    const publicKey: string = result[0].publicKey;
    const privateKey: string =
      publicKey === publicPrivateKey.P256.pubK
        ? publicPrivateKey.P256.pk
        : publicPrivateKey.SECP256K1.pk;
    const accountKey = {
      public_key: publicKey,
      hash_algo: hashAlgo,
      sign_algo: signAlgo,
      weight: result[0].weight,
    };
    const deviceInfo = await this.getDeviceInfo();
    // const signature = await secp.sign(messageHash, privateKey);
    const realSignature = await signWithKey(
      Buffer.from(message, 'hex'),
      signAlgo,
      hashAlgo,
      privateKey
    );
    return wallet.openapi.loginV3(accountKey, deviceInfo, realSignature, replaceUser);
  };

  sigInWithPk = async (privateKey: string, replaceUser = true) => {
    const result = await findAddressWithPK(privateKey, '');
    if (!result) {
      throw new Error('No Address Found');
    }
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
    const message = USER_DOMAIN_TAG + Buffer.from(idToken, 'utf8').toString('hex');

    // const messageHash = await secp.utils.sha256(Buffer.from(message, 'hex'));
    const hashAlgo = result[0].hashAlgo;
    const signAlgo = result[0].signAlgo;
    const publicKey = result[0].publicKey;
    const accountKey = {
      public_key: publicKey,
      hash_algo: hashAlgo,
      sign_algo: hashAlgo,
      weight: result[0].weight,
    };
    const deviceInfo = await this.getDeviceInfo();
    // const signature = await secp.sign(messageHash, privateKey);
    const realSignature = await signWithKey(
      Buffer.from(message, 'hex'),
      signAlgo,
      hashAlgo,
      privateKey
    );
    return wallet.openapi.loginV3(accountKey, deviceInfo, realSignature, replaceUser);
  };

  signInv3 = async (mnemonic: string, accountKey: any, deviceInfo: any, replaceUser = true) => {
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

    const tuple = await seed2PublicPrivateKey(mnemonic);
    const PK1 = tuple.P256.pk;
    const PK2 = tuple.SECP256K1.pk;
    const signAlgo =
      typeof accountKey.signAlgo === 'string'
        ? getSignAlgo(accountKey.signAlgo)
        : accountKey.signAlgo;
    const privateKey = signAlgo === 1 ? PK1 : PK2;

    const publicKey = hex(secp.getPublicKey(privateKey).slice(1));
    if (accountKey.public_key === publicKey) {
      const signature = await secp.sign(messageHash, privateKey);
      const realSignature = secp.Signature.fromHex(signature).toCompactHex();
      return wallet.openapi.loginV3(accountKey, deviceInfo, realSignature, replaceUser);
    } else {
      return false;
    }
  };

  signOutCurrentUser = async () => {
    const app = getApp(process.env.NODE_ENV!);
    const auth = getAuth(app);
    await signInAnonymously(auth);
  };

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

export default new UserWallet();
