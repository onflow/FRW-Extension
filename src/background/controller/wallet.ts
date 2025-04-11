/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fcl from '@onflow/fcl';
import type { Account as FclAccount } from '@onflow/typedefs';
import * as t from '@onflow/types';
import BN from 'bignumber.js';
import * as bip39 from 'bip39';
import { ethErrors } from 'eth-rpc-errors';
import * as ethUtil from 'ethereumjs-util';
import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth/web-extension';
import { type TokenInfo } from 'flow-native-token-registry';
import { now } from 'lodash';
import { encode } from 'rlp';
import web3, { TransactionError, Web3 } from 'web3';

import { getAccountKey, pubKeyAccountToAccountKey } from '@/background/utils/account-key';
import {
  findAddressWithSeed,
  findAddressWithPK,
} from '@/background/utils/modules/findAddressWithPK';
import {
  pk2PubKey,
  jsonToKey,
  seed2PublicPrivateKey,
  seedWithPathAndPhrase2PublicPrivateKey,
  formPubKeyTuple,
} from '@/background/utils/modules/publicPrivateKey';
import eventBus from '@/eventBus';
import type { CoinItem, ExtendedTokenInfo } from '@/shared/types/coin-types';
import { type FeatureFlagKey, type FeatureFlags } from '@/shared/types/feature-types';
import { type PublicKeyTuple } from '@/shared/types/key-types';
import { CURRENT_ID_KEY } from '@/shared/types/keyring-types';
import { ContactType, MAINNET_CHAIN_ID } from '@/shared/types/network-types';
import { type NFTCollections, type NFTCollectionData } from '@/shared/types/nft-types';
import { type TrackingEvents } from '@/shared/types/tracking-types';
import { type TransferItem, type TransactionState } from '@/shared/types/transaction-types';
import {
  type ActiveChildType_depreciated,
  type LoggedInAccount,
  type FlowAddress,
  type PublicKeyAccount,
  type MainAccount,
  type ChildAccountMap,
  type WalletAccount,
  type EvmAddress,
  type WalletAddress,
  isEvmAccountType,
  type ActiveAccountType,
} from '@/shared/types/wallet-types';
import {
  ensureEvmAddressPrefix,
  isValidEthereumAddress,
  isValidFlowAddress,
  withPrefix,
} from '@/shared/utils/address';
import { getSignAlgo } from '@/shared/utils/algo';
import { FLOW_BIP44_PATH, SIGN_ALGO_NUM_ECDSA_P256 } from '@/shared/utils/algo-constants';
import {
  evmAccountRefreshRegex,
  childAccountsRefreshRegex,
  userInfoRefreshRegex,
  cadenceScriptsKey,
  getCachedScripts,
  nftCollectionKey,
  getCachedNftCollection,
  getCachedNftCatalogCollections,
  nftCatalogCollectionsKey,
  coinListKey,
  childAccountAllowTypesKey,
  childAccountNFTsKey,
  type ChildAccountNFTsStore,
  evmNftIdsKey,
  type EvmNftIdsStore,
  type EvmNftCollectionListStore,
  evmNftCollectionListKey,
} from '@/shared/utils/cache-data-keys';
import { getCurrentProfileId } from '@/shared/utils/current-id';
import {
  convertFlowBalanceToString,
  convertToIntegerAmount,
  validateAmount,
} from '@/shared/utils/number';
import { retryOperation } from '@/shared/utils/retryOperation';
import {
  type CategoryScripts,
  type CadenceScripts,
  type NetworkScripts,
} from '@/shared/utils/script-types';
import {
  keyringService,
  preferenceService,
  notificationService,
  permissionService,
  sessionService,
  openapiService,
  pageStateCacheService,
  userInfoService,
  coinListService,
  addressBookService,
  userWalletService,
  transactionService,
  nftService,
  googleDriveService,
  newsService,
  mixpanelTrack,
  evmNftService,
} from 'background/service';
import i18n from 'background/service/i18n';
import {
  type DisplayedKeryring,
  type Keyring,
  KEYRING_CLASS,
  type KeyringType,
} from 'background/service/keyring';
import type { CacheState } from 'background/service/pageStateCache';
import { replaceNftKeywords } from 'background/utils';
import fetchConfig from 'background/utils/remoteConfig';
import { notification, storage } from 'background/webapi';
import { openIndexPage } from 'background/webapi/tab';
import {
  INTERNAL_REQUEST_ORIGIN,
  EVENTS,
  KEYRING_TYPE,
  EVM_ENDPOINT,
  HTTP_STATUS_CONFLICT,
} from 'consts';

import type {
  AccountKeyRequest,
  Contact,
  FlowNetwork,
  NFTModelV2,
  UserInfoResponse,
} from '../../shared/types/network-types';
import DisplayKeyring from '../service/keyring/display';
import { HDKeyring } from '../service/keyring/hdKeyring';
import { SimpleKeyring } from '../service/keyring/simpleKeyring';
import { getScripts } from '../service/openapi';
import type { ConnectedSite } from '../service/permission';
import type { PreferenceAccount } from '../service/preference';
import { type EvaluateStorageResult, StorageEvaluator } from '../service/storage-evaluator';
import { loadChildAccountsOfParent } from '../service/userWallet';
import {
  getCachedData,
  getValidData,
  registerRefreshListener,
  setCachedData,
} from '../utils/data-cache';
import defaultConfig from '../utils/defaultConfig.json';
import { getEmojiList } from '../utils/emoji-util';
import erc20ABI from '../utils/erc20.abi.json';
import { getLoggedInAccount } from '../utils/getLoggedInAccount';
import {
  getAccountsByPublicKeyTuple,
  getOrCheckAccountsByPublicKeyTuple,
} from '../utils/modules/findAddressWithPubKey';

import BaseController from './base';
import provider from './provider';

const stashKeyrings: Record<string, Keyring> = {};

interface TokenTransaction {
  symbol: string;
  contractName: string;
  address: string;
  timestamp: number;
}

export class WalletController extends BaseController {
  openapi = openapiService;
  private storageEvaluator: StorageEvaluator;
  private loaded = false;

  constructor() {
    super();
    this.storageEvaluator = new StorageEvaluator();
  }
  // Adding as tests load the extension really, really fast
  // It's possible to call the wallet controller before services are loaded
  // setLoaded is called in index.ts of the background
  isLoaded = async () => this.loaded;
  setLoaded = async (loaded: boolean) => {
    this.loaded = loaded;
  };

  /* wallet */
  boot = async (password) => {
    // When wallet first initializes through install, it will add a encrypted password to boot state. If is boot is false, it means there's no password set.
    const isBooted = await keyringService.isBooted();
    if (isBooted) {
      await keyringService.updateUnlocked(password);
    } else {
      await keyringService.boot(password);
    }
  };
  isBooted = () => keyringService.isBooted();
  isUnlocked = () => keyringService.isUnlocked();
  verifyPassword = (password: string) => keyringService.verifyPassword(password);

  sendRequest = (data) => {
    return provider({
      data,
      session: {
        name: 'Flow Wallet',
        origin: INTERNAL_REQUEST_ORIGIN,
        icon: './images/icon-128.png',
      },
    });
  };

  getApproval = notificationService.getApproval;
  resolveApproval = notificationService.resolveApproval;
  rejectApproval = notificationService.rejectApproval;

  /**
   * Create a new wallet profile.
   * This is called on first registration and when the user wants to add a profile
   * @param password the password for the new profile, or confirmation of existing password
   * @param username the username for the new profile
   * @param mnemonic the mnemonic for the new private key
   */
  registerNewProfile = async (username: string, password: string, mnemonic: string) => {
    // The account is the public key of the account. It's derived from the mnemonic. We do not support custom curves or passphrases for new accounts
    const accountKey: AccountKeyRequest = await getAccountKey(mnemonic);

    // We're booting the keyring with the new password
    // This does not update the vault, it simply sets the password / cypher methods we're going to use to store our private keys in the vault
    await this.boot(password);
    // We're then registering the account with the public key
    // This calls our backend API which gives us back an account id
    // This register call ALSO sets the currentId in local storage
    // In addition, it will sign us in to the new account with our auth (Firebase) on our backend
    // Note this auth is different to unlocking the wallet with the password.
    await openapiService.register(accountKey, username);

    // We're creating the keyring with the mnemonic. This will encypt the private keys and store them in the keyring vault and deepVault
    await this.createKeyringWithMnemonics(password, mnemonic);
    // We're creating the Flow address for the account
    // Only after this, do we have a valid wallet with a Flow address
    const result = await openapiService.createFlowAddressV2();
    this.checkForNewAddress(result.data);
  };

  checkForNewAddress = async (txid: string): Promise<FclAccount | null> => {
    try {
      const txResult = await fcl.tx(txid).onceSealed();

      // Find the AccountCreated event and extract the address
      const accountCreatedEvent = txResult.events.find(
        (event) => event.type === 'flow.AccountCreated'
      );

      if (!accountCreatedEvent) {
        throw new Error('Account creation event not found in transaction');
      }

      const newAddress = accountCreatedEvent.data.address;

      const account = await fcl.account(newAddress);
      if (!account) {
        throw new Error('Fcl account not found');
      }

      userWalletService.registerCurrentPubkey(account.keys[0].publicKey, account);
      return account;
    } catch (error) {
      throw new Error(`Account creation failed: ${error.message || 'Unknown error'}`);
    }
  };

  /**
   * Import a profile using a mnemonic
   * @param username
   * @param password
   * @param mnemonic
   * @param address
   * @param derivationPath
   * @param passphrase
   */
  importProfileUsingMnemonic = async (
    username: string,
    password: string,
    mnemonic: string,
    derivationPath: string = FLOW_BIP44_PATH,
    passphrase: string = ''
  ) => {
    // Boot the keyring with the password
    // We should be validating the password as the first thing we do
    await this.boot(password);
    // Get the public key tuple from the mnemonic

    const pubKTuple: PublicKeyTuple = formPubKeyTuple(
      await seedWithPathAndPhrase2PublicPrivateKey(mnemonic, derivationPath, passphrase)
    );
    // Check that there are accounts on the network for this public key
    const accounts = await getOrCheckAccountsByPublicKeyTuple(pubKTuple);
    if (accounts.length === 0) {
      throw new Error('Invalid seed phrase');
    }
    // We use the public key from the first account that is returned
    const publicKey = accounts[0].publicKey;
    // Check if the account is registered on our backend (i.e. it's been created in wallet or used previously in wallet)

    const importCheckResult = await openapiService.checkImport(publicKey);
    if (importCheckResult.status === HTTP_STATUS_CONFLICT) {
      // The account has been previously imported, so just sign in with it

      // Sign in with the mnemonic
      await this.loginWithMnemonic(mnemonic, true, derivationPath, passphrase);
    } else {
      // We have to create a new user on our backend
      const accountKeyStruct = pubKeyAccountToAccountKey(accounts[0]);
      // Get the device info so we can do analytics
      const deviceInfo = await userWalletService.getDeviceInfo();
      // Import the account creating a new user on our backend and sign in as the new user
      // TODO: Why can't we just call register here?
      await openapiService.importKey(
        accountKeyStruct,
        deviceInfo,
        username,
        {},
        accounts[0].address
      );
    }

    // Now we can create the keyring with the mnemonic (and path and phrase)
    await this.createKeyringWithMnemonics(password, mnemonic, derivationPath, passphrase);

    // Set the current pubkey in userWallet
    userWalletService.setCurrentPubkey(publicKey);
  };

  /**
   * Import a profile using a private key
   * @param username
   * @param password
   * @param pk
   * @param address
   */

