import * as fcl from '@onflow/fcl';
import {
  addressBookService,
  transactionService,
  coinListService,
  googleDriveService,
  keyringService,
  analyticsService,
  newsService,
  nftService,
  openapiService,
  permissionService,
  preferenceService,
  remoteConfigService,
  sessionService,
  storageManagementService,
  tokenListService,
  transactionActivityService,
  userInfoService,
  userWalletService,
  accountManagementService,
} from '@onflow/frw-core';
import {
  getValidData,
  setCachedData,
  childAccountDescKey,
  type ChildAccountFtStore,
  cadenceNftCollectionsAndIdsKey,
  walletLoadedKey,
  CURRENT_ID_KEY,
  setLocalData,
  removeLocalData,
  clearLocalData,
  getLocalData,
  triggerRefresh,
  cadenceCollectionNftsKey,
  registerRefreshListener,
  walletLoadedRefreshRegex,
} from '@onflow/frw-data-model';
import type { AccountKey, Account as FclAccount } from '@onflow/typedefs';

import { retryOperation } from '@onflow/frw-core/utils';
import { eventBus } from '@onflow/frw-extension-shared/messaging';
import {
  FLOW_BIP44_PATH,
  INTERNAL_REQUEST_ORIGIN,
  MAINNET_CHAIN_ID,
  PriceProvider,
  Period,
} from '@onflow/frw-shared/constant';
import {
  type CustomFungibleTokenInfo,
  type FeatureFlagKey,
  type FeatureFlags,
  type PublicKeyTuple,
  type PublicPrivateKeyTuple,
  type Contact,
  ContactType,
  type FlowNetwork,
  type NFTModelV2,
  type UserInfoResponse,
  type NetworkScripts,
  type TokenInfo,
  type TrackingEvents,
  type TransactionState,
  type TransferItem,
  type ActiveAccountType,
  type ActiveChildType_depreciated,
  type Currency,
  type EvmAddress,
  type FlowAddress,
  type LoggedInAccount,
  type MainAccount,
  type ProfileBackupStatus,
  type PublicKeyAccount,
  type WalletAccount,
  type WalletAddress,
  type CollectionNfts,
  type NftCollectionAndIds,
} from '@onflow/frw-shared/types';
import {
  isValidAddress,
  isValidEthereumAddress,
  isValidFlowAddress,
  withPrefix,
  consoleError,
  consoleWarn,
  getEmojiList,
} from '@onflow/frw-shared/utils';

import notification from '@/background/webapi/notification';
import { openIndexPage } from '@/background/webapi/tab';

import BaseController from './base';
import notificationService from './notification';
import provider from './provider';

interface TokenTransaction {
  symbol: string;
  contractName: string;
  address: string;
  timestamp: number;
}

export class WalletController extends BaseController {
  openapi = openapiService;
  private loaded = false;

  constructor() {
    super();
  }
  // Adding as tests load the extension really, really fast
  // It's possible to call the wallet controller before services are loaded
  // setLoaded is called in index.ts of the background
  isLoaded = async () => this.loaded;
  setLoaded = async (loaded: boolean) => {
    this.loaded = loaded;
    if (loaded) {
      registerRefreshListener(walletLoadedRefreshRegex, async () => {
        // This should never be called normally...
        setCachedData(walletLoadedKey(), true, 1_000_000_000); // Really long ttl
      });
      setCachedData(walletLoadedKey(), true, 1_000_000_000); // Really long ttl
    }
  };

  /* wallet */
  boot = async (password) => {
    // When wallet first initializes through install, it will add a encrypted password to boot state. If is boot is false, it means there's no password set.
    const isBooted = await keyringService.isBooted();
    const hasVault = await keyringService.hasVault();

    if (isBooted && hasVault) {
      await keyringService.updateUnlocked(password);
    } else {
      await keyringService.boot(password);
    }
  };
  isBooted = async () => keyringService.isBooted() && keyringService.hasVault();
  isUnlocked = async () => keyringService.isUnlocked();
  verifyPassword = async (password: string) => keyringService.verifyPassword(password);

