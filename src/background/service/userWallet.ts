import * as secp from '@noble/secp256k1';
import * as fcl from '@onflow/fcl';
import { getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth/web-extension';

import wallet from '@/background/controller/wallet';
import keyringService from '@/background/service/keyring';
import { mixpanelTrack } from '@/background/service/mixpanel';
import openapiService from '@/background/service/openapi';
import { getLoggedInAccount } from '@/background/utils/getLoggedInAccount';
import { signWithKey, seed2PubKey } from '@/background/utils/modules/publicPrivateKey';
import createPersistStore from '@/background/utils/persisitStore';
import { type HashAlgoType, type SignAlgoType } from '@/shared/types/algo-types';
import { type LoggedInAccount, type ActiveChildType } from '@/shared/types/wallet-types';
import { withPrefix } from '@/shared/utils/address';
import { getHashAlgo, getSignAlgo } from '@/shared/utils/algo';

import type {
  WalletResponse,
  BlockchainResponse,
  ChildAccount,
  DeviceInfoRequest,
  FlowNetwork,
} from '../../shared/types/network-types';
import { fclConfig } from '../fclConfig';
import {
  findAddressWithSeed,
  findAddressWithPK,
  findAddressWithNetwork,
} from '../utils/modules/findAddressWithPK';
import { storage } from '../webapi';

interface UserWalletStore {
  wallets: Record<string, WalletResponse[]>;
  currentWallet: BlockchainResponse;
  evmWallet: BlockchainResponse;
  childAccount: ChildAccount;
  network: string;
  monitor: string;
  activeChild: ActiveChildType;
  evmEnabled: boolean;
  emulatorMode: boolean;
}

const USER_WALLET_TEMPLATE: UserWalletStore = {
  wallets: {
    mainnet: [],
    testnet: [],
    crescendo: [],
  },
  childAccount: {},
  currentWallet: {
    name: '',
    icon: '',
    address: '',
    chain_id: 'mainnet',
    id: 1,
    coins: ['flow'],
    color: '',
  },
  evmWallet: {
    name: '',
    icon: '',
    address: '',
    chain_id: 'mainnet',
    id: 1,
    coins: ['flow'],
    color: '',
  },
  activeChild: null,
  evmEnabled: false,
  monitor: 'flowscan',
  network: 'mainnet',
  emulatorMode: false,
};
class UserWallet {
  store!: UserWalletStore;

  init = async () => {
    this.store = await createPersistStore<UserWalletStore>({
      name: 'userWallets',
      template: USER_WALLET_TEMPLATE,
    });
  };

  clear = async () => {
    if (!this.store) {
      await this.init();
    } else {
      Object.assign(this.store, USER_WALLET_TEMPLATE);
    }
  };
  isLocked = () => {
    return !keyringService.isBooted() || !keyringService.memStore.getState().isUnlocked;
  };
  setUserWallets = async (filteredData: WalletResponse[], network: string) => {
    this.store.wallets[network] = filteredData;
    let walletIndex = (await storage.get('currentWalletIndex')) || 0;
    if (this.store.wallets[network] && this.store.wallets[network].length > 0) {
      if (walletIndex >= filteredData.length) {
        walletIndex = 0; // Reset walletIndex to 0 if it exceeds the array length
        await storage.set('currentWalletIndex', 0);
      }
      const current = this.store.wallets[network][walletIndex].blockchain[0];
      this.store.currentWallet = current;
    } else {
      console.error(`No wallet found for network: ${network}`);
    }
  };

  setChildWallet = (wallet: ChildAccount) => {
    this.store.childAccount = wallet;
  };

  setActiveWallet = (key: ActiveChildType) => {
    this.store.activeChild = key;
  };

  getActiveWallet = (): ActiveChildType => {
    return this.store.activeChild;
  };

  setCurrentWallet = async (
    wallet: BlockchainResponse,
    key: ActiveChildType | null,
    network: string,
    index: number | null = null
  ) => {
    if (key && key !== 'evm') {
      this.store.currentWallet = wallet;
    } else if (key === 'evm') {
      this.store.evmWallet.address = wallet.address;
    } else if (index !== null) {
      await storage.set('currentWalletIndex', index);
      const current = this.store.wallets[network][index].blockchain[0];
      this.store.currentWallet = current;
    } else {
      const current = this.store.wallets[network][0].blockchain[0];
      this.store.currentWallet = current;
    }
  };

  getUserWallets = (network: string) => {
    return this.store.wallets[network];
  };

  checkCrescendo = () => {
    return this.store.wallets['crescendo'];
  };

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

  refreshEvm = () => {
    this.store.evmWallet = {
      name: '',
      address: '',
      icon: '',
      chain_id: 'mainnet',
      id: 1,
      coins: ['flow'],
      color: '',
    };
    this.store.evmEnabled = false;
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

  setupFcl = async () => {
    const isEmulatorMode = await this.getEmulatorMode();
    const network = (await this.getNetwork()) as FlowNetwork;
    await fclConfig(network, isEmulatorMode);
  };

  getMonitor = (): string => {
    return this.store.monitor;
  };

  switchWallet = (walletId: number, blockId: string, sortKey: string, network: string) => {
    const wallets = this.store.wallets[network];
    let chain = {
      name: '',
      address: '',
      chain_id: 'testnet',
      id: 1,
      coins: ['flow'],
    } as BlockchainResponse;
    if (sortKey === 'id') {
      const chains = wallets.find((x) => x.wallet_id === walletId);
      chain = chains!.blockchain.find((y) => y.chain_id === blockId)!;
    } else {
      chain = wallets[walletId].blockchain[blockId];
    }
    this.store.currentWallet = chain;
  };

  getCurrentWallet = (): BlockchainResponse | null => {
    if (this.isLocked()) {
      return null;
    }
    return this.store.currentWallet;
  };

  getEvmWallet = (): BlockchainResponse | null => {
    if (this.isLocked()) {
      return null;
    }
    return this.store.evmWallet;
  };

  setEvmAddress = (address: string, emoji) => {
    if (address.length > 20) {
      this.store.evmWallet.address = address;
      this.store.evmWallet.name = emoji[9].name;
      this.store.evmWallet.icon = emoji[9].emoji;
      this.store.evmWallet.color = emoji[9].bgcolor;
    } else {
      this.store.evmWallet.address = '';
    }
  };

  setEvmEmoji = (emoji) => {
    this.store.evmWallet.name = emoji.name;
    this.store.evmWallet.icon = emoji.emoji;
    this.store.evmWallet.color = emoji.bgcolor;
  };

  setWalletEmoji = (emoji, network, id) => {
    this.store.wallets[network][id].name = emoji.name;
    this.store.wallets[network][id].icon = emoji.emoji;
    this.store.wallets[network][id].color = emoji.bgcolor;
    this.store.wallets[network][id].blockchain[0].name = emoji.name;
    this.store.wallets[network][id].blockchain[0].icon = emoji.emoji;
    this.store.wallets[network][id].blockchain[0].color = emoji.bgcolor;
  };

  returnMainWallet = async (network: string): Promise<BlockchainResponse | undefined> => {
    const walletIndex = (await storage.get('currentWalletIndex')) || 0;
    const wallet = this.store.wallets?.[network]?.[walletIndex]?.blockchain?.[0];
    return wallet;
  };

  getMainWallet = async (network: string) => {
    if (!keyringService.isBooted() || !keyringService.memStore.getState().isUnlocked) {
      return '';
    }
    const wallet = await this.returnMainWallet(network);
    return withPrefix(wallet?.address) || '';
  };

  getCurrentAddress = (): string => {
    return withPrefix(this.store.currentWallet.address) || '';
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

  switchLogin = async (pubKey: any, replaceUser = true) => {
    const pubKeyP256 = pubKey.P256;
    const pubKeySECP256K1 = pubKey.SECP256K1;

    // The issue is here in using getStoragedAccount()
    let account: Partial<LoggedInAccount> & {
      hashAlgo: HashAlgoType;
      signAlgo: SignAlgoType;
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
      const addressAndKeyInfoArray = await findAddressWithNetwork(pubKey, network);
      // Find which signAlgo and hashAlgo is used on the account
      if (!Array.isArray(addressAndKeyInfoArray) || !addressAndKeyInfoArray.length) {
        throw new Error('No address found');
      }
      // Follow the same logic as freshUserInfo in openapi.ts
      // Look for the P256 key first

      let index = addressAndKeyInfoArray.findIndex((key) => key.pubK === pubKeyP256.pubK);
      if (index === -1) {
        // If no P256 key is found, look for the SECP256K1 key
        index = addressAndKeyInfoArray.findIndex((key) => key.pubK === pubKeySECP256K1.pubK);

        if (index === -1) {
          // Just use the first one
          index = 0;
        }
      }
      account = {
        ...addressAndKeyInfoArray[index],
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

    if (!result[0].pubK) {
      console.log('No result found, creating a new result object');
      // Create a new result object with extension default setting
      const foundResult = await findAddressWithPK(keys.pk, '');
      if (!foundResult) {
        throw new Error('Unable to find a address with the provided PK. Aborting login.');
      }

      result = foundResult;
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
    const publicKey = result[0].pubK;
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
      keys.pk
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

  signInWithMnemonic = async (mnemonic: string, replaceUser = true, isTemp = true) => {
    const result = await findAddressWithSeed(mnemonic, '', isTemp);
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

    const privateKey = result[0].pk;
    const hashAlgo = result[0].hashAlgo;
    const signAlgo = result[0].signAlgo;
    const publicKey = result[0].pubK;
    const accountKey = {
      public_key: publicKey,
      hash_algo: getHashAlgo(hashAlgo),
      sign_algo: getSignAlgo(signAlgo),
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
    const publicKey = result[0].pubK;
    const accountKey = {
      public_key: publicKey,
      hash_algo: getHashAlgo(hashAlgo),
      sign_algo: getSignAlgo(signAlgo),
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

    const tuple = await seed2PubKey(mnemonic);
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