  importProfileUsingPrivateKey = async (
    username: string,
    password: string,
    pk: string,
    address: FlowAddress | null = null
  ) => {
    // Boot the keyring with the password
    // We should be validating the password as the first thing we do
    await this.boot(password);

    // Get the public key tuple from the private key
    const pubKTuple: PublicKeyTuple = await pk2PubKey(pk);

    // Check if the public key has any accounts associated with it
    const accounts = await getOrCheckAccountsByPublicKeyTuple(pubKTuple, address);
    if (accounts.length === 0) {
      throw new Error('Invalid private key - no accounts found');
    }

    // We use the public key from the first account that is returned
    const publicKey = accounts[0].publicKey;
    // Check if the account is registered on our backend (i.e. it's been created in wallet or used previously in wallet)
    const importCheckResult = await openapiService.checkImport(publicKey);
    if (importCheckResult.status === HTTP_STATUS_CONFLICT) {
      // The account has been previously imported, so just sign in with it

      // Sign in with the private key
      await this.loginWithPrivatekey(pk, true);
    } else {
      // We have to create a new user on our backend
      const accountKeyStruct = pubKeyAccountToAccountKey(accounts[0]);
      // Get the device info so we can do analytics
      const deviceInfo = await userWalletService.getDeviceInfo();
      // Import the account creating a new user on our backend and sign in as the new user
      // TODO: Why can't we just call register here?
      await openapiService.importKey(
        accountKeyStruct,
        deviceInfo,
        username,
        {},
        accounts[0].address
      );
    }
    // Now we can create the keyring with the mnemonic (and path and phrase)
    await this.importPrivateKey(password, pk);

    // Set the current pubkey in userWallet
    userWalletService.setCurrentPubkey(publicKey);
  };

  /**
   * Switch the wallet profile to a different profile
   * @param id - The id of the keyring to switch to.
   */
  switchProfile = async (id: string) => {
    try {
      await keyringService.switchKeyring(id);
      // Login with the new keyring
      await userWalletService.loginWithKeyring();
    } catch (error) {
      throw new Error('Failed to switch account: ' + (error.message || 'Unknown error'));
    }
  };

  checkAvailableAccount = async (currentId: string) => {
    try {
      await keyringService.checkAvailableAccount(currentId);
    } catch (error) {
      console.error('Error finding available account:', error);
      throw new Error('Failed to find available account: ' + (error.message || 'Unknown error'));
    }
  };

  unlock = async (password: string) => {
    // Submit the password. This will unlock the keyring or throw an error
    await keyringService.submitPassword(password);
    // Login with the current keyring
    await userWalletService.loginWithKeyring();
    sessionService.broadcastEvent('unlock');

    // Refresh the wallet data
    this.refreshWallets();
  };

  submitPassword = async (password: string) => {
    await keyringService.submitPassword(password);
  };

  refreshWallets = async () => {
    // Refresh all the wallets after unlocking or switching profiles
    // Refresh the cadence scripts first
    await this.getCadenceScripts();
    // Refresh the user info
    let userInfo = {};
    try {
      userInfo = await retryOperation(async () => this.getUserInfo(true), 3, 1000);
    } catch (error) {
      console.error('Error refreshing user info:', error);
    }
    // Try for 2 mins to get the parent address
    const parentAddress = await retryOperation(
      async () => {
        const address = userWalletService.getParentAddress();
        console.log('retryOperation - refreshWallets - parentAddress', address);
        if (!address) {
          throw new Error('Parent address not found');
        }
        return address;
      },
      24,
      5_000
    );
    // Refresh the logged in account
    const pubKTuple = await keyringService.getCurrentPublicKeyTuple();
    const fclAccount = await this.getAccount();
    // Refresh the user info
    return openapiService.freshUserInfo(parentAddress, fclAccount, pubKTuple, userInfo, 'main');
  };

  retrievePk = async (password: string) => {
    const pk = await keyringService.retrievePk(password);
    return pk;
  };

  // This is not used anymore
  extractKeys = (keyrings) => {
    let privateKeyHex, publicKeyHex;

    for (const keyring of keyrings) {
      if (keyring.type === 'Simple Key Pair' && keyring.wallets?.length > 0) {
        const privateKeyData = keyring.wallets[0].privateKey.data;
        privateKeyHex = Buffer.from(privateKeyData).toString('hex');
        const publicKeyData = keyring.wallets[0].publicKey.data;
        publicKeyHex = Buffer.from(publicKeyData).toString('hex');
        break;
      } else if (keyring.type === 'HD Key Tree') {
        const activeIndex = keyring.activeIndexes?.[0];
        if (activeIndex !== undefined) {
          const wallet = keyring._index2wallet?.[activeIndex.toString()];
          if (wallet) {
            const privateKeyData = wallet.privateKey.data;
            privateKeyHex = Buffer.from(privateKeyData).toString('hex');
            const publicKeyData = wallet.publicKey.data;
            publicKeyHex = Buffer.from(publicKeyData).toString('hex');
            break;
          }
        }
      }
    }

    return { privateKeyHex, publicKeyHex };
  };

  lockWallet = async () => {
    await keyringService.setLocked();
    await userWalletService.logoutCurrentUser();
    await userWalletService.clear();
  };

  signOutWallet = async () => {
    await keyringService.updateKeyring();
    await userWalletService.logoutCurrentUser();
    await userWalletService.clear();
    sessionService.broadcastEvent('accountsChanged', []);
  };

  // lockadd here
  lockAdd = async () => {
    await keyringService.setLocked();
    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    openIndexPage('welcome?add=true');
  };

  // lockadd here
  resetPwd = async () => {
    // WARNING: This resets absolutely everything
    // This is used when the user forgets their password
    // It should only be called from the landing page when the user is logged out
    // And the user should be redirected to the landing page
    // After calling this function

    // TODO: I believe the user should be logged out here
    // e.g. call signOutCurrentUser

    // This clears local storage but a lot is still kept in memory
    await storage.clear();

    // Note that this does not clear the 'booted' state
    // We should fix this, but it would involve making changes to keyringService
    await keyringService.resetKeyRing();
    await keyringService.setLocked();

    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    // Redirect to welcome so that users can import their account again
    openIndexPage('/welcome');
  };

  // lockadd here
  restoreWallet = async () => {
    const switchingTo = 'mainnet';

    await keyringService.setLocked();

    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    openIndexPage('restore');
    await this.switchNetwork(switchingTo);
  };

  setPopupOpen = (isOpen) => {
    preferenceService.setPopupOpen(isOpen);
  };
  openIndexPage = openIndexPage;

  hasPageStateCache = () => pageStateCacheService.has();
  getPageStateCache = () => {
    if (!this.isUnlocked()) return null;
    return pageStateCacheService.get();
  };
  clearPageStateCache = () => pageStateCacheService.clear();
  setPageStateCache = (cache: CacheState) => pageStateCacheService.set(cache);

  getAddressCacheBalance = (address: string | undefined) => {
    if (!address) return null;
    return preferenceService.getAddressBalance(address);
  };

  setHasOtherProvider = (val: boolean) => preferenceService.setHasOtherProvider(val);
  getHasOtherProvider = () => preferenceService.getHasOtherProvider();

  getExternalLinkAck = () => preferenceService.getExternalLinkAck();

  setExternalLinkAck = (ack) => preferenceService.setExternalLinkAck(ack);

  getLocale = () => preferenceService.getLocale();
  setLocale = (locale: string) => preferenceService.setLocale(locale);

  getLastTimeSendToken = (address: string) => preferenceService.getLastTimeSendToken(address);
  setLastTimeSendToken = (address: string, token: TokenTransaction) =>
    preferenceService.setLastTimeSendToken(address, token);

  /* chains */
  getSavedChains = () => preferenceService.getSavedChains();
  saveChain = (id: string) => preferenceService.saveChain(id);
  updateChain = (list: string[]) => preferenceService.updateChain(list);
  /* connectedSites */

  getConnectedSite = permissionService.getConnectedSite;
  getConnectedSites = permissionService.getConnectedSites;
  setRecentConnectedSites = (sites: ConnectedSite[]) => {
    permissionService.setRecentConnectedSites(sites);
  };
  getRecentConnectedSites = () => {
    return permissionService.getRecentConnectedSites();
  };
  getCurrentConnectedSite = (tabId: number) => {
    const { origin } = sessionService.getSession(tabId) || {};
    return permissionService.getWithoutUpdate(origin);
  };
  addConnectedSite = (
    origin: string,
    name: string,
    icon: string,
    defaultChain = MAINNET_CHAIN_ID,
    isSigned = false
  ) => {
    permissionService.addConnectedSite(origin, name, icon, defaultChain, isSigned);
  };

  updateConnectSite = (origin: string, data: ConnectedSite) => {
    permissionService.updateConnectSite(origin, data);
    // sessionService.broadcastEvent(
    //   'chainChanged',
    //   {
    //     chain: CHAINS[data.chain].hex,
    //     networkVersion: CHAINS[data.chain].network,
    //   },
    //   data.origin
    // );
  };
  removeConnectedSite = (origin: string) => {
    sessionService.broadcastEvent('accountsChanged', [], origin);
    permissionService.removeConnectedSite(origin);
  };
  // getSitesByDefaultChain = permissionService.getSitesByDefaultChain;
  topConnectedSite = (origin: string) => permissionService.topConnectedSite(origin);
  unpinConnectedSite = (origin: string) => permissionService.unpinConnectedSite(origin);
  /* keyrings */

  clearKeyrings = () => keyringService.clearKeyrings();

  getPrivateKey = async (password: string, address: string) => {
    await this.verifyPassword(password);
    const keyring = await keyringService.getKeyringForAccount(address);
    if (!keyring) return null;
    return await keyring.exportAccount(address);
  };

  getMnemonics = async (password: string) => {
    await this.verifyPassword(password);
    const keyring = this._getKeyringByType(KEYRING_CLASS.MNEMONIC);
    const serialized = await keyring.serialize();
    const seedWords = serialized.mnemonic;
    return seedWords;
  };

  checkMnemonics = async () => {
    const keyring = this._getKeyringByType(KEYRING_CLASS.MNEMONIC);
    const serialized = await keyring.serialize();
    if (serialized) {
      return true;
    }
    return false;
  };

  // Note this is not used anymore
  getPrivateKeyForCurrentAccount = async (password: string) => {
    let privateKey: string | null = null;
    const keyrings = await this.getKeyrings(password || '');

    for (const keyring of keyrings) {
      if (keyring instanceof HDKeyring) {
        const mnemonic = await this.getMnemonics(password || '');
        const publicPrivateKeyTuple = await seed2PublicPrivateKey(mnemonic);

        // We need to know the signAlgo for the account, so we can use the correct private key
        // The signAlgo is stored in the account object for each public key return from fcl

        // getLoggedInAccount is using currentId from storage to get the account
        // That should tell us the account to use

        try {
          // Try using logged in accounts first
          const account = await getLoggedInAccount();
          const signAlgo =
            typeof account.signAlgoString === 'string'
              ? getSignAlgo(account.signAlgoString)
              : account.signAlgoString;
          privateKey =
            signAlgo === SIGN_ALGO_NUM_ECDSA_P256
              ? publicPrivateKeyTuple.P256.pk
              : publicPrivateKeyTuple.SECP256K1.pk;
        } catch {
          // Couldn't load from logged in accounts.
          // The signAlgo used to login isn't saved. We need to

          // We may be in the process of switching login. We have a public and private key, but we don't have the signAlgo or the address of the account
          console.error('Error getting logged in account - using the indexer instead');

          // Look for the account using the pubKey
          const network = (await this.getNetwork()) || 'mainnet';
          // Find the address associated with the pubKey
          // This should return an array of address information records
          const addressAndKeyInfoArray = await getAccountsByPublicKeyTuple(
            publicPrivateKeyTuple,
            network
          );

          // Follow the same logic as freshUserInfo in openapi.ts
          // Look for the P256 key first
          let index = addressAndKeyInfoArray.findIndex(
            (key) => key.publicKey === publicPrivateKeyTuple.P256.pubK
          );
          if (index === -1) {
            // If no P256 key is found, look for the SECP256K1 key
            index = addressAndKeyInfoArray.findIndex(
              (key) => key.publicKey === publicPrivateKeyTuple.SECP256K1.pubK
            );
          }

          const signAlgo: number = addressAndKeyInfoArray[index].signAlgo;

          privateKey =
            signAlgo === SIGN_ALGO_NUM_ECDSA_P256
              ? publicPrivateKeyTuple.P256.pk
              : publicPrivateKeyTuple.SECP256K1.pk;
        }

        break;
      } else if (
        keyring instanceof SimpleKeyring &&
        keyring.wallets &&
        keyring.wallets.length > 0 &&
        keyring.wallets[0].privateKey
      ) {
        privateKey = keyring.wallets[0].privateKey.toString('hex');
        break;
      }
    }
    if (!privateKey) {
      const error = new Error('No mnemonic or private key found in any of the keyrings.');
      throw error;
    }
    return privateKey;
  };