  verifyPasswordIfBooted = async (password: string) => {
    return await accountManagementService.verifyPasswordIfBooted(password);
  };
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
    return await accountManagementService.registerNewProfile(username, password, mnemonic);
  };
  /**
   * Remove a profile and its associated keys
   * If it's the last profile, it behaves like a wallet reset
   *
   * @param {string} password - The keyring controller password
   * @param {string} profileId - The ID of the profile to remove
   * @returns {Promise<boolean>} - Returns true if successful
   */
  removeProfile = async (password: string, profileId: string): Promise<boolean> => {
    return await accountManagementService.removeProfile(password, profileId);
  };

  checkForNewAddress = async (
    network: string,
    pubKey: string,
    txid: string
  ): Promise<FclAccount | null> => {
    return await accountManagementService.checkForNewAddress(network, pubKey, txid);
  };

  importAccountFromMobile = async (address: string, password: string, mnemonic: string) => {
    return await accountManagementService.importAccountFromMobile(address, password, mnemonic);
  };
  /**
   * Create a new address
   * @returns
   */

  createNewAccount = async (network: string) => {
    return await accountManagementService.createNewAccount(network);
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
    return await accountManagementService.importProfileUsingMnemonic(
      username,
      password,
      mnemonic,
      derivationPath,
      passphrase
    );
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
    return await accountManagementService.importProfileUsingPrivateKey(
      username,
      password,
      pk,
      address
    );
  };

  /**
   * Switch the wallet profile to a different profile
   * @param id - The id of the keyring to switch to.
   */
  switchProfile = async (profileId: string) => {
    return await accountManagementService.switchProfile(profileId);
  };
  /**
   * @deprecated  Checking accounts by user id is deprecated - use the public key or addressinstead
   */
  checkAvailableAccount_depreciated = async (currentId: string) => {
    try {
      await keyringService.checkAvailableAccount_deprecated(currentId);
    } catch (error) {
      consoleError('Error finding available account:', error);
      throw new Error('Failed to find available account: ' + (error.message || 'Unknown error'));
    }
  };

  /**
   * Checks if we have one or more keys that can access an account
   * @param address of the account we want to check
   * @returns an array of keys that can access the account
   */
  checkAvailableAccountKeys = async (address: FlowAddress): Promise<AccountKey[]> => {
    let availableKeys: AccountKey[] = [];
    try {
      const account = await fcl.account(address);
      const publicKeys = await keyringService.getAllPublicKeys();
      availableKeys = account.keys.filter((key) => publicKeys.includes(key.publicKey));
    } catch (error) {
      consoleError('Error checking available account keys:', error);
      throw new Error('Failed to check available account keys');
    }
    if (availableKeys.length === 0) {
      throw new Error('No available keys found for account: ' + address);
    }
    return availableKeys;
  };

  unlock = async (password: string) => {
    // Submit the password. This will unlock the keyring or throw an error
    await keyringService.unlock(password);
    // Login with the current keyring
    await userWalletService.loginWithKeyring();
    sessionService.broadcastEvent('unlock');

    // Refresh the wallet data
    this.refreshWallets();
  };

  submitPassword = async (password: string) => {
    await keyringService.unlock(password);
  };

  refreshWallets = async () => {
    // Refresh all the wallets after unlocking or switching profiles
    // Refresh the cadence scripts first
    await openapiService.getCadenceScripts();
    // Refresh the user info
    let userInfo = {};
    try {
      userInfo = await retryOperation(async () => this.getUserInfo(true), 3, 1000);
    } catch (error) {
      consoleError('Error refreshing user info:', error);
    }
    // Try for 2 mins to get the parent address
    const parentAddress = await retryOperation(
      async () => {
        const address = await userWalletService.getParentAddress();
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
    const fclAccount = await this.getMainAccountInfo();
    // Refresh the user info
    return openapiService.freshUserInfo(parentAddress, fclAccount, pubKTuple, userInfo, 'main');
  };

  revealKeyring = async (password: string) => {
    const keyring = await keyringService.revealKeyring(password);
    return keyring;
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
    await keyringService.lock();
    await userWalletService.logoutCurrentUser();
    await userWalletService.clear();
  };

  signOutWallet = async () => {
    await keyringService.clearCurrentKeyring();
    await userWalletService.logoutCurrentUser();
    await userWalletService.clear();
    sessionService.broadcastEvent('accountsChanged', []);
  };

  // lockadd here
  lockAdd = async () => {
    openIndexPage('welcome/importprofile?add=true');
  };

  // create profile here
  createProfile = async () => {
    openIndexPage('welcome/register?add=true');
  };

  resetPwd = async () => {
    // WARNING: This resets absolutely everything
    // This is used when the user forgets their password
    // It should only be called from the landing page when the user is logged out
    // And the user should be redirected to the landing page
    // After calling this function

    // TODO: I believe the user should be logged out here
    // e.g. call signOutCurrentUser

    // This clears local storage but a lot is still kept in memory
    await clearLocalData();

    // Note that this does not clear the 'booted' state
    // We should fix this, but it would involve making changes to keyringService
    await keyringService.resetKeyRing();
    await keyringService.lock();

    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    // Redirect to welcome so that users can import their account again
    openIndexPage('/welcome');
  };

  // lockadd here
  restoreWallet = async () => {
    const switchingTo = 'mainnet';

    await keyringService.lock();

    sessionService.broadcastEvent('accountsChanged', []);
    sessionService.broadcastEvent('lock');
    openIndexPage('restore');
    await this.switchNetwork(switchingTo);
  };

  setPopupOpen = (isOpen) => {
    preferenceService.setPopupOpen(isOpen);
  };
  openIndexPage = openIndexPage;

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

  removeConnectedSite = (origin: string) => {
    sessionService.broadcastEvent('accountsChanged', [], origin);
    permissionService.removeConnectedSite(origin);
  };
  // getSitesByDefaultChain = permissionService.getSitesByDefaultChain;
  topConnectedSite = (origin: string) => permissionService.topConnectedSite(origin);
  unpinConnectedSite = (origin: string) => permissionService.unpinConnectedSite(origin);
  /* keyrings */

  clearKeyrings = () => keyringService.clearCurrentKeyring();

  getMnemonic = async (password: string): Promise<string> => {
    return await keyringService.getMnemonic(password);
  };

  checkMnemonics = async () => {
    return await keyringService.checkMnemonics();
  };

  getPubKeyPrivateKey = async (password: string): Promise<PublicPrivateKeyTuple> => {
    await this.verifyPassword(password);
    return await keyringService.getCurrentPublicPrivateKeyTuple();
  };

  getPrivateKey = async (password: string): Promise<string> => {
    await this.verifyPassword(password);
    return await keyringService.getCurrentPrivateKey();
  };

  getPubKey = async (): Promise<PublicKeyTuple> => {
    return await keyringService.getCurrentPublicKeyTuple();
  };

  importPrivateKey = async (publicKey: string, signAlgo: number, password: string, pk: string) => {
    return await accountManagementService.importPrivateKey(publicKey, signAlgo, password, pk);
  };

  jsonToPrivateKeyHex = async (json: string, password: string): Promise<string | null> => {
    return await accountManagementService.jsonToPrivateKeyHex(json, password);
  };
  findAddressWithPrivateKey = async (pk: string, address: string) => {
    return await accountManagementService.findAddressWithPrivateKey(pk, address);
  };
  findAddressWithSeedPhrase = async (
    seed: string,
    address: string | null = null,
    derivationPath: string = FLOW_BIP44_PATH,
    passphrase: string = ''
  ): Promise<PublicKeyAccount[]> => {
    return await accountManagementService.findAddressWithSeedPhrase(
      seed,
      address,
      derivationPath,
      passphrase
    );
  };

  /**
   * @deprecated not used anymore
   */
  getHiddenAddresses = () => preferenceService.getHiddenAddresses();
  /**
   * @deprecated not used anymore
   */
  showAddress = (type: string, address: string) => preferenceService.showAddress(type, address);
  /**
   * @deprecated not used anymore
   */
  hideAddress = (type: string, address: string, brandName: string) => {
    preferenceService.hideAddress(type, address, brandName);
    const current = preferenceService.getCurrentAccount();
    if (current?.address === address && current.type === type) {
      this.resetCurrentAccount();
    }
  };
  /**
   * @deprecated not used anymore
   */
  removeAddress = async (password: string, address: string, type: string, brand?: string) => {
    await keyringService.removeAccount(password, address, type, brand);
    preferenceService.removeAddressBalance(address);
    const current = preferenceService.getCurrentAccount();
    if (current?.address === address && current.type === type && current.brandName === brand) {
      this.resetCurrentAccount();
    }
  };

  /**
   * @deprecated not used anymore
   */
  resetCurrentAccount = async () => {
    const [account] = await this.getAccounts();
    if (account) {
      preferenceService.setCurrentAccount(account);
    } else {
      preferenceService.setCurrentAccount(null);
    }
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

  isUseLedgerLive = () => preferenceService.isUseLedgerLive();

  setIsDefaultWallet = (val: boolean) => preferenceService.setIsDefaultWallet(val);
  isDefaultWallet = () => preferenceService.getIsDefaultWallet();

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
    if (!forceRefresh) {
      const data = await userInfoService.getCurrentUserInfo();
      if (data.username.length) {
        return data;
      }
    }
    // Either force refresh or the user info is not set
    return await userInfoService.fetchUserInfo();
  };

  updateUserInfo = async (nickname: string, avatar: string) => {
    return await userInfoService.updateUserInfo(nickname, avatar);
  };

  getChildAccountNfts = async (parentAddress: string) => {
    const network = await this.getNetwork();
    return await nftService.getChildAccountNfts(network, parentAddress);
  };

  checkAccessibleFt = async (childAccount: string): Promise<ChildAccountFtStore | undefined> => {
    const network = await this.getNetwork();

    const parentAddress = await userWalletService.getParentAddress();
    if (!parentAddress) {
      throw new Error('Parent address not found');
    }

    return await coinListService.getChildAccountFt(network, parentAddress, childAccount);
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

  initCoinListSession = async (address: string, currency: string) => {
    const network = await this.getNetwork();
    await coinListService.initCoinList(network, address, currency);
  };

  reqeustEvmNft = async () => {
    const address = await this.getEvmAddress();
    const network = await this.getNetwork();
    return await nftService.loadEvmNftCollectionsAndIds(network, address);
  };

  EvmNFTcollectionList = async (collection) => {
    const address = await this.getEvmAddress();
    const network = await this.getNetwork();
    return await nftService.loadEvmCollectionNfts(network, address, collection, '0');
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
    const list = data?.contacts;
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

  getActiveAccountType = async (): Promise<ActiveAccountType> => {
    const activeWallet = await userWalletService.getActiveAccountType();
    return activeWallet;
  };

  /**
   * Set the active account
   * @param address - The address of the account to set as active
   * @param parentAddress - The parent address of the account to set as active
   * @todo - Tom B - 2 Jun 2025 - I am concerned that this may create problems if the network or pubkey is switched while this is being called. I'm considering including the pubkey and network as arguments
   */

  setActiveAccount = async (address: string, parentAddress: string) => {
    if (!isValidFlowAddress(parentAddress)) {
      throw new Error('Invalid parent address');
    }
    if (!isValidAddress(address)) {
      throw new Error('Invalid account address');
    }
    await userWalletService.setCurrentAccount(parentAddress, address);
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
    _index: number | null = null
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
    transactionActivityService.clear();

    // If switching main wallet, refresh the EVM wallet
    if (key === null) {
      await userWalletService.getEvmAccountOfParent(wallet.address as string);
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

    if (!address || !isValidEthereumAddress(address)) {
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

  sendTransaction = async (cadence: string, args: unknown[]): Promise<string> => {
    return await userWalletService.sendTransaction(cadence, args);
  };

  createCOA = async (amount = '0.0'): Promise<string> => transactionService.createCOA(amount);
  createCoaEmpty = async (): Promise<string> => transactionService.createCoaEmpty();
  trackCoaCreation = async (txID: string, errorMessage?: string) =>
    transactionService.trackCoaCreation(txID, errorMessage);
  transferTokens = async (transactionState: TransactionState): Promise<string> =>
    transactionService.transferTokens(transactionState);
  transferFlowEvm = async (
    recipientEVMAddressHex: string,
    amount = '1.0',
    gasLimit = 30000000
  ): Promise<string> =>
    transactionService.transferFlowEvm(recipientEVMAddressHex, amount, gasLimit);
  transferFTToEvm = async (
    tokenContractAddress: string,
    tokenContractName: string,
    amount = '1.0',
    contractEVMAddress: string,
    data
  ): Promise<string> =>
    transactionService.transferFTToEvm(
      tokenContractAddress,
      tokenContractName,
      amount,
      contractEVMAddress,
      data
    );
  transferFTToEvmV2 = async (
    vaultIdentifier: string,
    amount = '0.0',
    recipient: string
  ): Promise<string> => transactionService.transferFTToEvmV2(vaultIdentifier, amount, recipient);
  transferFTFromEvm = async (
    flowidentifier: string,
    amount: string,
    receiver: string,
    tokenResult: TokenInfo
  ): Promise<string> =>
    transactionService.transferFTFromEvm(flowidentifier, amount, receiver, tokenResult);
  withdrawFlowEvm = async (amount = '0.0', address: string): Promise<string> =>
    transactionService.withdrawFlowEvm(amount, address);
  fundFlowEvm = async (amount = '1.0'): Promise<string> => transactionService.fundFlowEvm(amount);
  coaLink = async (): Promise<string> => transactionService.coaLink();
  checkCoaLink = async (): Promise<boolean> => transactionService.checkCoaLink();
  bridgeToEvm = async (flowIdentifier, amount = '1.0'): Promise<string> =>
    transactionService.bridgeToEvm(flowIdentifier, amount);
  bridgeToFlow = async (flowIdentifier, amount = '1.0', tokenResult): Promise<string> =>
    transactionService.bridgeToFlow(flowIdentifier, amount, tokenResult);
  sendEvmTransaction = async (to: string, gas: string | number, value: string, data: string) =>
    transactionService.sendEvmTransaction(to, gas, value, data);
  dapSendEvmTX = async (to: string, gas: bigint, value: string, data: string) =>
    transactionService.dapSendEvmTX(to, gas, value, data);
  getNonce = async (hexEncodedAddress: string): Promise<string> =>
    transactionService.getNonce(hexEncodedAddress);
  unlinkChildAccount = async (address: string): Promise<string> =>
    transactionService.unlinkChildAccount(address);
  unlinkChildAccountV2 = async (address: string): Promise<string> =>
    transactionService.unlinkChildAccountV2(address);
  editChildAccount = async (
    address: string,
    name: string,
    description: string,
    thumbnail: string
  ): Promise<string> => transactionService.editChildAccount(address, name, description, thumbnail);
  transferCadenceTokens = async (
    symbol: string,
    address: string,
    amount: string
  ): Promise<string> => transactionService.transferCadenceTokens(symbol, address, amount);
  revokeKey = async (index: string): Promise<string> => transactionService.revokeKey(index);
  addKeyToAccount = async (
    publicKey: string,
    signatureAlgorithm: number,
    hashAlgorithm: number,
    weight: number
  ): Promise<string> =>
    transactionService.addKeyToAccount(publicKey, signatureAlgorithm, hashAlgorithm, weight);
  enableTokenStorage = async (symbol: string) => transactionService.enableTokenStorage(symbol);
  enableNFTStorageLocal = async (token: NFTModelV2) =>
    transactionService.enableNFTStorageLocal(token);
  moveFTfromChild = async (
    childAddress: string,
    path: string,
    amount: string,
    symbol: string
  ): Promise<string> => transactionService.moveFTfromChild(childAddress, path, amount, symbol);
  sendFTfromChild = async (
    childAddress: string,
    receiver: string,
    path: string,
    amount: string,
    symbol: string
  ): Promise<string> =>
    transactionService.sendFTfromChild(childAddress, receiver, path, amount, symbol);
  moveNFTfromChild = async (
    nftContractAddress: string,
    nftContractName: string,
    ids: number,
    token
  ): Promise<string> =>
    transactionService.moveNFTfromChild(nftContractAddress, nftContractName, ids, token);
  sendNFTfromChild = async (
    linkedAddress: string,
    receiverAddress: string,
    nftContractName: string,
    ids: number,
    token
  ): Promise<string> =>
    transactionService.sendNFTfromChild(
      linkedAddress,
      receiverAddress,
      nftContractName,
      ids,
      token
    );
  bridgeChildNFTToEvmAddress = async (
    linkedAddress: string,
    receiverAddress: string,
    nftContractName: string,
    id: number,
    token
  ): Promise<string> =>
    transactionService.bridgeChildNFTToEvmAddress(
      linkedAddress,
      receiverAddress,
      nftContractName,
      id,
      token
    );
  sendNFTtoChild = async (
    linkedAddress: string,
    path: string,
    ids: number,
    token
  ): Promise<string> => transactionService.sendNFTtoChild(linkedAddress, path, ids, token);
  checkChildLinkedVault = async (parent: string, child: string, path: string): Promise<string> =>
    transactionService.checkChildLinkedVault(parent, child, path);
  batchBridgeNftToEvm = async (flowIdentifier: string, ids: Array<number>): Promise<string> =>
    transactionService.batchBridgeNftToEvm(flowIdentifier, ids);
  batchBridgeNftFromEvm = async (flowIdentifier: string, ids: Array<number>): Promise<string> =>
    transactionService.batchBridgeNftFromEvm(flowIdentifier, ids);
  batchTransferNFTToChild = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> =>
    transactionService.batchTransferNFTToChild(childAddr, identifier, ids, token);
  batchTransferChildNft = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> => transactionService.batchTransferChildNft(childAddr, identifier, ids, token);
  sendChildNFTToChild = async (
    childAddr: string,
    receiver: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> =>
    transactionService.sendChildNFTToChild(childAddr, receiver, identifier, ids, token);
  batchBridgeChildNFTToEvm = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>,
    token
  ): Promise<string> =>
    transactionService.batchBridgeChildNFTToEvm(childAddr, identifier, ids, token);
  batchBridgeChildNFTFromEvm = async (
    childAddr: string,
    identifier: string,
    ids: Array<number>
  ): Promise<string> => transactionService.batchBridgeChildNFTFromEvm(childAddr, identifier, ids);
  bridgeNftToEvmAddress = async (
    flowIdentifier: string,
    ids: number,
    recipientEvmAddress: string
  ): Promise<string> =>
    transactionService.bridgeNftToEvmAddress(flowIdentifier, ids, recipientEvmAddress);
  bridgeNftFromEvmToFlow = async (
    flowIdentifier: string,
    ids: number,
    receiver: string
  ): Promise<string> => transactionService.bridgeNftFromEvmToFlow(flowIdentifier, ids, receiver);
  getAssociatedFlowIdentifier = async (address: string): Promise<string> =>
    transactionService.getAssociatedFlowIdentifier(address);
  sendNFT = async (recipient: string, id: number, token: NFTModelV2): Promise<string> =>
    transactionService.sendNFT(recipient, id, token);
  sendNBANFT = async (recipient: string, id: number, token: NFTModelV2): Promise<string> =>
    transactionService.sendNBANFT(recipient, id, token);

  addCustomEvmToken = async (network: string, token: CustomFungibleTokenInfo) => {
    return await tokenListService.addCustomEvmToken(network, token);
  };

  removeCustomEvmToken = async (network: string, tokenAddress: string) => {
    return await tokenListService.removeCustomEvmToken(network, tokenAddress);
  };

  getTokenPrice = async (token: string, provider = PriceProvider.binance) => {
    return await openapiService.getTokenPrice(token, provider);
  };

  getTokenPriceHistory = async (
    token: string,
    period = Period.oneDay,
    provider = PriceProvider.binance
  ) => {
    return await openapiService.getTokenPriceHistory(token, period, provider);
  };

  getChildAccountAllowTypes = async (parentAddress: string, childAddress: string) => {
    const network = await this.getNetwork();
    return await nftService.getChildAccountAllowTypes(network, parentAddress, childAddress);
  };

  checkCanMoveChild = async (address: string) => {
    return await openapiService.checkChildAccount(address);
  };

  //transaction

  getTransactions = async (
    address: string,
    limit: number,
    offset: number,
    _expiry = 60000,
    _forceRefresh = false
  ): Promise<{
    count: number;
    list: TransferItem[];
  }> => {
    const network = await this.getNetwork();
    return await transactionActivityService.listAllTransactions(
      address,
      limit,
      offset,
      network,
      _expiry,
      _forceRefresh
    );
  };

  getPendingTx = async () => {
    const network = await this.getNetwork();
    const address = await this.getCurrentAddress();
    if (!address) return [];
    return await transactionActivityService.listPending(network, address);
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

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        consoleWarn('No active tab found');
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
    // Clear the active wallet if any
    // If we don't do this, the user wallets will not be refreshed
    this.clearNFT();
    this.refreshAddressBook();
    await openapiService.getCadenceScripts();

    this.abort();
  };

  getKeyIndex = async (): Promise<number> => {
    return await userWalletService.getKeyIndex();
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
    removeLocalData('checkUserChildAccount');
  };

  getEvmEnabled = async (): Promise<boolean> => {
    // Get straight from the userWalletService as getEvmAddress() throws an error if the address is not valid
    const evmAccount = await userWalletService.getEvmAccount();
    return !!evmAccount && isValidEthereumAddress(evmAccount.address);
  };

  clearWallet = () => {
    userWalletService.clear();
  };

  getFlowscanUrl = async (): Promise<string> => {
    const network = await this.getNetwork();
    const isEmulator = await this.getEmulatorMode();
    const isEvm = await this.getActiveAccountType();
    return await transactionActivityService.getFlowscanUrl(network, isEmulator, isEvm);
  };

  getViewSourceUrl = async (): Promise<string> => {
    const network = await this.getNetwork();
    return await transactionActivityService.getViewSourceUrl(network);
  };

  listenTransaction = async (
    txId: string,
    sendNotification = true,
    title = chrome.i18n.getMessage('Transaction__Sealed'),
    body = '',
    icon = chrome.runtime.getURL('./images/icon-64.png')
  ) => {
    return await userWalletService.listenTransaction(txId, {
      sendNotification,
      title,
      body,
      icon,
      notificationCallback: (notificationData) => {
        notification.create(
          notificationData.url,
          notificationData.title,
          notificationData.body,
          notificationData.icon
        );
      },
      errorCallback: (error) => {
        chrome.runtime.sendMessage({
          msg: 'transactionError',
          errorMessage: error.errorMessage,
          errorCode: error.errorCode,
        });
      },
    });
  };

  clearNFT = () => {
    return storageManagementService.clearNFT();
  };

  clearNFTCollection = async () => {
    return await storageManagementService.clearNFTCollection();
  };

  clearCoinList = async () => {
    return await storageManagementService.clearCoinList();
  };

  clearAllStorage = () => {
    return storageManagementService.clearAllStorage();
  };

  clearLocalStorage = async () => {
    return await storageManagementService.clearLocalStorage();
  };

  getCadenceCollectionNfts = async (
    address: string,
    collectionId: string,
    offset = 0
  ): Promise<CollectionNfts | undefined> => {
    const network = await this.getNetwork();
    return await nftService.getCadenceCollectionNfts(network, address, collectionId, offset);
  };

  refreshSingleCollection = async (
    address: string,
    collectionId: string,
    offset: number
  ): Promise<void> => {
    const network = await this.getNetwork();
    triggerRefresh(cadenceCollectionNftsKey(network, address, collectionId, `${offset || 0}`));
  };

  getCollectionCache = async (address: string) => {
    const network = await this.getNetwork();
    const list = await getValidData<NftCollectionAndIds[]>(
      cadenceNftCollectionsAndIdsKey(network, address)
    );
    if (!list || list.length === 0) {
      return await this.refreshCollection(address);
    }
    // Sort by count, maintaining the new collection structure
    const sortedList = [...list].sort((a, b) => b.count - a.count);
    return sortedList;
  };

  refreshCollection = async (address: string) => {
    const network = await this.getNetwork();

    return nftService.loadCadenceNftCollectionsAndIds(network, address);
  };

  getCadenceScripts = async (): Promise<NetworkScripts> => {
    return await openapiService.getCadenceScripts();
  };

  // Google Drive - Backup
  getBackupFiles = async () => {
    return googleDriveService.listFiles();
  };

  hasGooglePermission = async () => {
    return googleDriveService.hasGooglePermission();
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
    const mnemonic = await this.getMnemonic(password);
    return this.uploadMnemonicToGoogleDrive(mnemonic, username, password);
  };

  uploadMnemonicToGoogleDrive = async (mnemonic: string, username: string, password: string) => {
    return await accountManagementService.uploadMnemonicToGoogleDrive(mnemonic, username, password);
  };

  loadBackupAccounts = async (): Promise<string[]> => {
    return googleDriveService.loadBackupAccounts();
  };

  loadBackupAccountLists = async () => {
    return googleDriveService.loadBackupAccountLists();
  };

  restoreAccount = async (username, password): Promise<string | null> => {
    return googleDriveService.restoreAccount(username, password);
  };

  getPayerAddressAndKeyId = async () => {
    return userWalletService.getPayerAddressAndKeyId();
  };

  getBridgeFeePayerAddressAndKeyId = async () => {
    return userWalletService.getBridgeFeePayerAddressAndKeyId();
  };

  getFeatureFlags = async (): Promise<FeatureFlags> => {
    return remoteConfigService.getFeatureFlags();
  };

  getFeatureFlag = async (featureFlag: FeatureFlagKey): Promise<boolean> => {
    return remoteConfigService.getFeatureFlag(featureFlag);
  };

  allowLilicoPay = async (): Promise<boolean> => {
    return userWalletService.allowFreeGas();
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

  getAccountInfo = async (address: string): Promise<FclAccount> => {
    return await accountManagementService.getAccountInfo(address);
  };

  getMainAccountInfo = async (): Promise<FclAccount> => {
    return await accountManagementService.getMainAccountInfo();
  };

  getEmoji = async () => {
    return getEmojiList();
  };

  /**
   *  @deprecated this doesn't do anything
   *  @todo remove this
   */
  setEmoji_depreciated = async (emoji, _type, _index) => {
    return emoji;
  };

  setDisplayCurrency = async (currency: Currency) => {
    await preferenceService.setDisplayCurrency(currency);
  };

  getDisplayCurrency = async () => {
    return await preferenceService.getDisplayCurrency();
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

  isNewsRead = (id: string) => {
    return newsService.isRead(id);
  };

  resetNews = () => {
    return newsService.clear();
  };

  // Tracking stuff

  trackOnRampClicked = async (source: 'moonpay' | 'coinbase') => {
    analyticsService.track('on_ramp_clicked', {
      source: source,
    });
  };

  // This is called from the front end, we should find a better way to track this event
  trackAccountRecovered = async () => {
    analyticsService.track('account_recovered', {
      address: (await this.getCurrentAddress()) || '',
      mechanism: 'Multi-Backup',
      methods: [],
    });
  };

  trackPageView = async (pathname: string) => {
    analyticsService.trackPageView(pathname);
  };

  trackTime = async (eventName: keyof TrackingEvents) => {
    analyticsService.time(eventName);
  };

  decodeEvmCall = async (callData: string, address = '') => {
    return await openapiService.decodeEvmCall(callData, address);
  };

  // Todo - I don't think this works as expected in any case
  saveIndex = async (username = '', userId = null) => {
    const loggedInAccounts: LoggedInAccount[] = (await getLocalData('loggedInAccounts')) || [];
    let currentindex = 0;

    if (!loggedInAccounts || loggedInAccounts.length === 0) {
      currentindex = 0;
    } else {
      const index = loggedInAccounts.findIndex((account) => account.username === username);
      currentindex = index !== -1 ? index : loggedInAccounts.length;
    }

    const path = (await getLocalData('temp_path')) || "m/44'/539'/0'/0/0";
    const passphrase = (await getLocalData('temp_phrase')) || '';
    await setLocalData(`user${currentindex}_path`, path);
    await setLocalData(`user${currentindex}_phrase`, passphrase);
    await setLocalData(`user${userId}_path`, path);
    await setLocalData(`user${userId}_phrase`, passphrase);
    await removeLocalData(`temp_path`);
    await removeLocalData(`temp_phrase`);
    // Note that currentAccountIndex is only used in keyring for old accounts that don't have an id stored in the keyring
    // currentId always takes precedence
    await setLocalData('currentAccountIndex', currentindex);
    if (userId) {
      await setLocalData(CURRENT_ID_KEY, userId);
    }
  };

  getEvmNftId = async (address: string) => {
    const network = await this.getNetwork();
    return await nftService.getEvmNftCollectionsAndIds(network, address);
  };

  getEvmNftCollectionList = async (
    address: string,
    collectionIdentifier: string,
    _limit = 50,
    offset = '0'
  ) => {
    const network = await this.getNetwork();
    return await nftService.getEvmCollectionNfts(network, address, collectionIdentifier, offset);
  };

  clearEvmNFTList = async () => {
    await nftService.clear();
  };

  getKeyringIds = async () => {
    // Use userInfoService to get the stored user list
    return await keyringService.getAllKeyringIds();
  };

  /**
   * Get profile backup statuses for password change operation
   * @param currentPassword - The current password to test decryption
   * @returns Promise<ProfileBackupStatus[]> - Array of profile backup statuses
   */
  getProfileBackupStatuses = async (currentPassword: string): Promise<ProfileBackupStatus[]> => {
    return await accountManagementService.getProfileBackupStatuses(currentPassword);
  };

  /**
   * Change password with selective profile backup updates
   * @param currentPassword - The current password
   * @param newPassword - The new password
   * @param selectedProfiles - List of profile usernames to update backups for
   * @param ignoreBackupsAtUsersOwnRisk - Whether to ignore backups (for users without Google permission)
   * @returns Promise<boolean> - Success status
   */
  changePassword = async (
    currentPassword: string,
    newPassword: string,
    selectedProfiles: string[] = [],
    ignoreBackupsAtUsersOwnRisk: boolean = false
  ): Promise<boolean> => {
    return await accountManagementService.changePassword(
      currentPassword,
      newPassword,
      selectedProfiles,
      ignoreBackupsAtUsersOwnRisk
    );
  };

  /**
   * Update account metadata (emoji, name, background color) via openapi API
   */
  updateAccountMetadata = async (
    address: string,
    icon: string,
    name: string,
    background: string
  ) => {
    return await accountManagementService.updateAccountMetadata(address, icon, name, background);
  };

  /**
   * Get user metadata from openapi API
   */
  getUserMetadata = async () => {
    return await openapiService.getUserMetadata();
  };

  /**
   * Set the description for a child account
   * @param address - The address of the child account
   * @param desc - The description to set
   * @returns Promise<void> - Success status
   */
  setChildAccountDescription = async (address: string, desc: string): Promise<void> => {
    if (!address) return;
    await setCachedData(childAccountDescKey(address), desc, 3600_000);
  };
}

export default new WalletController();