  getPubKey = async (): Promise<PublicKeyTuple> => {
    return await keyringService.getCurrentPublicKeyTuple();
  };

  importPrivateKey = async (password: string, pk: string) => {
    const privateKey = ethUtil.stripHexPrefix(pk);
    const buffer = Buffer.from(privateKey, 'hex');

    const error = new Error(i18n.t('the private key is invalid'));
    try {
      if (!ethUtil.isValidPrivate(buffer)) {
        throw error;
      }
    } catch {
      throw error;
    }

    const keyring = await keyringService.importPrivateKey(password, privateKey);
    return this._setCurrentAccountFromKeyring(keyring);
  };

  jsonToPrivateKeyHex = async (json: string, password: string): Promise<string | null> => {
    const pk = await jsonToKey(json, password);
    return pk ? Buffer.from(pk.data()).toString('hex') : null;
  };
  findAddressWithPrivateKey = async (pk: string, address: string) => {
    return await findAddressWithPK(pk, address);
  };
  findAddressWithSeedPhrase = async (
    seed: string,
    address: string | null = null,
    derivationPath: string = FLOW_BIP44_PATH,
    passphrase: string = ''
  ): Promise<PublicKeyAccount[]> => {
    return await findAddressWithSeed(seed, address, derivationPath, passphrase);
  };

  removePreMnemonics = () => keyringService.removePreMnemonics();
  private createKeyringWithMnemonics = async (
    password: string,
    mnemonic: string,
    derivationPath = FLOW_BIP44_PATH,
    passphrase = ''
  ) => {
    // TODO: NEED REVISIT HERE:
    await keyringService.clearKeyrings();

    const keyring = await keyringService.createKeyringWithMnemonics(
      password,
      mnemonic,
      derivationPath,
      passphrase
    );
    keyringService.removePreMnemonics();
    return this._setCurrentAccountFromKeyring(keyring);
  };

  getHiddenAddresses = () => preferenceService.getHiddenAddresses();
  showAddress = (type: string, address: string) => preferenceService.showAddress(type, address);
  hideAddress = (type: string, address: string, brandName: string) => {
    preferenceService.hideAddress(type, address, brandName);
    const current = preferenceService.getCurrentAccount();
    if (current?.address === address && current.type === type) {
      this.resetCurrentAccount();
    }
  };

  removeAddress = async (password: string, address: string, type: string, brand?: string) => {
    await keyringService.removeAccount(password, address, type, brand);
    preferenceService.removeAddressBalance(address);
    const current = preferenceService.getCurrentAccount();
    if (current?.address === address && current.type === type && current.brandName === brand) {
      this.resetCurrentAccount();
    }
  };

  resetCurrentAccount = async () => {
    const [account] = await this.getAccounts();
    if (account) {
      preferenceService.setCurrentAccount(account);
    } else {
      preferenceService.setCurrentAccount(null);
    }
  };

  // @deprecated - not used anymore
  addKeyring = async (password: string, keyringId) => {
    const keyring = stashKeyrings[keyringId];
    if (keyring) {
      await keyringService.addKeyring(password, keyring);
      this._setCurrentAccountFromKeyring(keyring);
    } else {
      throw new Error('failed to addKeyring, keyring is undefined');
    }
  };

  getKeyringByType = (type: string) => keyringService.getKeyringByType(type);

  checkHasMnemonic = () => {
    try {
      const keyring = this._getKeyringByType(KEYRING_CLASS.MNEMONIC);
      return !!keyring.mnemonic;
    } catch {
      return false;
    }
  };
  // @deprecated - not used anymore
  deriveNewAccountFromMnemonic = async (password: string) => {
    const keyring = this._getKeyringByType(KEYRING_CLASS.MNEMONIC);

    const result = await keyringService.addNewAccount(password, keyring);
    this._setCurrentAccountFromKeyring(keyring, -1);
    return result;
  };

  getAccountsCount = async () => {
    const accounts = await keyringService.getAccounts();
    return accounts.filter((x) => x).length;
  };

  getKeyrings = async (password) => {
    await this.verifyPassword(password);
    const accounts = await keyringService.getKeyring();
    return accounts;
  };

  getAllVisibleAccounts: () => Promise<DisplayedKeryring[]> = async () => {
    const typedAccounts = await keyringService.getAllTypedVisibleAccounts();

    return typedAccounts.map((account) => ({
      ...account,
      keyring: new DisplayKeyring(account.keyring),
    }));
  };

  getAllVisibleAccountsArray: () => Promise<PreferenceAccount[]> = () => {
    return keyringService.getAllVisibleAccountsArray();
  };

  getAllClassAccounts: () => Promise<DisplayedKeryring[]> = async () => {
    const typedAccounts = await keyringService.getAllTypedAccounts();

    return typedAccounts.map((account) => ({
      ...account,
      keyring: new DisplayKeyring(account.keyring),
    }));
  };

  changeAccount = (account: PreferenceAccount) => {
    preferenceService.setCurrentAccount(account);
  };

  isUseLedgerLive = () => preferenceService.isUseLedgerLive();

  // updateUseLedgerLive = async (value: boolean) =>
  //   preferenceService.updateUseLedgerLive(value);

  connectHardware = async ({
    type,
    hdPath,
    needUnlock = false,
    isWebUSB = false,
  }: {
    type: KeyringType;
    hdPath?: string;
    needUnlock?: boolean;
    isWebUSB?: boolean;
  }) => {
    let keyring;
    let stashKeyringId: number | null = null;
    try {
      keyring = this._getKeyringByType(type);
    } catch {
      const Keyring = keyringService.getKeyringClassForType(type);
      if (!Keyring) {
        throw new Error(`No keyring class found for type: ${type}`);
      }
      keyring = new Keyring();
      stashKeyringId = Object.values(stashKeyrings).length;
      stashKeyrings[stashKeyringId] = keyring;
    }

    if (hdPath && keyring.setHdPath) {
      keyring.setHdPath(hdPath);
    }

    if (needUnlock) {
      await keyring.unlock();
    }

    if (keyring.useWebUSB) {
      keyring.useWebUSB(isWebUSB);
    }

    return stashKeyringId;
  };

  signPersonalMessage = async (type: string, from: string, data: string, options?: any) => {
    const keyring = await keyringService.getKeyringForAccount(from, type);
    const res = await keyringService.signPersonalMessage(keyring, { from, data }, options);
    if (type === KEYRING_TYPE.WalletConnectKeyring) {
      eventBus.emit(EVENTS.broadcastToUI, {
        method: EVENTS.SIGN_FINISHED,
        params: {
          success: true,
          data: res,
        },
      });
    }
    return res;
  };

  signTransaction = async (type: string, from: string, data: any, options?: any) => {
    const keyring = await keyringService.getKeyringForAccount(from, type);
    const res = await keyringService.signTransaction(keyring, data, options);

    return res;
  };

  requestKeyring = (type, methodName, keyringId: number | null, ...params) => {
    let keyring;
    if (keyringId !== null && keyringId !== undefined) {
      keyring = stashKeyrings[keyringId];
    } else {
      try {
        keyring = this._getKeyringByType(type);
      } catch {
        const Keyring = keyringService.getKeyringClassForType(type);
        if (!Keyring) {
          throw new Error(`No keyring class found for type: ${type}`);
        }
        keyring = new Keyring();
      }
    }
    if (keyring[methodName]) {
      return keyring[methodName].call(keyring, ...params);
    }
  };

  // @deprecated - not used anymore
  unlockHardwareAccount = async (password: string, keyring, indexes, keyringId) => {
    let keyringInstance: any = null;
    try {
      keyringInstance = this._getKeyringByType(keyring);
    } catch {
      // NOTHING
    }
    if (!keyringInstance && keyringId !== null && keyringId !== undefined) {
      await keyringService.addKeyring(password, stashKeyrings[keyringId]);
      keyringInstance = stashKeyrings[keyringId];
    }
    for (let i = 0; i < indexes.length; i++) {
      keyringInstance!.setAccountToUnlock(indexes[i]);
      await keyringService.addNewAccount(password, keyringInstance);
    }

    return this._setCurrentAccountFromKeyring(keyringInstance);
  };

  setIsDefaultWallet = (val: boolean) => preferenceService.setIsDefaultWallet(val);
  isDefaultWallet = () => preferenceService.getIsDefaultWallet();

  private _getKeyringByType(type) {
    const keyring = keyringService.getKeyringsByType(type)[0];

    if (keyring) {
      return keyring;
    }

    throw ethErrors.rpc.internal(`No ${type} keyring found`);
  }

  private async _setCurrentAccountFromKeyring(keyring, index = 0) {
    const accounts = keyring.getAccountsWithBrand
      ? await keyring.getAccountsWithBrand()
      : await keyring.getAccounts();
    const account = accounts[index < 0 ? index + accounts.length : index];

    if (!account) {
      throw new Error('the current account is empty');
    }

    const _account = {
      address: typeof account === 'string' ? account : account.address,
      type: keyring.type,
      brandName: typeof account === 'string' ? keyring.type : account.brandName,
    };
    preferenceService.setCurrentAccount(_account);

    return [_account];
  }

  getHighlightWalletList = () => {
    return preferenceService.getWalletSavedList();
  };

  updateHighlightWalletList = (list) => {
    return preferenceService.updateWalletSavedList(list);
  };

  getAlianName = (address: string) => preferenceService.getAlianName(address);
  updateAlianName = (address: string, name: string) =>
    preferenceService.updateAlianName(address, name);
  getAllAlianName = () => preferenceService.getAllAlianName();

  getIsFirstOpen = () => {
    return preferenceService.getIsFirstOpen();
  };
  updateIsFirstOpen = () => {
    return preferenceService.updateIsFirstOpen();
  };
  // userinfo
  getUserInfo = async (forceRefresh: boolean = false): Promise<UserInfoResponse> => {
    console.log('getUserInfo', forceRefresh);
    if (!forceRefresh) {
      const data = await userInfoService.getCurrentUserInfo();
      if (data.username.length) {
        return data;
      }
    }
    // Either force refresh or the user info is not set
    return await userInfoService.fetchUserInfo();
  };

  checkAccessibleNft = async (childAccount) => {
    const network = userWalletService.getNetwork();
    const validData = getValidData<ChildAccountNFTsStore>(
      childAccountNFTsKey(network, childAccount)
    );
    if (validData) {
      return validData;
    }
    return await nftService.loadChildAccountNFTs(network, childAccount);
  };

  checkAccessibleFt = async (childAccount) => {
    const network = await this.getNetwork();

    const address = await userWalletService.getParentAddress();
    if (!address) {
      throw new Error('Parent address not found');
    }
    const result = await openapiService.queryAccessibleFt(address, childAccount);

    return result;
  };

  getParentAddress = async () => {
    const address = await userWalletService.getParentAddress();

    return address;
  };

  returnParentWallet = async () => {
    const wallet = await userWalletService.getParentAccount();

    return wallet;
  };

  getDashIndex = async () => {
    const dashIndex = await userInfoService.getDashIndex();
    return dashIndex;
  };

  setDashIndex = (data: number) => {
    userInfoService.setDashIndex(data);
  };

  initCoinListSession = async (address: string) => {
    const network = await this.getNetwork();
    console.log('initCoinListSession', network, address);
    await coinListService.initCoinList(network, address);
  };

  reqeustEvmNft = async () => {
    const address = await this.getEvmAddress();
    const network = await this.getNetwork();
    const evmList = await openapiService.EvmNFTID(network, address);
    return evmList;
  };

  EvmNFTcollectionList = async (collection) => {
    const address = await this.getEvmAddress();
    const evmList = await openapiService.EvmNFTcollectionList(address, collection);
    return evmList;
  };

  reqeustEvmNftList = async () => {
    try {
      // Check if the nftList is already in storage and not expired
      const cachedNFTList = await storage.getExpiry('evmnftList');
      if (cachedNFTList) {
        return cachedNFTList;
      } else {
        // Fetch the nftList from the API
        const nftList = await openapiService.evmNFTList();
        // Cache the nftList with a one-hour expiry (3600000 milliseconds)
        await storage.setExpiry('evmnftList', nftList, 3600000);
        return nftList;
      }
    } catch (error) {
      console.error('Error fetching NFT list:', error);
      throw error;
    }
  };

  requestCadenceNft = async () => {
    const network = await this.getNetwork();
    const address = await this.getCurrentAddress();
    const NFTList = await openapiService.getNFTCadenceList(address!, network);
    return NFTList;
  };

  requestMainNft = async () => {
    const network = await this.getNetwork();
    const address = await this.getCurrentAddress();
    const NFTList = await openapiService.getNFTCadenceList(address!, network);
    return NFTList;
  };

  private currencyBalance = (balance: string, price) => {
    const bnBalance = new BN(balance);
    const currencyBalance = bnBalance.times(new BN(price));
    return currencyBalance.toNumber();
  };

  // addressBook
  setRecent = async (data) => {
    const network = await this.getNetwork();
    addressBookService.setRecent(data, network);
  };

  getRecent = async (): Promise<Contact[]> => {
    const network = await this.getNetwork();
    return addressBookService.getRecent(network);
  };

  getAddressBook = async (): Promise<Contact[]> => {
    const network = await this.getNetwork();
    const addressBook = await addressBookService.getAddressBook(network);
    if (!addressBook) {
      return await this.refreshAddressBook();
    } else if (!addressBook[0]) {
      return await this.refreshAddressBook();
    }
    return addressBook;
  };

  refreshAddressBook = async (): Promise<Contact[]> => {
    const network = await this.getNetwork();
    const { data } = await openapiService.getAddressBook();
    const list = data.contacts;
    if (list && list.length > 0) {
      list.forEach((addressBook, index) => {
        if (addressBook && addressBook.avatar) {
          list[index].avatar = userInfoService.addTokenForFirebaseImage(addressBook.avatar);
        }
      });
    }
    addressBookService.setAddressBook(list, network);
    return list;
  };

  searchByUsername = async (searchKey: string) => {
    const apiResponse = await openapiService.searchUser(searchKey);

    return (
      apiResponse?.data?.users?.map((user, index): Contact => {
        const address = withPrefix(user.address) || '';
        return {
          group: 'Flow Wallet User',
          address: address,
          contact_name: user.nickname,
          username: user.username,
          avatar: user.avatar,
          domain: {
            domain_type: 999,
            value: '',
          },
          contact_type: ContactType.User,
          id: index,
        };
      }) || []
    );
  };

  checkAddress = async (address: string) => {
    const formatted = withPrefix(address.trim())!;

    if (!/^(0x)?[a-fA-F0-9]{16}$/.test(formatted)) {
      throw new Error('Invalid address length or format');
    }

    const account = await openapiService.getFlowAccount(formatted);
    if (!account) {
      throw new Error("Can't find address in chain");
    }
    return account;
  };

  /*
   * Load the main (flow) accounts for the current private key
   */

  getMainAccounts = async (): Promise<MainAccount[] | null> => {
    if (!this.isUnlocked()) {
      return null;
    }
    const wallets = await userWalletService.getMainAccounts();

    return wallets;
  };

  getActiveAccountType = (): ActiveAccountType => {
    const activeWallet = userWalletService.getActiveAccountType();
    return activeWallet;
  };

  /*
   * Sets the active main wallet and current child wallet
   * This is used to switch between main accounts or switch from main to child wallet
   *
   * wallet: BlockchainResponse, // The wallet to set as active
   * key: ActiveChildType | null, // null for main wallet
   * index: number | null = null // The index of the main wallet in the array to switch to
   */
  setActiveWallet = async (
    wallet: WalletAccount,
    key: ActiveChildType_depreciated | null,
    index: number | null = null
  ) => {
    if (key === null) {
      // We're setting the main wallet
      await userWalletService.setCurrentAccount(
        wallet.address as FlowAddress,
        wallet.address as WalletAddress
      );
    } else {
      const parentAddress = await userWalletService.getParentAddress();
      if (!parentAddress) {
        throw new Error('Parent address not found');
      }
      await userWalletService.setCurrentAccount(parentAddress, wallet.address as WalletAddress);
    }
    // Clear collections
    this.clearNFTCollection();
    this.clearEvmNFTList();
    this.clearCoinList();
    transactionService.clear();

    // If switching main wallet, refresh the EVM wallet
    if (key === null) {
      await this.queryEvmAddress(wallet.address);
    }
  };

  hasCurrentWallet = async () => {
    const wallet = await userWalletService.getCurrentWallet();
    return wallet?.address !== '';
  };

  getCurrentWallet = async (): Promise<WalletAccount | null> => {
    if (!this.isUnlocked()) {
      return null;
    }
    const wallet = await userWalletService.getCurrentWallet();

    return wallet;
  };

  getEvmWallet = async (): Promise<WalletAccount | null> => {
    const wallet = await userWalletService.getEvmAccount();

    return wallet;
  };

  getRawEvmAddressWithPrefix = async (): Promise<EvmAddress | null> => {
    // Get the current EVM address without throwing an error
    const evmAddress = await userWalletService.getCurrentEvmAddress();
    if (!evmAddress) {
      return null;
    }
    return withPrefix(evmAddress) as EvmAddress;
  };

  getEvmAddress = async () => {
    const address = await this.getRawEvmAddressWithPrefix();

    if (!isValidEthereumAddress(address)) {
      throw new Error(`Invalid Ethereum address ${address}`);
    }
    return address;
  };

  getCurrentAddress = async (): Promise<WalletAddress | null> => {
    const address = userWalletService.getCurrentAddress();

    return address;
  };

  getMainAddress = async (): Promise<FlowAddress | null> => {
    if (!this.isUnlocked()) {
      return null;
    }
    const address = await userWalletService.getParentAddress();

    return address;
  };

  sendTransaction = async (cadence: string, args: any[]): Promise<string> => {
    return await userWalletService.sendTransaction(cadence, args);
  };

  createCOA = async (amount = '0.0'): Promise<string> => {
    const formattedAmount = parseFloat(amount).toFixed(8);

    const script = await getScripts(userWalletService.getNetwork(), 'evm', 'createCoa');

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(formattedAmount, t.UFix64),
    ]);

    // try to seal it
    try {
      await fcl.tx(txID).onceExecuted();
      // Track with success
      await this.trackCoaCreation(txID);
    } catch (error) {
      console.error('Error sealing transaction:', error);
      // Track with error
      await this.trackCoaCreation(txID, error.message);
    }

    return txID;
  };

  createCoaEmpty = async (): Promise<string> => {
    await this.getNetwork();

    const script = await getScripts(userWalletService.getNetwork(), 'evm', 'createCoaEmpty');

    const txID = await userWalletService.sendTransaction(script, []);

    // try to seal it
    try {
      await fcl.tx(txID).onceExecuted();

      // Track with success
      await this.trackCoaCreation(txID);
    } catch (error) {
      console.error('Error sealing transaction:', error);
      // Track with error
      await this.trackCoaCreation(txID, error.message);
    }

    return txID;
  };

  trackCoaCreation = async (txID: string, errorMessage?: string) => {
    mixpanelTrack.track('coa_creation', {
      tx_id: txID,
      flow_address: (await this.getCurrentAddress()) || '',
      error_message: errorMessage,
    });
  };

  // Master send token function that takes a transaction state from the front end and returns the transaction ID
  transferTokens = async (transactionState: TransactionState): Promise<string> => {
    const transferTokensOnCadence = async () => {
      return this.transferCadenceTokens(
        transactionState.selectedToken.symbol,
        transactionState.toAddress,
        transactionState.amount
      );
    };

    const transferTokensFromChildToCadence = async () => {
      return this.sendFTfromChild(
        transactionState.fromAddress,
        transactionState.toAddress,
        'flowTokenProvider',
        transactionState.amount,
        transactionState.selectedToken.symbol
      );
    };

    const transferFlowFromEvmToCadence = async () => {
      return this.withdrawFlowEvm(transactionState.amount, transactionState.toAddress);
    };

    const transferFTFromEvmToCadence = async () => {
      return this.transferFTFromEvm(
        transactionState.selectedToken['flowIdentifier'],
        transactionState.amount,
        transactionState.toAddress,
        transactionState.selectedToken
      );
    };

    // Returns the transaction ID
    const transferTokensOnEvm = async () => {
      let address, gas, value, data;

      if (transactionState.selectedToken.symbol.toLowerCase() === 'flow') {
        address = transactionState.toAddress;
        gas = '1';
        // the amount is always stored as a string in the transaction state
        const integerAmountStr = convertToIntegerAmount(
          transactionState.amount,
          // Flow needs 18 digits always for EVM
          18
        );
        value = new BN(integerAmountStr).toString(16);
        data = '0x';
      } else {
        const integerAmountStr = convertToIntegerAmount(
          transactionState.amount,
          transactionState.selectedToken.decimals
        );

        // Get the current network
        const network = await this.getNetwork();
        // Get the Web3 provider
        const provider = new Web3.providers.HttpProvider(EVM_ENDPOINT[network]);
        // Get the web3 instance
        const web3Instance = new Web3(provider);
        // Get the erc20 contract
        const erc20Contract = new web3Instance.eth.Contract(
          erc20ABI,
          transactionState.selectedToken.address
        );
        // Encode the data
        const encodedData = erc20Contract.methods
          .transfer(ensureEvmAddressPrefix(transactionState.toAddress), integerAmountStr)
          .encodeABI();
        gas = '1312d00';
        address = ensureEvmAddressPrefix(transactionState.selectedToken.address);
        value = '0x0'; // Zero value as hex
        data = encodedData.startsWith('0x') ? encodedData : `0x${encodedData}`;
      }

      // Send the transaction
      return this.sendEvmTransaction(address, gas, value, data);
    };

    const transferFlowFromCadenceToEvm = async () => {
      return this.transferFlowEvm(transactionState.toAddress, transactionState.amount);
    };

    const transferFTFromCadenceToEvm = async () => {
      const address = transactionState.selectedToken!.address.startsWith('0x')
        ? transactionState.selectedToken!.address.slice(2)
        : transactionState.selectedToken!.address;

      return this.transferFTToEvmV2(
        `A.${address}.${transactionState.selectedToken!.contractName}.Vault`,
        transactionState.amount,
        transactionState.toAddress
      );
    };

    // Validate the amount. Just to be sure!
    if (!validateAmount(transactionState.amount, transactionState.selectedToken.decimals)) {
      throw new Error('Invalid amount or decimal places');
    }

    // Switch on the current transaction state
    switch (transactionState.currentTxState) {
      case 'FTFromEvmToCadence':
        return await transferFTFromEvmToCadence();
      case 'FlowFromEvmToCadence':
        return await transferFlowFromEvmToCadence();
      case 'FTFromChildToCadence':
      case 'FlowFromChildToCadence':
        return await transferTokensFromChildToCadence();
      case 'FTFromCadenceToCadence':
      case 'FlowFromCadenceToCadence':
        return await transferTokensOnCadence();
      case 'FlowFromEvmToEvm':
      case 'FTFromEvmToEvm':
        return await transferTokensOnEvm();
      case 'FlowFromCadenceToEvm':
        return await transferFlowFromCadenceToEvm();
      case 'FTFromCadenceToEvm':
        return await transferFTFromCadenceToEvm();
      default:
        throw new Error(`Unsupported transaction state: ${transactionState.currentTxState}`);
    }
  };

  transferFlowEvm = async (
    recipientEVMAddressHex: string,
    amount = '1.0',
    gasLimit = 30000000
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'evm',
      'transferFlowToEvmAddress'
    );
    if (recipientEVMAddressHex.startsWith('0x')) {
      recipientEVMAddressHex = recipientEVMAddressHex.substring(2);
    }

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(recipientEVMAddressHex, t.String),
      fcl.arg(amount, t.UFix64),
      fcl.arg(gasLimit, t.UInt64),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: recipientEVMAddressHex,
      amount: amount,
      ft_identifier: 'FLOW',
      type: 'evm',
    });

    return txID;
  };

  transferFTToEvm = async (
    tokenContractAddress: string,
    tokenContractName: string,
    amount = '1.0',
    contractEVMAddress: string,
    data
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'bridge',
      'bridgeTokensToEvmAddress'
    );
    if (contractEVMAddress.startsWith('0x')) {
      contractEVMAddress = contractEVMAddress.substring(2);
    }
    const dataBuffer = Buffer.from(data.slice(2), 'hex');
    const dataArray = Uint8Array.from(dataBuffer);
    const regularArray = Array.from(dataArray);
    const gasLimit = 30000000;

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(tokenContractAddress, t.Address),
      fcl.arg(tokenContractName, t.String),
      fcl.arg(amount, t.UFix64),
      fcl.arg(contractEVMAddress, t.String),
      fcl.arg(regularArray, t.Array(t.UInt8)),
      fcl.arg(gasLimit, t.UInt64),
    ]);
    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: tokenContractAddress,
      amount: amount,
      ft_identifier: tokenContractName,
      type: 'evm',
    });
    return txID;
  };

  transferFTToEvmV2 = async (
    vaultIdentifier: string,
    amount = '0.0',
    recipient: string
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'bridge',
      'bridgeTokensToEvmAddressV2'
    );

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(vaultIdentifier, t.String),
      fcl.arg(amount, t.UFix64),
      fcl.arg(recipient, t.String),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: recipient,
      amount: amount,
      ft_identifier: vaultIdentifier,
      type: 'evm',
    });

    return txID;
  };

  transferFTFromEvm = async (
    flowidentifier: string,
    amount: string,
    receiver: string,
    tokenResult: TokenInfo
  ): Promise<string> => {
    const decimals = tokenResult.decimals ?? 18;
    if (decimals < 0 || decimals > 77) {
      // 77 is BN.js max safe decimals
      throw new Error('Invalid decimals');
    }

    const integerAmountStr = convertToIntegerAmount(amount, decimals);

    const script = await getScripts(
      userWalletService.getNetwork(),
      'bridge',
      'bridgeTokensFromEvmToFlowV3'
    );
    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(flowidentifier, t.String),
      fcl.arg(integerAmountStr, t.UInt256),
      fcl.arg(receiver, t.Address),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: receiver,
      amount: amount,
      ft_identifier: flowidentifier,
      type: 'evm',
    });

    return txID;
  };

  withdrawFlowEvm = async (amount = '0.0', address: string): Promise<string> => {
    const script = await getScripts(userWalletService.getNetwork(), 'evm', 'withdrawCoa');

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(amount, t.UFix64),
      fcl.arg(address, t.Address),
    ]);

    return txID;
  };

  fundFlowEvm = async (amount = '1.0'): Promise<string> => {
    const script = await getScripts(userWalletService.getNetwork(), 'evm', 'fundCoa');

    return await userWalletService.sendTransaction(script, [fcl.arg(amount, t.UFix64)]);
  };

  coaLink = async (): Promise<string> => {
    await this.getNetwork();

    const script = await getScripts(userWalletService.getNetwork(), 'evm', 'coaLink');

    // TODO: check if args are needed
    const result = await userWalletService.sendTransaction(script, []);

    return result;
  };

  checkCoaLink = async (): Promise<boolean> => {
    const checkedAddress = await storage.get('coacheckAddress');

    const script = await getScripts(userWalletService.getNetwork(), 'evm', 'checkCoaLink');
    const mainAddress = await this.getMainAddress();

    if (checkedAddress === mainAddress) {
      return true;
    } else if (mainAddress) {
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(mainAddress, t.Address)],
      });
      if (result) {
        await storage.set('coacheckAddress', mainAddress);
      }
      return !!result;
    }
    return false;
  };

  bridgeToEvm = async (flowIdentifier, amount = '1.0'): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'bridge',
      'bridgeTokensToEvmV2'
    );

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(flowIdentifier, t.String),
      fcl.arg(amount, t.UFix64),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: (await this.getRawEvmAddressWithPrefix()) ?? '',
      amount: amount,
      ft_identifier: flowIdentifier,
      type: 'evm',
    });

    return txID;
  };

  bridgeToFlow = async (flowIdentifier, amount = '1.0', tokenResult): Promise<string> => {
    const decimals = tokenResult.decimals ?? 18;
    if (decimals < 0 || decimals > 77) {
      // 77 is BN.js max safe decimals
      throw new Error('Invalid decimals');
    }
    const integerAmountStr = convertToIntegerAmount(amount, decimals);

    const script = await getScripts(
      userWalletService.getNetwork(),
      'bridge',
      'bridgeTokensFromEvmV2'
    );
    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(flowIdentifier, t.String),
      fcl.arg(integerAmountStr, t.UInt256),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getRawEvmAddressWithPrefix()) ?? '',
      to_address: (await this.getCurrentAddress()) || '',
      amount: amount,
      ft_identifier: flowIdentifier,
      type: 'flow',
    });

    return txID;
  };

  queryEvmAddress = async (address: string | FlowAddress): Promise<string | null> => {
    if (address.length > 20) {
      return null;
    }
    if (!this.isUnlocked()) {
      return null;
    }
    let evmAddress;
    try {
      evmAddress = await userWalletService.getCurrentEvmAddress();
    } catch (error) {
      evmAddress = '';
      console.error('Error getting EVM address:', error);
    }
    if (isValidEthereumAddress(evmAddress)) {
      return evmAddress;
    }
    return null;
  };

  checkCanMoveChild = async () => {
    const activeAccountType = await this.getActiveAccountType();
    if (activeAccountType !== 'child') {
      const evmAddress = await userWalletService.getCurrentEvmAddress();
      const childResp = await userWalletService.getChildAccounts();

      if (evmAddress !== null || (childResp && childResp?.length > 0)) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  };

  sendEvmTransaction = async (to: string, gas: string | number, value: string, data: string) => {
    if (to.startsWith('0x')) {
      to = to.substring(2);
    }
    await this.getNetwork();

    const script = await getScripts(userWalletService.getNetwork(), 'evm', 'callContractV2');
    const gasLimit = 30000000;
    const dataBuffer = Buffer.from(data.slice(2), 'hex');
    const dataArray = Uint8Array.from(dataBuffer);
    const regularArray = Array.from(dataArray);

    // Handle the case where the value is '0.0'
    if (/^0\.0+$/.test(value)) {
      value = '0x0';
    }

    if (!value.startsWith('0x')) {
      value = '0x' + value;
    }

    // At this point the value should be a valid hex string. Check to make sure
    if (!/^0x[0-9a-fA-F]+$/.test(value)) {
      throw new Error('Invalid hex string value');
    }

    // Convert hex to BigInt
    const transactionValue = value === '0x' ? BigInt(0) : BigInt(value);

    const result = await userWalletService.sendTransaction(script, [
      fcl.arg(to, t.String),
      fcl.arg(transactionValue.toString(), t.UInt256),
      fcl.arg(regularArray, t.Array(t.UInt8)),
      fcl.arg(gasLimit, t.UInt64),
    ]);

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getRawEvmAddressWithPrefix()) ?? '',
      to_address: to,
      amount: value,
      ft_identifier: 'FLOW',
      type: 'evm',
    });

    return result;
  };

  dapSendEvmTX = async (to: string, gas: bigint, value: string, data: string) => {
    if (to.startsWith('0x')) {
      to = to.substring(2);
    }
    await this.getNetwork();

    const script = await getScripts(userWalletService.getNetwork(), 'evm', 'callContractV2');
    const gasLimit = gas || 30000000;
    const dataBuffer = Buffer.from(data.slice(2), 'hex');
    const dataArray = Uint8Array.from(dataBuffer);
    const regularArray = Array.from(dataArray);

    // Handle the case where the value is '0.0'
    if (/^0\.0+$/.test(value)) {
      value = '0x0';
    }

    if (!value.startsWith('0x')) {
      value = '0x' + value;
    }

    // Check if the value is a string
    if (typeof value === 'string') {
      // Check if it starts with '0x'
      if (value.startsWith('0x')) {
        // If it's hex without '0x', add '0x'
        if (!/^0x[0-9a-fA-F]+$/.test(value)) {
          value = '0x' + value.replace(/^0x/, '');
        }
      } else {
        // If it's a regular string, convert to hex
        value = web3.utils.toHex(value);
      }
    }
    // At this point the value should be a valid hex string. Check to make sure
    if (!/^0x[0-9a-fA-F]+$/.test(value)) {
      throw new Error('Invalid hex string value');
    }
    // Convert hex to BigInt directly to avoid potential number overflow
    const transactionValue = value === '0x' ? BigInt(0) : BigInt(value);

    await userWalletService.sendTransaction(script, [
      fcl.arg(to, t.String),
      fcl.arg(transactionValue.toString(), t.UInt256),
      fcl.arg(regularArray, t.Array(t.UInt8)),
      fcl.arg(gasLimit.toString(), t.UInt64),
    ]);

    let evmAddress = await this.getEvmAddress();

    mixpanelTrack.track('ft_transfer', {
      from_address: evmAddress,
      to_address: to,
      amount: transactionValue.toString(),
      ft_identifier: 'FLOW',
      type: 'evm',
    });

    if (evmAddress.startsWith('0x')) {
      evmAddress = evmAddress.substring(2) as EvmAddress;
    }

    const addressNonce = await this.getNonce(evmAddress);

    const keccak256 = (data: Buffer) => {
      return ethUtil.keccak256(data);
    };

    // [nonce, gasPrice, gasLimit, to.addressData, value, data, v, r, s]

    const directCallTxType = 255;
    const contractCallSubType = 5;
    const noceNumber = Number(addressNonce);
    const gasPrice = 0;
    const transaction = [
      noceNumber, // nonce
      gasPrice, // Fixed value
      gasLimit, // Gas Limit
      Buffer.from(to, 'hex'), // To Address
      transactionValue, // Value
      Buffer.from(dataArray), // Call Data
      directCallTxType, // Fixed value
      BigInt('0x' + evmAddress), // From Account
      contractCallSubType, // SubType
    ];
    const encodedData = encode(transaction);
    const hash = keccak256(Buffer.from(encodedData));
    const hashHexString = Buffer.from(hash).toString('hex');
    if (hashHexString) {
      return hashHexString;
    } else {
      return null;
    }
  };

  getAllAccountBalance = async (addresses: string[]): Promise<string> => {
    await this.getNetwork();

    const script = await getScripts(
      userWalletService.getNetwork(),
      'basic',
      'getFlowBalanceForAnyAccounts'
    );

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(addresses, t.Array(t.String))],
    });
    return result;
  };

  getEvmBalance = async (hexEncodedAddress: string): Promise<string> => {
    await this.getNetwork();

    if (hexEncodedAddress.startsWith('0x')) {
      hexEncodedAddress = hexEncodedAddress.substring(2);
    }

    const script = await getScripts(userWalletService.getNetwork(), 'evm', 'getBalance');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(hexEncodedAddress, t.String)],
    });
    return result;
  };

  getFlowBalance = async (address: string): Promise<string> => {
    const cacheKey = `checkFlowBalance${address}`;
    let balance: string = await storage.getExpiry(cacheKey);
    const ttl = 1 * 60 * 1000;
    if (!balance) {
      try {
        const account = await fcl.account(address);
        // Returns the FLOW balance of the account in 10^8

        balance = convertFlowBalanceToString(account.balance);

        if (balance) {
          // Store the result in the cache with an expiry
          await storage.setExpiry(cacheKey, balance, ttl);
        }
      } catch (error) {
        console.error('Error occurred:', error);
        return '';
      }
    }

    return balance;
  };

  getNonce = async (hexEncodedAddress: string): Promise<string> => {
    await this.getNetwork();

    const script = await getScripts(userWalletService.getNetwork(), 'evm', 'getNonce');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(hexEncodedAddress, t.String)],
    });
    return result;
  };

  getChildAccounts = async (): Promise<WalletAccount[] | null> => {
    return await userWalletService.getChildAccounts();
  };

  unlinkChildAccount = async (address: string): Promise<string> => {
    await this.getNetwork();
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'getChildAccountMeta'
    );

    return await userWalletService.sendTransaction(script, [fcl.arg(address, t.Address)]);
  };

  unlinkChildAccountV2 = async (address: string): Promise<string> => {
    await this.getNetwork();
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'unlinkChildAccount'
    );

    return await userWalletService.sendTransaction(script, [fcl.arg(address, t.Address)]);
  };

  editChildAccount = async (
    address: string,
    name: string,
    description: string,
    thumbnail: string
  ): Promise<string> => {
    await this.getNetwork();
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'editChildAccount'
    );

    return await userWalletService.sendTransaction(script, [
      fcl.arg(address, t.Address),
      fcl.arg(name, t.String),
      fcl.arg(description, t.String),
      fcl.arg(thumbnail, t.String),
    ]);
  };

  // TODO: Replace with generic token
  transferCadenceTokens = async (
    symbol: string,
    address: string,
    amount: string
  ): Promise<string> => {
    const token = await openapiService.getTokenInfo(symbol);
    const script = await getScripts(userWalletService.getNetwork(), 'ft', 'transferTokensV3');

    if (!token) {
      throw new Error(`Invaild token name - ${symbol}`);
    }
    // Validate the amount just to be safe
    if (!validateAmount(amount, token.decimals)) {
      throw new Error(`Invalid amount - ${amount}`);
    }

    await this.getNetwork();

    const txID = await userWalletService.sendTransaction(
      script
        .replaceAll('<Token>', token.contractName)
        .replaceAll('<TokenBalancePath>', token.path.balance)
        .replaceAll('<TokenReceiverPath>', token.path.receiver)
        .replaceAll('<TokenStoragePath>', token.path.vault)
        .replaceAll('<TokenAddress>', token.address),
      [fcl.arg(amount, t.UFix64), fcl.arg(address, t.Address)]
    );

    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: address,
      amount: amount,
      ft_identifier: token.contractName,
      type: 'flow',
    });

    return txID;
  };

  revokeKey = async (index: string): Promise<string> => {
    const script = await getScripts(userWalletService.getNetwork(), 'basic', 'revokeKey');

    return await userWalletService.sendTransaction(script, [fcl.arg(index, t.Int)]);
  };

  addKeyToAccount = async (
    publicKey: string,
    signatureAlgorithm: number,
    hashAlgorithm: number,
    weight: number
  ): Promise<string> => {
    return await userWalletService.sendTransaction(
      `
      import Crypto
      transaction(publicKey: String, signatureAlgorithm: UInt8, hashAlgorithm: UInt8, weight: UFix64) {
          prepare(signer: AuthAccount) {
              let key = PublicKey(
                  publicKey: publicKey.decodeHex(),
                  signatureAlgorithm: SignatureAlgorithm(rawValue: signatureAlgorithm)!
              )
              signer.keys.add(
                  publicKey: key,
                  hashAlgorithm: HashAlgorithm(rawValue: hashAlgorithm)!,
                  weight: weight
              )
          }
      }
      `,
      [
        fcl.arg(publicKey, t.String),
        fcl.arg(signatureAlgorithm, t.UInt8),
        fcl.arg(hashAlgorithm, t.UInt8),
        fcl.arg(weight.toFixed(1), t.UFix64),
      ]
    );
  };

  // TODO: Replace with generic token
  claimFTFromInbox = async (
    domain: string,
    amount: string,
    symbol: string,
    root = 'meow'
  ): Promise<string> => {
    const domainName = domain.split('.')[0];
    const token = await openapiService.getTokenInfoByContract(symbol);
    const script = await getScripts(userWalletService.getNetwork(), 'domain', 'claimFTFromInbox');

    if (!token) {
      throw new Error(`Invaild token name - ${symbol}`);
    }
    const network = await this.getNetwork();
    const address = fcl.sansPrefix(token.address[network]);
    const key = `A.${address}.${symbol}.Vault`;
    return await userWalletService.sendTransaction(
      script
        .replaceAll('<Token>', token.contract_name)
        .replaceAll('<TokenBalancePath>', token.storage_path.balance)
        .replaceAll('<TokenReceiverPath>', token.storage_path.receiver)
        .replaceAll('<TokenStoragePath>', token.storage_path.vault)
        .replaceAll('<TokenAddress>', token.address[network]),
      [
        fcl.arg(domainName, t.String),
        fcl.arg(root, t.String),
        fcl.arg(key, t.String),
        fcl.arg(amount, t.UFix64),
      ]
    );
  };

  enableTokenStorage = async (symbol: string) => {
    const token = await openapiService.getTokenInfo(symbol);
    if (!token) {
      return;
    }
    await this.getNetwork();
    const script = await getScripts(
      userWalletService.getNetwork(),
      'storage',
      'enableTokenStorage'
    );

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<Token>', token.contractName)
        .replaceAll('<TokenBalancePath>', token.path.balance)
        .replaceAll('<TokenReceiverPath>', token.path.receiver)
        .replaceAll('<TokenStoragePath>', token.path.vault)
        .replaceAll('<TokenAddress>', token.address),
      []
    );
  };

  enableNFTStorageLocal = async (token: NFTModelV2) => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'collection',
      'enableNFTStorage'
    );

    return await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contractName)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage)
        .replaceAll('<CollectionPublicType>', token.path.public)
        .replaceAll('<CollectionPublicPath>', token.path.public),
      []
    );
  };

  moveFTfromChild = async (
    childAddress: string,
    path: string,
    amount: string,
    symbol: string
  ): Promise<string> => {
    const token = await openapiService.getTokenInfo(symbol);
    if (!token) {
      throw new Error(`Invaild token name - ${symbol}`);
    }
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'transferChildFT'
    );
    const replacedScript = replaceNftKeywords(script, token);

    const result = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(childAddress, t.Address),
      fcl.arg(path, t.String),
      fcl.arg(amount, t.UFix64),
    ]);
    mixpanelTrack.track('ft_transfer', {
      from_address: (await this.getCurrentAddress()) || '',
      to_address: childAddress,
      amount: amount,
      ft_identifier: token.contractName,
      type: 'flow',
    });
    return result;
  };

  sendFTfromChild = async (
    childAddress: string,
    receiver: string,
    path: string,
    amount: string,
    symbol: string
  ): Promise<string> => {
    const token = await openapiService.getTokenInfo(symbol);
    if (!token) {
      throw new Error(`Invaild token name - ${symbol}`);
    }
    // Validate the amount just to be safe
    if (!validateAmount(amount, token.decimals)) {
      throw new Error(`Invalid amount - ${amount}`);
    }

    const script = await getScripts(userWalletService.getNetwork(), 'hybridCustody', 'sendChildFT');
    const replacedScript = replaceNftKeywords(script, token);

    const result = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(childAddress, t.Address),
      fcl.arg(receiver, t.Address),
      fcl.arg(path, t.String),
      fcl.arg(amount, t.UFix64),
    ]);
    mixpanelTrack.track('ft_transfer', {
      from_address: childAddress,
      to_address: receiver,
      amount: amount,
      ft_identifier: token.contractName,
      type: 'flow',
    });
    return result;
  };

  moveNFTfromChild = async (
    nftContractAddress: string,
    nftContractName: string,
    ids: number,
    token
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'transferChildNFT'
    );
    const replacedScript = replaceNftKeywords(script, token);
    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(nftContractAddress, t.Address),
      fcl.arg(nftContractName, t.String),
      fcl.arg(ids, t.UInt64),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: nftContractAddress,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: true,
    });
    return txID;
  };

  sendNFTfromChild = async (
    linkedAddress: string,
    receiverAddress: string,
    nftContractName: string,
    ids: number,
    token
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'sendChildNFT'
    );
    const replacedScript = replaceNftKeywords(script, token);
    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(linkedAddress, t.Address),
      fcl.arg(receiverAddress, t.Address),
      fcl.arg(nftContractName, t.String),
      fcl.arg(ids, t.UInt64),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: linkedAddress,
      to_address: receiverAddress,
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  bridgeChildNFTToEvmAddress = async (
    linkedAddress: string,
    receiverAddress: string,
    nftContractName: string,
    id: number,
    token
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'bridgeChildNFTToEvmAddress'
    );
    const replacedScript = replaceNftKeywords(script, token);
    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(nftContractName, t.String),
      fcl.arg(linkedAddress, t.Address),
      fcl.arg(id, t.UInt64),
      fcl.arg(receiverAddress, t.String),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: linkedAddress,
      to_address: receiverAddress,
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  sendNFTtoChild = async (
    linkedAddress: string,
    path: string,
    ids: number,
    token
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'transferNFTToChild'
    );
    const walletAddress = withPrefix(linkedAddress);
    if (!walletAddress) {
      throw new Error(`Invalid linked address - ${linkedAddress}`);
    }
    const replacedScript = replaceNftKeywords(script, token);
    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(walletAddress, t.Address),
      fcl.arg(path, t.String),
      fcl.arg(ids, t.UInt64),
    ]);

    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: linkedAddress,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  getChildAccountAllowTypes = async (parent: string, child: string): Promise<string[]> => {
    const network = userWalletService.getNetwork();

    const cachedData = await getValidData<string[]>(
      childAccountAllowTypesKey(network, parent, child)
    );
    if (cachedData) {
      return cachedData;
    }
    return nftService.loadChildAccountAllowTypes(network, parent, child);
  };

  checkChildLinkedVault = async (parent: string, child: string, path: string): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'checkChildLinkedVaults'
    );

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(parent, t.Address), arg(child, t.Address), fcl.arg(path, t.String)],
    });
    return result;
  };

  batchBridgeNftToEvm = async (flowIdentifier: string, ids: Array<number>): Promise<string> => {
    const shouldCoverBridgeFee = await openapiService.getFeatureFlag('cover_bridge_fee');
    const scriptName = shouldCoverBridgeFee
      ? 'batchBridgeNFTToEvmWithPayer'
      : 'batchBridgeNFTToEvmV2';
    const script = await getScripts(userWalletService.getNetwork(), 'bridge', scriptName);

    const txID = await userWalletService.sendTransaction(
      script,
      [fcl.arg(flowIdentifier, t.String), fcl.arg(ids, t.Array(t.UInt64))],
      shouldCoverBridgeFee
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: flowIdentifier,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: flowIdentifier,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  batchBridgeNftFromEvm = async (flowIdentifier: string, ids: Array<number>): Promise<string> => {
    console.log('batchBridgeNftFromEvm', flowIdentifier, ids);
    const shouldCoverBridgeFee = await openapiService.getFeatureFlag('cover_bridge_fee');
    const scriptName = shouldCoverBridgeFee
      ? 'batchBridgeNFTFromEvmWithPayer'
      : 'batchBridgeNFTFromEvmV2';
    const script = await getScripts(userWalletService.getNetwork(), 'bridge', scriptName);

    const txID = await userWalletService.sendTransaction(
      script,
      [fcl.arg(flowIdentifier, t.String), fcl.arg(ids, t.Array(t.UInt256))],
      shouldCoverBridgeFee
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: flowIdentifier,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: flowIdentifier,
      from_type: 'flow',
      to_type: 'evm',
      isMove: false,
    });
    return txID;
  };

  batchTransferNFTToChild = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'batchTransferNFTToChild'
    );
    const replacedScript = replaceNftKeywords(script, token);

    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(childAddr, t.Address),
      fcl.arg(identifier, t.String),
      fcl.arg(ids, t.Array(t.UInt64)),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: childAddr,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: identifier,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  batchTransferChildNft = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'batchTransferChildNFT'
    );
    const replacedScript = replaceNftKeywords(script, token);

    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(childAddr, t.Address),
      fcl.arg(identifier, t.String),
      fcl.arg(ids, t.Array(t.UInt64)),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: childAddr,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: identifier,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  sendChildNFTToChild = async (
    childAddr: string,
    receiver: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'batchSendChildNFTToChild'
    );
    const replacedScript = replaceNftKeywords(script, token);

    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(childAddr, t.Address),
      fcl.arg(receiver, t.Address),
      fcl.arg(identifier, t.String),
      fcl.arg(ids, t.Array(t.UInt64)),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: childAddr,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: identifier,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  batchBridgeChildNFTToEvm = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'batchBridgeChildNFTToEvm'
    );
    const replacedScript = replaceNftKeywords(script, token);
    const txID = await userWalletService.sendTransaction(replacedScript, [
      fcl.arg(identifier, t.String),
      fcl.arg(childAddr, t.Address),
      fcl.arg(ids, t.Array(t.UInt64)),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: childAddr,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: identifier,
      from_type: 'flow',
      to_type: 'evm',
      isMove: false,
    });
    return txID;
  };

  batchBridgeChildNFTFromEvm = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>
  ): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'hybridCustody',
      'batchBridgeChildNFTFromEvm'
    );

    const txID = await userWalletService.sendTransaction(script, [
      fcl.arg(identifier, t.String),
      fcl.arg(childAddr, t.Address),
      fcl.arg(ids, t.Array(t.UInt256)),
    ]);
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: childAddr,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: identifier,
      from_type: 'flow',
      to_type: 'evm',
      isMove: false,
    });
    return txID;
  };

  bridgeNftToEvmAddress = async (
    flowIdentifier: string,
    ids: number,
    contractEVMAddress: string
  ): Promise<string> => {
    const shouldCoverBridgeFee = await openapiService.getFeatureFlag('cover_bridge_fee');
    const scriptName = shouldCoverBridgeFee
      ? 'bridgeNFTToEvmAddressWithPayer'
      : 'bridgeNFTToEvmAddressV2';
    const script = await getScripts(userWalletService.getNetwork(), 'bridge', scriptName);

    const gasLimit = 30000000;

    if (contractEVMAddress.startsWith('0x')) {
      contractEVMAddress = contractEVMAddress.substring(2);
    }

    const txID = await userWalletService.sendTransaction(
      script,
      [
        fcl.arg(flowIdentifier, t.String),
        fcl.arg(ids, t.UInt64),
        fcl.arg(contractEVMAddress, t.String),
      ],
      shouldCoverBridgeFee
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: flowIdentifier,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: flowIdentifier,
      from_type: 'evm',
      to_type: 'evm',
      isMove: false,
    });
    return txID;
  };

  bridgeNftFromEvmToFlow = async (
    flowIdentifier: string,
    ids: number,
    receiver: string
  ): Promise<string> => {
    const shouldCoverBridgeFee = await openapiService.getFeatureFlag('cover_bridge_fee');
    const scriptName = shouldCoverBridgeFee
      ? 'bridgeNFTFromEvmToFlowWithPayer'
      : 'bridgeNFTFromEvmToFlowV3';
    const script = await getScripts(userWalletService.getNetwork(), 'bridge', scriptName);

    const txID = await userWalletService.sendTransaction(
      script,
      [fcl.arg(flowIdentifier, t.String), fcl.arg(ids, t.UInt256), fcl.arg(receiver, t.Address)],
      shouldCoverBridgeFee
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: flowIdentifier,
      to_address: (await this.getCurrentAddress()) || '',
      nft_identifier: flowIdentifier,
      from_type: 'flow',
      to_type: 'evm',
      isMove: false,
    });
    return txID;
  };

  getAssociatedFlowIdentifier = async (address: string): Promise<string> => {
    const script = await getScripts(
      userWalletService.getNetwork(),
      'bridge',
      'getAssociatedFlowIdentifier'
    );
    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.String)],
    });
    return result;
  };

  sendNFT = async (recipient: string, id: any, token: any): Promise<string> => {
    await this.getNetwork();
    const script = await getScripts(userWalletService.getNetwork(), 'collection', 'sendNFTV3');

    const txID = await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contractName)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage)
        .replaceAll('<CollectionPublicPath>', token.path.public),
      [fcl.arg(recipient, t.Address), fcl.arg(parseInt(id), t.UInt64)]
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: (await this.getCurrentAddress()) || '',
      to_address: recipient,
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  sendNBANFT = async (recipient: string, id: any, token: NFTModelV2): Promise<string> => {
    await this.getNetwork();
    const script = await getScripts(userWalletService.getNetwork(), 'collection', 'sendNbaNFTV3');

    const txID = await userWalletService.sendTransaction(
      script
        .replaceAll('<NFT>', token.contractName)
        .replaceAll('<NFTAddress>', token.address)
        .replaceAll('<CollectionStoragePath>', token.path.storage)
        .replaceAll('<CollectionPublicPath>', token.path.public),
      [fcl.arg(recipient, t.Address), fcl.arg(parseInt(id), t.UInt64)]
    );
    mixpanelTrack.track('nft_transfer', {
      tx_id: txID,
      from_address: (await this.getCurrentAddress()) || '',
      to_address: recipient,
      nft_identifier: token.contractName,
      from_type: 'flow',
      to_type: 'flow',
      isMove: false,
    });
    return txID;
  };

  //transaction

  getTransactions = async (
    address: string,
    limit: number,
    offset: number,
    _expiry = 60000,
    forceRefresh = false
  ): Promise<{
    count: number;
    list: TransferItem[];
  }> => {
    return address
      ? transactionService.listAllTransactions(
          userWalletService.getNetwork(),
          address,
          `${offset}`,
          `${limit}`
        )
      : {
          count: 0,
          list: [],
        };
  };

  getPendingTx = async () => {
    const network = await this.getNetwork();
    const address = await this.getCurrentAddress();
    if (!address) {
      return [];
    }
    const pending = await transactionService.listPending(network, address);
    return pending;
  };

  loginWithMnemonic = async (
    mnemonic: string,
    replaceUser = true,
    derivationPath: string = FLOW_BIP44_PATH,
    passphrase: string = ''
  ) => {
    return userWalletService.loginWithMnemonic(mnemonic, replaceUser, derivationPath, passphrase);
  };

  loginWithPrivatekey = async (pk: string, replaceUser = true) => {
    return userWalletService.loginWithPk(pk, replaceUser);
  };

  // @deprecated
  loginV3_depreciated = async (
    mnemonic: string,
    accountKey: any,
    deviceInfo: any,
    replaceUser = true
  ) => {
    return userWalletService.loginV3_depreciated(mnemonic, accountKey, deviceInfo, replaceUser);
  };

  signMessage = async (message: string): Promise<string> => {
    return userWalletService.sign(message);
  };
  abortController = new AbortController();
  abort() {
    this.abortController.abort(); // Abort ongoing operations
    this.abortController = new AbortController(); // Create a new controller for subsequent operations
  }

  switchNetwork = async (network: string) => {
    // setup fcl for the new network
    await userWalletService.switchFclNetwork(network as FlowNetwork);
    await userWalletService.setNetwork(network);
    eventBus.emit('switchNetwork', network);

    // Reload everything
    await this.refreshWallets();
    await this.refreshAll();

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        console.log('No active tab found');
        return;
      }
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'FCW:NETWORK',
          network: network,
        });
      }
    });
  };

  checkNetwork = async () => {
    if (!this.isUnlocked()) {
      return;
    }
  };

  switchMonitor = async (monitor: string) => {
    await userWalletService.setMonitor(monitor);
  };

  getMonitor = (): string => {
    return userWalletService.getMonitor();
  };

  refreshAll = async () => {
    console.log('refreshAll');
    // Clear the active wallet if any
    // If we don't do this, the user wallets will not be refreshed
    this.clearNFT();
    this.refreshAddressBook();
    await this.getCadenceScripts();

    this.abort();
  };

  getNetwork = async (): Promise<string> => {
    return await userWalletService.getNetwork();
  };
  getEmulatorMode = async (): Promise<boolean> => {
    // Check feature flag first
    const enableEmulatorMode = await this.getFeatureFlag('emulator_mode');
    if (!enableEmulatorMode) {
      return false;
    }
    return await userWalletService.getEmulatorMode();
  };

  setEmulatorMode = async (mode: boolean) => {
    return await userWalletService.setEmulatorMode(mode);
  };

  clearChildAccount = () => {
    storage.remove('checkUserChildAccount');
  };

  getEvmEnabled = async (): Promise<boolean> => {
    // Get straight from the userWalletService as getEvmAddress() throws an error if the address is not valid
    const address = userWalletService.getEvmAccount();
    return !!address && isValidEthereumAddress(address);
  };

  clearWallet = () => {
    userWalletService.clear();
  };

  getFlowscanUrl = async (): Promise<string> => {
    const network = await this.getNetwork();
    const isEvm = await this.getActiveAccountType();
    let baseURL = 'https://www.flowscan.io';

    // Check if it's an EVM wallet and update the base URL
    if (isEvm === 'evm') {
      switch (network) {
        case 'testnet':
          baseURL = 'https://evm-testnet.flowscan.io';
          break;
        case 'mainnet':
          baseURL = 'https://evm.flowscan.io';
          break;
      }
    } else {
      // Set baseURL based on the network
      switch (network) {
        case 'testnet':
          baseURL = 'https://testnet.flowscan.io';
          break;
        case 'mainnet':
          baseURL = 'https://www.flowscan.io';
          break;
        case 'crescendo':
          baseURL = 'https://flow-view-source.vercel.app/crescendo';
          break;
      }
    }

    return baseURL;
  };

  getViewSourceUrl = async (): Promise<string> => {
    const network = await this.getNetwork();
    let baseURL = 'https://f.dnz.dev';
    switch (network) {
      case 'mainnet':
        baseURL = 'https://f.dnz.dev';
        break;
      case 'testnet':
        baseURL = 'https://f.dnz.dev';
        break;
      case 'crescendo':
        baseURL = 'https://f.dnz.dev';
        break;
    }
    return baseURL;
  };

  poll = async (fn, fnCondition, ms) => {
    let result = await fn();
    while (fnCondition(result)) {
      await this.wait(ms);
      result = await fn();
    }
    return result;
  };

  wait = (ms = 1000) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  pollingTrnasaction = async (txId: string, network: string) => {
    if (!txId || !txId.match(/^0?x?[0-9a-fA-F]{64}/)) {
      return;
    }

    const fetchReport = async () =>
      (await fetch(`https://rest-${network}.onflow.org/v1/transaction_results/${txId}`)).json();
    const validate = (result) => result.status !== 'Sealed';
    return await this.poll(fetchReport, validate, 3000);
  };

  pollTransferList = async (address: string, txHash: string, maxAttempts = 5) => {
    const network = await this.getNetwork();
    let attempts = 0;
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.log('Max polling attempts reached');
        return;
      }

      const { list: newTransactions } = await transactionService.loadTransactions(
        network,
        address,
        '0',
        '15'
      );
      // Copy the list as we're going to modify the original list

      const foundTx = newTransactions?.find((tx) => txHash.includes(tx.hash));
      if (foundTx && foundTx.indexed) {
        // Send a message to the UI to update the transfer list
        chrome.runtime.sendMessage({ msg: 'transferListUpdated' });
      } else {
        // All of the transactions have not been picked up by the indexer yet
        attempts++;
        setTimeout(poll, 5000); // Poll every 5 seconds
      }
    };

    await poll();
  };

  listenTransaction = async (
    txId: string,
    sendNotification = true,
    title = chrome.i18n.getMessage('Transaction__Sealed'),
    body = '',
    icon = chrome.runtime.getURL('./images/icon-64.png')
  ) => {
    if (!txId || !txId.match(/^0?x?[0-9a-fA-F]{64}/)) {
      return;
    }
    const address = (await this.getCurrentAddress()) || '0x';
    const network = await this.getNetwork();
    let txHash = txId;
    try {
      chrome.storage.session.set({
        transactionPending: { txId, network, date: new Date() },
      });
      eventBus.emit('transactionPending');
      chrome.runtime.sendMessage({
        msg: 'transactionPending',
        network: network,
      });
      transactionService.setPending(network, address, txId, icon, title);

      // Listen to the transaction until it's sealed.
      // This will throw an error if there is an error with the transaction
      const txStatus = await fcl.tx(txId).onceExecuted();
      // Update the pending transaction with the transaction status
      txHash = await transactionService.updatePending(network, address, txId, txStatus);

      // Track the transaction result
      mixpanelTrack.track('transaction_result', {
        tx_id: txId,
        is_successful: true,
      });

      try {
        // Send a notification to the user only on success
        if (sendNotification) {
          const baseURL = await this.getFlowscanUrl();
          if (baseURL.includes('evm')) {
            // It's an EVM transaction
            // Look through the events in txStatus
            const evmEvent = txStatus.events.find(
              (event) => event.type.includes('EVM') && !!event.data?.hash
            );
            if (evmEvent) {
              const hashBytes = evmEvent.data.hash.map((byte) => parseInt(byte));
              const hash = '0x' + Buffer.from(hashBytes).toString('hex');
              // Link to the account page on EVM otherwise we'll have to look up the EVM tx
              notification.create(`${baseURL}/tx/${hash}`, title, body, icon);
            } else {
              const evmAddress = await this.getEvmAddress();

              // Link to the account page on EVM as we don't have a tx hash
              notification.create(`${baseURL}/address/${evmAddress}`, title, body, icon);
            }
          } else {
            // It's a Flow transaction
            notification.create(`${baseURL}/tx/${txId}`, title, body, icon);
          }
        }
      } catch (err: unknown) {
        // We don't want to throw an error if the notification fails
        console.error('listenTransaction notification error ', err);
      }
    } catch (err: unknown) {
      // An error has occurred while listening to the transaction
      let errorMessage = 'unknown error';
      let errorCode: number | undefined = undefined;

      if (err instanceof TransactionError) {
        errorCode = err.code;
        errorMessage = err.message;
      } else {
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        // From fcl-core transaction-error.ts
        const ERROR_CODE_REGEX = /\[Error Code: (\d+)\]/;
        const match = errorMessage.match(ERROR_CODE_REGEX);
        errorCode = match ? parseInt(match[1], 10) : undefined;
      }

      console.warn({
        msg: 'transactionError',
        errorMessage,
        errorCode,
      });

      // Track the transaction error
      mixpanelTrack.track('transaction_result', {
        tx_id: txId,
        is_successful: false,
        error_message: errorMessage,
      });

      // Tell the UI that there was an error
      chrome.runtime.sendMessage({
        msg: 'transactionError',
        errorMessage,
        errorCode,
      });
    } finally {
      // Remove the pending transaction from the UI
      await chrome.storage.session.remove('transactionPending');

      // Message the UI that the transaction is done
      eventBus.emit('transactionDone');
      chrome.runtime.sendMessage({
        msg: 'transactionDone',
      });

      if (txHash) {
        // Start polling for transfer list updates
        await this.pollTransferList(address, txHash);
      }
    }
  };

  clearPending = async () => {
    const network = await this.getNetwork();
    const address = await this.getCurrentAddress();
    if (address) {
      transactionService.clearPending(network, address);
    }
  };

  clearNFT = () => {
    nftService.clear();
  };

  clearNFTCollection = async () => {
    await nftService.clearNFTCollection();
  };

  clearCoinList = async () => {
    await coinListService.clear();
  };

  clearAllStorage = () => {
    nftService.clear();
    userInfoService.removeUserInfo();
    coinListService.clear();
    addressBookService.clear();
    userWalletService.clear();
    transactionService.clear();
  };

  clearLocalStorage = async () => {
    await storage.clear();
  };

  getSingleCollection = async (
    address: string,
    collectionId: string,
    offset = 0
  ): Promise<NFTCollectionData | undefined> => {
    const network = await this.getNetwork();
    const list = await getCachedNftCollection(network, address, collectionId, offset);
    if (!list) {
      return this.refreshSingleCollection(address, collectionId, offset);
    }
    return list;
  };

  refreshSingleCollection = async (
    address: string,
    collectionId: string,
    offset: number
  ): Promise<NFTCollectionData | undefined> => {
    const network = await this.getNetwork();

    return nftService.loadSingleNftCollection(network, address, collectionId, `${offset || 0}`);
  };

  getCollectionCache = async (address: string) => {
    const network = await this.getNetwork();
    const list = await getValidData<NFTCollections[]>(nftCatalogCollectionsKey(network, address));
    if (!list || list.length === 0) {
      return await this.refreshCollection(address);
    }
    // Sort by count, maintaining the new collection structure
    const sortedList = [...list].sort((a, b) => b.count - a.count);
    return sortedList;
  };

  refreshCollection = async (address: string) => {
    const network = await this.getNetwork();

    return nftService.loadNftCatalogCollections(network, address);
  };

  getNftCatalog = async () => {
    const data = (await openapiService.nftCatalog()) ?? [];

    return data;
  };

  getCadenceScripts = async (): Promise<CategoryScripts | undefined> => {
    try {
      const cadenceScripts = await getCachedScripts();

      const network = userWalletService.getNetwork();
      return network === 'mainnet'
        ? cadenceScripts?.scripts.mainnet
        : cadenceScripts?.scripts.testnet;
    } catch (error) {
      console.log(error, '=== get scripts error ===');
    }
  };

  // Google Drive - Backup
  getBackupFiles = async () => {
    return googleDriveService.listFiles();
  };

  hasGooglePremission = async () => {
    return googleDriveService.hasGooglePremission();
  };

  deleteAllBackups = async () => {
    return googleDriveService.deleteAllFile();
  };

  deleteCurrentUserBackup = async () => {
    const data = await userInfoService.getCurrentUserInfo();
    const username = data.username;
    return googleDriveService.deleteUserBackup(username);
  };

  deleteUserBackup = async (username: string) => {
    return googleDriveService.deleteUserBackup(username);
  };

  hasCurrentUserBackup = async () => {
    const data = await userInfoService.getCurrentUserInfo();
    const username = data.username;
    return googleDriveService.hasUserBackup(username);
  };

  hasUserBackup = async (username: string) => {
    return googleDriveService.hasUserBackup(username);
  };

  syncBackup = async (password: string) => {
    const data = await userInfoService.getCurrentUserInfo();
    const username = data.username;
    const mnemonic = await this.getMnemonics(password);
    return this.uploadMnemonicToGoogleDrive(mnemonic, username, password);
  };

  uploadMnemonicToGoogleDrive = async (mnemonic: string, username: string, password: string) => {
    const isValidMnemonic = bip39.validateMnemonic(mnemonic);
    if (!isValidMnemonic) {
      throw new Error('Invalid mnemonic');
    }
    const app = getApp(process.env.NODE_ENV!);
    const user = await getAuth(app).currentUser;
    try {
      await googleDriveService.uploadMnemonicToGoogleDrive(mnemonic, username, user!.uid, password);
      mixpanelTrack.track('multi_backup_created', {
        address: (await this.getCurrentAddress()) || '',
        providers: ['GoogleDrive'],
      });
    } catch {
      mixpanelTrack.track('multi_backup_creation_failed', {
        address: (await this.getCurrentAddress()) || '',
        providers: ['GoogleDrive'],
      });
    }
  };

  loadBackupAccounts = async (): Promise<string[]> => {
    return googleDriveService.loadBackupAccounts();
  };

  loadBackupAccountLists = async (): Promise<any[]> => {
    return googleDriveService.loadBackupAccountLists();
  };

  restoreAccount = async (username, password): Promise<string | null> => {
    return googleDriveService.restoreAccount(username, password);
  };

  getPayerAddressAndKeyId = async () => {
    try {
      const config = await fetchConfig.remoteConfig();
      const network = await this.getNetwork();
      return config.payer[network];
    } catch {
      const network = await this.getNetwork();
      return defaultConfig.payer[network];
    }
  };

  getBridgeFeePayerAddressAndKeyId = async () => {
    try {
      const config = await fetchConfig.remoteConfig();
      const network = await this.getNetwork();
      return config.bridgeFeePayer[network];
    } catch {
      const network = await this.getNetwork();
      return defaultConfig.bridgeFeePayer[network];
    }
  };

  getFeatureFlags = async (): Promise<FeatureFlags> => {
    return openapiService.getFeatureFlags();
  };

  getFeatureFlag = async (featureFlag: FeatureFlagKey): Promise<boolean> => {
    return openapiService.getFeatureFlag(featureFlag);
  };

  allowLilicoPay = async (): Promise<boolean> => {
    const isFreeGasFeeKillSwitch = await storage.get('freeGas');
    const isFreeGasFeeEnabled = await storage.get('lilicoPayer');
    return isFreeGasFeeKillSwitch && isFreeGasFeeEnabled;
  };

  signPayer = async (signable): Promise<string> => {
    return await userWalletService.signPayer(signable);
  };

  signProposer = async (signable): Promise<string> => {
    return await userWalletService.signProposer(signable);
  };

  updateProfilePreference = async (privacy: number) => {
    await openapiService.updateProfilePreference(privacy);
  };

  getAccount = async (): Promise<FclAccount> => {
    const address = await this.getMainAddress();
    if (!address) {
      throw new Error('No address found');
    }
    const account = await fcl.account(address);
    return account;
  };

  getEmoji = async () => {
    return getEmojiList();
  };

  // @deprecated - this doesn't do anything
  setEmoji_depreciated = async (emoji, type, index) => {
    return emoji;
  };

  // Get the news from the server
  getNews = async () => {
    if (!this.isUnlocked()) {
      return [];
    }
    return await newsService.getNews();
  };
  markNewsAsDismissed = async (id: string) => {
    return await newsService.markAsDismissed(id);
  };

  markNewsAsRead = async (id: string): Promise<boolean> => {
    return await newsService.markAsRead(id);
  };

  markAllNewsAsRead = async () => {
    return await newsService.markAllAsRead();
  };

  getUnreadNewsCount = async () => {
    if (!this.isUnlocked()) {
      return 0;
    }
    return newsService.getUnreadCount();
  };

  isNewsRead = (id: string) => {
    return newsService.isRead(id);
  };

  resetNews = async () => {
    return await newsService.clear();
  };

  // Check the storage status
  checkStorageStatus = async ({
    transferAmount,
    coin,
    movingBetweenEVMAndFlow,
  }: {
    transferAmount?: number; // amount in coins
    coin?: string; // coin name
    movingBetweenEVMAndFlow?: boolean; // are we moving between EVM and Flow?
  } = {}): Promise<EvaluateStorageResult> => {
    const address = await this.getParentAddress();
    const isFreeGasFeeEnabled = await this.allowLilicoPay();
    const result = await this.storageEvaluator.evaluateStorage(
      address!,
      transferAmount,
      coin,
      movingBetweenEVMAndFlow,
      isFreeGasFeeEnabled
    );
    return result;
  };

  // Tracking stuff

  trackOnRampClicked = async (source: 'moonpay' | 'coinbase') => {
    mixpanelTrack.track('on_ramp_clicked', {
      source: source,
    });
  };

  // This is called from the front end, we should find a better way to track this event
  trackAccountRecovered = async () => {
    mixpanelTrack.track('account_recovered', {
      address: (await this.getCurrentAddress()) || '',
      mechanism: 'Multi-Backup',
      methods: [],
    });
  };

  trackPageView = async (pathname: string) => {
    mixpanelTrack.trackPageView(pathname);
  };

  trackTime = async (eventName: keyof TrackingEvents) => {
    mixpanelTrack.time(eventName);
  };

  decodeEvmCall = async (callData: string, address = '') => {
    return await openapiService.decodeEvmCall(callData, address);
  };

  // Todo - I don't think this works as expected in any case
  saveIndex = async (username = '', userId = null) => {
    const loggedInAccounts: LoggedInAccount[] = (await storage.get('loggedInAccounts')) || [];
    let currentindex = 0;

    if (!loggedInAccounts || loggedInAccounts.length === 0) {
      currentindex = 0;
    } else {
      const index = loggedInAccounts.findIndex((account) => account.username === username);
      currentindex = index !== -1 ? index : loggedInAccounts.length;
    }

    const path = (await storage.get('temp_path')) || "m/44'/539'/0'/0/0";
    const passphrase = (await storage.get('temp_phrase')) || '';
    await storage.set(`user${currentindex}_path`, path);
    await storage.set(`user${currentindex}_phrase`, passphrase);
    await storage.set(`user${userId}_path`, path);
    await storage.set(`user${userId}_phrase`, passphrase);
    await storage.remove(`temp_path`);
    await storage.remove(`temp_phrase`);
    // Note that currentAccountIndex is only used in keyring for old accounts that don't have an id stored in the keyring
    // currentId always takes precedence
    await storage.set('currentAccountIndex', currentindex);
    if (userId) {
      await storage.set(CURRENT_ID_KEY, userId);
    }
  };

  getEvmNftId = async (address: string) => {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }
    const network = await this.getNetwork();
    const cacheData = await getValidData<EvmNftIdsStore>(evmNftIdsKey(network, address));
    if (cacheData) {
      return cacheData;
    }
    return evmNftService.loadEvmNftIds(network, address);
  };

  getEvmNftCollectionList = async (
    address: string,
    collectionIdentifier: string,
    limit = 50,
    offset = 0
  ) => {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }
    const network = await this.getNetwork();
    const cacheData = await getValidData<EvmNftCollectionListStore>(
      evmNftCollectionListKey(network, address, collectionIdentifier, `${offset}`)
    );
    if (cacheData) {
      return cacheData;
    }
    return evmNftService.loadEvmCollectionList(network, address, collectionIdentifier, `${offset}`);
  };

  clearEvmNFTList = async () => {
    await evmNftService.clearEvmNfts();
  };
}

export default new WalletController();
