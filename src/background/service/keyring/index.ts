/// fork from https://github.com/MetaMask/KeyringController/blob/master/index.js

import { EventEmitter } from 'events';

import * as bip39 from 'bip39';
import encryptor from 'browser-passworder';
import * as ethUtil from 'ethereumjs-util';
import log from 'loglevel';

import eventBus from '@/eventBus';
import {
  normalizeAddress,
  setPageStateCacheWhenPopupClose,
  hasWalletConnectPageStateCache,
} from 'background/utils';
import { KEYRING_TYPE } from 'consts';

import { storage } from '../../webapi';
import i18n from '../i18n';
import preference from '../preference';

import type DisplayKeyring from './display';
import { HDKeyring } from './hdKeyring';
import { SimpleKeyring } from './simpleKeyring';

export const KEYRING_SDK_TYPES = {
  SimpleKeyring,
  HDKeyring,
};

export const KEYRING_CLASS = {
  PRIVATE_KEY: SimpleKeyring.type,
  MNEMONIC: HDKeyring.type,
};

interface MemStoreState {
  isUnlocked: boolean;
  keyringTypes: any[];
  keyrings: any[];
  preMnemonics: string;
}

export interface DisplayedKeryring {
  type: string;
  accounts: {
    address: string;
    brandName: string;
    type?: string;
    keyring?: any;
    alianName?: string;
  }[];
  keyring: any;
}

interface KeyringData {
  0: {
    type: 'HD Key Tree' | 'Simple Key Pair';
    data:
      | {
          mnemonic?: string;
          activeIndexes?: number[];
          publicKey?: string;
        }
      | string[];
  };
  id: string;
}

interface HDWallet {
  provider: null;
  address: string;
  publicKey: string;
  fingerprint: string;
  parentFingerprint: string;
  mnemonic: {
    phrase: string;
    password: string;
    wordlist: {
      locale: string;
    };
    entropy: string;
  };
  chainCode: string;
  path: string;
  index: number;
  depth: number;
}

interface SimpleKeyPairWallet {
  privateKey: {
    type: 'Buffer';
    data: number[];
  };
}

interface Keyring {
  type: 'HD Key Tree' | 'Simple Key Pair';
  hdWallet?: HDWallet;
  wallets?: SimpleKeyPairWallet[];
  mnemonic?: string;
  activeIndexes?: number[];
  getAccounts(): Promise<string[]>;
  addAccounts(n: number): Promise<string[]>;
  removeAccount(address: string, brand?: string): void;
  serialize(): Promise<any>;
}

class SimpleStore<T> {
  private state: T;
  private listeners: ((state: T) => void)[] = [];

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return this.state;
  }

  updateState(partialState: Partial<T>) {
    this.state = { ...this.state, ...partialState };
    this.notifyListeners();
  }

  subscribe(listener: (state: T) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

class KeyringService extends EventEmitter {
  //
  // PUBLIC METHODS
  //
  keyringTypes: any[];
  store!: SimpleStore<any>;
  memStore: SimpleStore<MemStoreState>;
  keyring: Keyring[];
  keyringList: KeyringData[];
  encryptor: typeof encryptor = encryptor;
  password: string | null = null;

  constructor() {
    super();
    this.keyringTypes = Object.values(KEYRING_SDK_TYPES);
    this.store = new SimpleStore({ booted: false });
    this.memStore = new SimpleStore<MemStoreState>({
      isUnlocked: false,
      keyringTypes: this.keyringTypes.map((krt) => krt.type),
      keyrings: [],
      preMnemonics: '',
    });
    this.keyring = [];
    this.keyringList = [];
  }

  loadMemStore() {
    return this.memStore.getState();
  }

  async boot(password: string) {
    this.password = password;
    const encryptBooted = await this.encryptor.encrypt(password, 'true');
    this.store.updateState({ booted: encryptBooted });
    this.memStore.updateState({ isUnlocked: true });
  }

  async update(password: string) {
    this.password = password;
    const encryptBooted = await this.encryptor.encrypt(password, 'true');
    this.store.updateState({ booted: encryptBooted });
  }

  isBooted() {
    return !!this.store.getState().booted;
  }

  hasVault() {
    return !!this.store.getState().vault;
  }

  /**
   * Full Update
   *
   * Emits the `update` event and @returns a Promise that resolves to
   * the current state.
   *
   * Frequently used to end asynchronous chains in this class,
   * indicating consumers can often either listen for updates,
   * or accept a state-resolving promise to consume their results.
   *
   * @returns {Object} The controller state.
   */
  fullUpdate(): MemStoreState {
    this.emit('update', this.memStore.getState());
    return this.memStore.getState();
  }

  /**
   * Import Keychain using Private key
   *
   * @emits KeyringController#unlock
   * @param {string} privateKey - The privateKey to generate address
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  importPrivateKey(privateKey: string): Promise<any> {
    let keyring;

    return this.persistAllKeyrings()
      .then(this.addNewKeyring.bind(this, 'Simple Key Pair', [privateKey]))
      .then((_keyring) => {
        keyring = _keyring;
        return this.persistAllKeyrings.bind(this);
      })
      .then(this.setUnlocked.bind(this))
      .then(this.fullUpdate.bind(this))
      .then(() => keyring);
  }

  /**
   * Import Keychain using Proxy publickey
   *
   * @emits KeyringController#unlock
   * @param {string} privateKey - The privateKey to generate address
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  importPublicKey(key: string, seed: string): Promise<any> {
    let keyring;
    return this.persistAllKeyrings()
      .then(() => {
        return this.addNewKeyring('HD Key Tree', {
          publicKey: key,
          mnemonic: seed,
          activeIndexes: [1],
        });
      })
      .then((firstKeyring) => {
        keyring = firstKeyring;
        return firstKeyring.getAccounts();
      })
      .then(([firstAccount]) => {
        if (!firstAccount) {
          throw new Error('KeyringController - First Account not found.');
        }
        return null;
      })
      .then(this.persistAllKeyrings.bind(this))
      .then(this.setUnlocked.bind(this))
      .then(this.fullUpdate.bind(this))
      .then(() => keyring);
  }

  generateMnemonic(): string {
    return bip39.generateMnemonic();
  }

  async generatePreMnemonic(): Promise<string> {
    if (!this.password) {
      throw new Error(i18n.t('you need to unlock wallet first'));
    }
    const mnemonic = this.generateMnemonic();
    const preMnemonics = await this.encryptor.encrypt(this.password, mnemonic);
    this.memStore.updateState({ preMnemonics });

    return mnemonic;
  }

  getKeyringByType(type: string) {
    const keyring = this.keyring.find((keyring) => keyring.type === type);

    return keyring;
  }

  removePreMnemonics() {
    this.memStore.updateState({ preMnemonics: '' });
  }

  async getPreMnemonics(): Promise<any> {
    if (!this.memStore.getState().preMnemonics) {
      return '';
    }

    if (!this.password) {
      throw new Error(i18n.t('You need to unlock your wallet first'));
    }

    return await this.encryptor.decrypt(this.password, this.memStore.getState().preMnemonics);
  }

  /**
   * CreateNewVaultAndRestore Mnenoic
   *
   * Destroys any old encrypted storage,
   * creates a new HD wallet from the given seed with 1 account.
   *
   * @emits KeyringController#unlock
   * @param {string} seed - The BIP44-compliant seed phrase.
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  async createKeyringWithMnemonics(seed: string): Promise<any> {
    if (!bip39.validateMnemonic(seed)) {
      return Promise.reject(new Error(i18n.t('mnemonic phrase is invalid')));
    }
    let keyring;
    return this.persistAllKeyrings()
      .then(() => {
        return this.addNewKeyring('HD Key Tree', {
          mnemonic: seed,
          activeIndexes: [0],
        });
      })
      .then((firstKeyring) => {
        keyring = firstKeyring;
        return firstKeyring.getAccounts();
      })
      .then(([firstAccount]) => {
        if (!firstAccount) {
          throw new Error('KeyringController - First Account not found.');
        }
        return null;
      })
      .then(this.persistAllKeyrings.bind(this))
      .then(this.setUnlocked.bind(this))
      .then(this.fullUpdate.bind(this))
      .then(() => keyring);
  }

  async addKeyring(keyring) {
    return keyring
      .getAccounts()
      .then((accounts) => {
        return this.checkForDuplicate(keyring.type, accounts);
      })
      .then(() => {
        this.keyring.push(keyring);
        return this.persistAllKeyrings();
      })
      .then(() => this._updateMemStoreKeyrings())
      .then(() => this.fullUpdate())
      .then(() => {
        return keyring;
      });
  }

  /**
   * Set Locked
   * This method deallocates all secrets.
   *
   * @emits KeyringController#lock
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  async setLocked(): Promise<MemStoreState> {
    // set locked
    this.password = null;
    this.memStore.updateState({ isUnlocked: false });
    // remove keyrings
    this.keyring = [];
    await this._updateMemStoreKeyrings();
    this.emit('lock');
    return this.fullUpdate();
  }

  /**
   * Update Keyring
   * Update the keyring based on the one save in localstorage
   *
   */
  async updateKeyring() {
    // remove keyrings
    this.keyring = [];
    await this._updateMemStoreKeyrings();
  }

  getPassword(): string | null {
    return this.password;
  }

  /**
   * Submit Password
   *
   * Attempts to decrypt the current vault and load its keyrings
   * into memory.
   *
   * Temporarily also migrates any old-style vaults first, as well.
   * (Pre MetaMask 3.0.0)
   *
   * @emits KeyringController#unlock
   * @param {string} password - The keyring controller password.
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  async submitPassword(password: string): Promise<MemStoreState> {
    await this.verifyPassword(password);
    this.password = password;
    try {
      this.keyring = await this.unlockKeyrings(password);
    } catch {
      //
    } finally {
      this.setUnlocked();
    }

    return this.fullUpdate();
  }

  /**
   * Verify Password
   *
   * Attempts to decrypt the current vault with a given password
   * to verify its validity.
   *
   * @param {string} password
   */
  async verifyPassword(password: string): Promise<void> {
    const encryptedBooted = this.store.getState().booted;
    if (!encryptedBooted) {
      throw new Error(i18n.t('Cannot unlock without a previous vault'));
    }
    await this.encryptor.decrypt(password, encryptedBooted);
  }

  /**
   * Add New Keyring
   *
   * Adds a new Keyring of the given `type` to the vault
   * and the current decrypted Keyrings array.
   *
   * All Keyring classes implement a unique `type` string,
   * and this is used to retrieve them from the keyringTypes array.
   *
   * @param {string} type - The type of keyring to add.
   * @param {Object} opts - The constructor options for the keyring.
   * @returns {Promise<Keyring>} The new keyring.
   */
  addNewKeyring(type: string, opts?: unknown): Promise<any> {
    const Keyring = this.getKeyringClassForType(type);
    const keyring = new Keyring(opts);
    return this.addKeyring(keyring);
  }

  /**
   * Remove Empty Keyrings
   *
   * Loops through the keyrings and removes the ones with empty accounts
   * (usually after removing the last / only account) from a keyring
   */
  async removeEmptyKeyrings(): Promise<undefined> {
    const validKeyrings: Keyring[] = [];

    // Since getAccounts returns a Promise
    // We need to wait to hear back form each keyring
    // in order to decide which ones are now valid (accounts.length > 0)

    await Promise.all(
      this.keyring.map(async (keyring) => {
        const accounts = await keyring.getAccounts();
        if (accounts.length > 0) {
          validKeyrings.push(keyring);
        }
      })
    );
    this.keyring = validKeyrings;
    return;
  }

  /**
   * Checks for duplicate keypairs, using the the first account in the given
   * array. Rejects if a duplicate is found.
   *
   * Only supports 'Simple Key Pair'.
   *
   * @param {string} type - The key pair type to check for.
   * @param {Array<string>} newAccountArray - Array of new accounts.
   * @returns {Promise<Array<string>>} The account, if no duplicate is found.
   */
  async checkForDuplicate(type: string, newAccountArray: string[]): Promise<string[]> {
    const keyrings = this.getKeyringsByType(type);
    const _accounts = await Promise.all(keyrings.map((keyring) => keyring.getAccounts()));

    const accounts: string[] = _accounts
      .reduce((m, n) => m.concat(n), [] as string[])
      .map((address) => normalizeAddress(address).toLowerCase());

    const isIncluded = newAccountArray.some((account) => {
      return accounts.find(
        (key) => key === account.toLowerCase() || key === ethUtil.stripHexPrefix(account)
      );
    });

    return isIncluded
      ? Promise.reject(new Error(i18n.t('duplicateAccount')))
      : Promise.resolve(newAccountArray);
  }

  /**
   * Add New Account
   *
   * Calls the `addAccounts` method on the given keyring,
   * and then saves those changes.
   *
   * @param {Keyring} selectedKeyring - The currently selected keyring.
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  async addNewAccount(selectedKeyring: any): Promise<string[]> {
    let _accounts;
    return selectedKeyring
      .addAccounts(1)
      .then((accounts) => {
        accounts.forEach((hexAccount) => {
          this.emit('newAccount', hexAccount);
        });
        _accounts = accounts;
      })
      .then(this.persistAllKeyrings.bind(this))
      .then(this._updateMemStoreKeyrings.bind(this))
      .then(this.fullUpdate.bind(this))
      .then(() => _accounts);
  }

  /**
   * Export Account
   *
   * Requests the private key from the keyring controlling
   * the specified address.
   *
   * Returns a Promise that may resolve with the private key string.
   *
   * @param {string} address - The address of the account to export.
   * @returns {Promise<string>} The private key of the account.
   */
  async exportAccount(address: string): Promise<string> {
    try {
      return this.getKeyringForAccount(address).then((keyring) => {
        return keyring.exportAccount(normalizeAddress(address));
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   *
   * Remove Account
   *
   * Removes a specific account from a keyring
   * If the account is the last/only one then it also removes the keyring.
   *
   * @param {string} address - The address of the account to remove.
   * @returns {Promise<void>} A Promise that resolves if the operation was successful.
   */
  async removeAccount(address: string, type: string, brand?: string): Promise<any> {
    return this.getKeyringForAccount(address, type)
      .then((keyring) => {
        // Not all the keyrings support this, so we have to check
        if (typeof keyring.removeAccount === 'function') {
          keyring.removeAccount(address, brand);
          this.emit('removedAccount', address);
          return keyring.getAccounts();
        }
        return Promise.reject(
          new Error(`Keyring ${keyring.type} doesn't support account removal operations`)
        );
      })
      .then((accounts) => {
        // Check if this was the last/only account
        if (accounts.length === 0) {
          return this.removeEmptyKeyrings();
        }
        return undefined;
      })
      .then(this.persistAllKeyrings.bind(this))
      .then(this._updateMemStoreKeyrings.bind(this))
      .then(this.fullUpdate.bind(this))
      .catch((e) => {
        return Promise.reject(e);
      });
  }

  //
  // SIGNING METHODS
  //

  /**
   * Sign Ethereum Transaction
   *
   * Signs an Ethereum transaction object.
   *
   * @param {Object} ethTx - The transaction to sign.
   * @param {string} _fromAddress - The transaction 'from' address.
   * @param {Object} opts - Signing options.
   * @returns {Promise<Object>} The signed transactio object.
   */
  signTransaction(keyring, ethTx, _fromAddress, opts = {}) {
    const fromAddress = normalizeAddress(_fromAddress);
    return keyring.signTransaction(fromAddress, ethTx, opts);
  }

  /**
   * Sign Message
   *
   * Attempts to sign the provided message parameters.
   *
   * @param {Object} msgParams - The message parameters to sign.
   * @returns {Promise<Buffer>} The raw signature.
   */
  signMessage(msgParams, opts = {}) {
    const address = normalizeAddress(msgParams.from);
    return this.getKeyringForAccount(address).then((keyring) => {
      return keyring.signMessage(address, msgParams.data, opts);
    });
  }

  /**
   * Sign Personal Message
   *
   * Attempts to sign the provided message paramaters.
   * Prefixes the hash before signing per the personal sign expectation.
   *
   * @param {Object} msgParams - The message parameters to sign.
   * @returns {Promise<Buffer>} The raw signature.
   */
  signPersonalMessage(keyring, msgParams, opts = {}) {
    const address = normalizeAddress(msgParams.from);
    return keyring.signPersonalMessage(address, msgParams.data, opts);
  }

  /**
   * Sign Typed Data
   * (EIP712 https://github.com/ethereum/EIPs/pull/712#issuecomment-329988454)
   *
   * @param {Object} msgParams - The message parameters to sign.
   * @returns {Promise<Buffer>} The raw signature.
   */
  signTypedMessage(keyring, msgParams, opts = { version: 'V1' }) {
    const address = normalizeAddress(msgParams.from);
    return keyring.signTypedData(address, msgParams.data, opts);
  }

  /**
   * Get encryption public key
   *
   * Get encryption public key for using in encrypt/decrypt process.
   *
   * @param {Object} address - The address to get the encryption public key for.
   * @returns {Promise<Buffer>} The public key.
   */
  getEncryptionPublicKey(_address, opts = {}) {
    const address = normalizeAddress(_address);
    return this.getKeyringForAccount(address).then((keyring) => {
      return keyring.getEncryptionPublicKey(address, opts);
    });
  }

  /**
   * Decrypt Message
   *
   * Attempts to decrypt the provided message parameters.
   *
   * @param {Object} msgParams - The decryption message parameters.
   * @returns {Promise<Buffer>} The raw decryption result.
   */
  decryptMessage(msgParams, opts = {}) {
    const address = normalizeAddress(msgParams.from);
    return this.getKeyringForAccount(address).then((keyring) => {
      return keyring.decryptMessage(address, msgParams.data, opts);
    });
  }

  /**
   * Gets the app key address for the given Ethereum address and origin.
   *
   * @param {string} _address - The Ethereum address for the app key.
   * @param {string} origin - The origin for the app key.
   * @returns {string} The app key address.
   */
  async getAppKeyAddress(_address, origin) {
    const address = normalizeAddress(_address);
    const keyring = await this.getKeyringForAccount(address);
    return keyring.getAppKeyAddress(address, origin);
  }

  /**
   * Exports an app key private key for the given Ethereum address and origin.
   *
   * @param {string} _address - The Ethereum address for the app key.
   * @param {string} origin - The origin for the app key.
   * @returns {string} The app key private key.
   */
  async exportAppKeyForAddress(_address, origin) {
    const address = normalizeAddress(_address);
    const keyring = await this.getKeyringForAccount(address);
    if (!('exportAccount' in keyring)) {
      throw new Error(`The keyring for address ${_address} does not support exporting.`);
    }
    return keyring.exportAccount(address, { withAppKeyOrigin: origin });
  }

  //
  // PRIVATE METHODS
  //

  /**
   * Create First Key Tree
   *
   * - Clears the existing vault
   * - Creates a new vault
   * - Creates a random new HD Keyring with 1 account
   * - Makes that account the selected account
   * - Faucets that account on testnet
   * - Puts the current seed words into the state tree
   *
   * @returns {Promise<void>} - A promise that resovles if the operation was successful.
   */
  createFirstKeyTree() {
    this.clearKeyrings();
    return this.addNewKeyring('HD Key Tree', { activeIndexes: [0] })
      .then((keyring) => {
        return keyring.getAccounts();
      })
      .then(([firstAccount]) => {
        if (!firstAccount) {
          throw new Error('KeyringController - No account found on keychain.');
        }
        const hexAccount = normalizeAddress(firstAccount);
        this.emit('newVault', hexAccount);
        return null;
      });
  }

  /**
   * Persist All Keyrings
   *
   * Iterates the current `keyrings` array,
   * serializes each one into a serialized array,
   * encrypts that array with the provided `password`,
   * and persists that encrypted string to storage.
   *
   * @param {string} password - The keyring controller password.
   * @returns {Promise<boolean>} Resolves to true once keyrings are persisted.
   */
  async persistAllKeyrings(): Promise<boolean> {
    if (!this.password || typeof this.password !== 'string') {
      return Promise.reject(new Error('KeyringController - password is not a string'));
    }
    return Promise.all(
      this.keyring.map((keyring) => {
        return Promise.all([keyring.type, keyring.serialize()]).then((serializedKeyringArray) => {
          // Label the output values on each serialized Keyring:
          return {
            type: serializedKeyringArray[0],
            data: serializedKeyringArray[1],
          };
        });
      })
    )
      .then((serializedKeyrings) => {
        return this.encryptor.encrypt(
          this.password as string,
          serializedKeyrings as unknown as Buffer
        );
      })
      .then(async (encryptedString) => {
        // Note that currentAccountIndex is only used in keyring for old accounts that don't have an id stored in the keyring
        // currentId always takes precedence
        const currentId = await storage.get('currentId');

        const oldVault = this.store.getState().vault;
        const deepVault = (await storage.get('deepVault')) || []; // Retrieve deepVault from storage
        // Check if oldVault is defined and not an array, if so convert it to an array
        // If undefined, set it to an empty array
        let vaultArray = Array.isArray(oldVault) ? oldVault : oldVault ? [oldVault] : [];
        const deepVaultArray = Array.isArray(deepVault) ? deepVault : deepVault ? [deepVault] : []; // Ensure deepVault is treated as array

        // Handle the case when currentId is available
        if (currentId !== null && currentId !== undefined) {
          // If we have the currentId, we can filter the vaultArray to remove null/undefined entries
          // We can then update the accountIndex to the index of the entry with currentId
          vaultArray = vaultArray.filter((entry) => entry !== null && entry !== undefined);
          // Find if an entry with currentId already exists in both vault and deepVault
          let vaultArrayAccountIndex = vaultArray.findIndex(
            (entry) =>
              entry !== null &&
              entry !== undefined &&
              Object.prototype.hasOwnProperty.call(entry, currentId)
          );

          const existingDeepVaultIndex = deepVaultArray.findIndex(
            (entry) =>
              entry !== null &&
              entry !== undefined &&
              Object.prototype.hasOwnProperty.call(entry, currentId)
          );

          if (vaultArrayAccountIndex !== -1) {
            // Update existing entry in vault
            vaultArray[vaultArrayAccountIndex][currentId] = encryptedString;
          } else {
            // Add new entry to vault
            const newEntry = {};
            newEntry[currentId] = encryptedString;
            vaultArray.push(newEntry);
            // Update the existingIndex to the index of the new entry
            vaultArrayAccountIndex = vaultArray.length - 1;
          }

          if (existingDeepVaultIndex !== -1) {
            // Update existing entry in deepVault
            deepVaultArray[existingDeepVaultIndex][currentId] = encryptedString;
          } else {
            // Add new entry to deepVault
            const newDeepEntry = {};
            newDeepEntry[currentId] = encryptedString;
            deepVaultArray.push(newDeepEntry);
          }
        } else {
          // Handle the case when currentId is not provided
          throw new Error('KeyringController - currentId is not provided');
        }

        // Update both vault and deepVault
        if (vaultArray && vaultArray.length > 0) {
          this.store.updateState({ vault: vaultArray });
        }
        if (deepVaultArray && deepVaultArray.length > 0) {
          await storage.set('deepVault', deepVaultArray); // Save deepVault in storage
        }

        return true;
      });
  }

  /**
   * Unlock Keyrings
   *
   * Attempts to unlock the persisted encrypted storage,
   * initializing the persisted keyrings to RAM.
   *
   * @param {string} password - The keyring controller password.
   * @returns {Promise<Array<Keyring>>} The keyrings.
   */
  async unlockKeyrings(password: string): Promise<any[]> {
    // Note that currentAccountIndex is only used in keyring for old accounts that don't have an id stored in the keyring removing in 2.7.6
    // currentId always takes precedence
    const currentId = await storage.get('currentId');
    let vaultArray = this.store.getState().vault;

    // Ensure vaultArray is an array and filter out null/undefined entries
    vaultArray = Array.isArray(vaultArray) ? vaultArray.filter(Boolean) : [vaultArray];

    await this.decryptVaultArray(vaultArray, password);
    this.password = password;
    const keyrings = await this.switchKeyring(currentId);
    return keyrings;
  }

  /**
   * Switch Keyrings
   *
   * Attempts to switch the keyring based on the given id,
   * Set the new keyring to ram.
   *
   * @param {string} currentId - The id of the keyring to switch to.
   * @returns {Promise<Array<Keyring>>} The keyring.
   */
  async switchKeyring(currentId: string): Promise<any[]> {
    // useCurrentId to find the keyring in the keyringList
    const selectedKeyring = this.keyringList.find((keyring) => keyring.id === currentId);
    // remove the keyring of the previous account
    await this.clearKeyrings();

    await Promise.all(
      [selectedKeyring].map(async (keyring) => {
        try {
          await this._restoreKeyring(keyring?.[0]); // Access the first property which contains type and data
        } catch (error) {
          console.error('Failed to restore keyring:', error);
          throw error;
        }
      })
    );

    await this._updateMemStoreKeyrings();
    return this.keyring;
  }

  /**
   * Retrieve privatekey from vault
   *
   * Attempts to unlock the persisted encrypted storage,
   * Return all the privatekey stored in vault.
   *
   * @param {string} password - The keyring controller password.
   * @returns {Promise<Array<Keyring>>} The keyrings.
   */
  async retrievePk(password: string): Promise<any[]> {
    let vaultArray = this.store.getState().vault;

    // If vault is unavailable or empty, retrieve from deepVault
    if (!vaultArray || vaultArray.length === 0) {
      console.warn('Vault not found, retrieving from deepVault...');
      vaultArray = await storage.get('deepVault');

      if (!vaultArray) {
        throw new Error(i18n.t('Cannot unlock without a previous vault or deep vault'));
      }
    }

    // Ensure vaultArray is an array
    if (typeof vaultArray === 'string') {
      vaultArray = [vaultArray];
    }

    // Decrypt each entry in the vaultArray
    const decryptedVaults: any[] = [];
    for (const vaultEntry of vaultArray) {
      let encryptedString;
      if (vaultEntry && typeof vaultEntry === 'object' && Object.keys(vaultEntry).length === 1) {
        const key = Object.keys(vaultEntry)[0];
        encryptedString = vaultEntry[key];
      } else if (typeof vaultEntry === 'string') {
        encryptedString = vaultEntry;
      } else {
        continue;
      }

      try {
        const decryptedVault = await this.encryptor.decrypt(password, encryptedString);
        decryptedVaults.push(decryptedVault);
      } catch (error) {
        console.error('Decryption failed for an entry:', error);
        continue;
      }
    }

    if (decryptedVaults.length === 0) {
      throw new Error(i18n.t('Cannot unlock without a previous vault'));
    }

    const extractedData = decryptedVaults.map((entry, index) => {
      const item = entry[0];
      let keyType, value;

      if (item.type === 'HD Key Tree') {
        if (item.data.activeIndexes[0] === 1) {
          keyType = 'publicKey';
          value = item.data.publicKey;
        } else {
          keyType = 'mnemonic';
          value = item.data.mnemonic;
        }
      } else if (item.type === 'Simple Key Pair') {
        keyType = 'privateKey';
        value = item.data[0];
      }

      return { index, keyType, value };
    });

    return extractedData;
  }

  /**
   * Restore Keyring
   *
   * Attempts to initialize a new keyring from the provided serialized payload.
   * On success, updates the memStore keyrings and returns the resulting
   * keyring instance.
   *
   * @param {Object} serialized - The serialized keyring.
   * @returns {Promise<Keyring>} The deserialized keyring.
   */
  async restoreKeyring(serialized) {
    const keyring = await this._restoreKeyring(serialized);
    await this._updateMemStoreKeyrings();
    return keyring;
  }

  /**
   * Restore Keyring Helper
   *
   * Attempts to initialize a new keyring from the provided serialized payload.
   * On success, returns the resulting keyring instance.
   *
   * @param {Object} serialized - The serialized keyring.
   * @returns {Promise<Keyring>} The deserialized keyring.
   */
  async _restoreKeyring(serialized: any): Promise<any> {
    const { type, data } = serialized;
    const Keyring = this.getKeyringClassForType(type);
    const keyring = new Keyring();

    try {
      // For HD Key Tree, initialize with just the mnemonic and indexes
      if (type === 'HD Key Tree' && data) {
        await keyring.deserialize({
          mnemonic: data.mnemonic,
          activeIndexes: data.activeIndexes || [0],
          hdPath: 'm',
        });
      } else {
        await keyring.deserialize(data);
      }

      await keyring.getAccounts();
      this.keyring.push(keyring);
      return keyring;
    } catch (error) {
      console.error('Restore keyring error:', error);
      throw error;
    }
  }

  /**
   * Get Keyring Class For Type
   *
   * Searches the current `keyringTypes` array
   * for a Keyring class whose unique `type` property
   * matches the provided `type`,
   * returning it if it exists.
   *
   * @param {string} type - The type whose class to get.
   * @returns {Keyring|undefined} The class, if it exists.
   */
  getKeyringClassForType(type: string): any {
    return this.keyringTypes.find((kr) => kr.type === type);
  }

  /**
   * Get Keyrings by Type
   *
   * Gets all keyrings of the given type.
   *
   * @param {string} type - The keyring types to retrieve.
   * @returns {Array<Keyring>} The keyrings.
   */
  getKeyringsByType(type: string): any[] {
    return this.keyring.filter((keyring) => keyring.type === type);
  }

  /**
   * Get Accounts
   *
   * Returns the public addresses of all current accounts
   * managed by all currently unlocked keyrings.
   *
   * @returns {Promise<Array<string>>} The array of accounts.
   */
  async getAccounts(): Promise<string[]> {
    const keyrings = this.keyring || [];
    const addrs = await Promise.all(keyrings.map((kr) => kr.getAccounts())).then(
      (keyringArrays) => {
        return keyringArrays.reduce((res, arr) => {
          return res.concat(arr);
        }, []);
      }
    );
    return addrs.map(normalizeAddress);
  }

  /**
   * Get Keyring
   *
   * Returns the key ring of current storage
   * managed by all currently unlocked keyrings.
   *
   * @returns {Promise<Array<string>>} The array of accounts.
   */
  async getKeyring(): Promise<any[]> {
    const keyrings = this.keyring || [];
    return keyrings;
  }

  /**
   * Get Keyring For Account
   *
   * Returns the currently initialized keyring that manages
   * the specified `address` if one exists.
   *
   * @param {string} address - An account address.
   * @returns {Promise<Keyring>} The keyring of the account, if it exists.
   */
  getKeyringForAccount(
    address: string,
    type?: string,
    start?: number,
    end?: number,
    includeWatchKeyring = true
  ): Promise<any> {
    const hexed = normalizeAddress(address).toLowerCase();
    log.debug(`KeyringController - getKeyringForAccount: ${hexed}`);
    let keyrings = type ? this.keyring.filter((keyring) => keyring.type === type) : this.keyring;
    if (!includeWatchKeyring) {
      keyrings = keyrings.filter((keyring) => keyring.type !== KEYRING_TYPE.WatchAddressKeyring);
    }
    return Promise.all(
      keyrings.map((keyring) => {
        return Promise.all([keyring, keyring.getAccounts()]);
      })
    ).then((candidates) => {
      const winners = candidates.filter((candidate) => {
        const accounts = candidate[1].map((addr) => {
          return normalizeAddress(addr).toLowerCase();
        });
        return accounts.includes(hexed);
      });
    });
  }

  /**
   * Display For Keyring
   *
   * Is used for adding the current keyrings to the state object.
   * @param {Keyring} keyring
   * @returns {Promise<Object>} A keyring display object, with type and accounts properties.
   */
  displayForKeyring(keyring, includeHidden = true): Promise<DisplayedKeryring> {
    const hiddenAddresses = preference.getHiddenAddresses();
    const accounts: Promise<({ address: string; brandName: string } | string)[]> =
      keyring.getAccountsWithBrand ? keyring.getAccountsWithBrand() : keyring.getAccounts();

    return accounts.then((accounts) => {
      const allAccounts = accounts.map((account) => ({
        address: normalizeAddress(typeof account === 'string' ? account : account.address),
        brandName: typeof account === 'string' ? keyring.type : account.brandName,
      }));

      return {
        type: keyring.type,
        accounts: includeHidden
          ? allAccounts
          : allAccounts.filter(
              (account) =>
                !hiddenAddresses.find(
                  (item) =>
                    item.type === keyring.type &&
                    item.address.toLowerCase() === account.address.toLowerCase()
                )
            ),
        keyring,
      };
    });
  }

  getAllTypedAccounts(): Promise<DisplayedKeryring[]> {
    return Promise.all(this.keyring.map((keyring) => this.displayForKeyring(keyring)));
  }

  async getAllTypedVisibleAccounts(): Promise<DisplayedKeryring[]> {
    const keyrings = await Promise.all(
      this.keyring.map((keyring) => this.displayForKeyring(keyring, false))
    );

    return keyrings.filter((keyring) => keyring.accounts.length > 0);
  }

  async getAllVisibleAccountsArray() {
    const typedAccounts = await this.getAllTypedVisibleAccounts();
    const result: { address: string; type: string; brandName: string }[] = [];
    typedAccounts.forEach((accountGroup) => {
      result.push(
        ...accountGroup.accounts.map((account) => ({
          address: account.address,
          brandName: account.brandName,
          type: accountGroup.type,
        }))
      );
    });

    return result;
  }

  async resetKeyRing() {
    await this.clearKeyrings();
    await this.clearVault();
  }

  /**
   * Clear Keyrings
   *
   * Deallocates all currently managed keyrings and accounts.
   * Used before initializing a new vault.
   */

  async clearKeyrings(): Promise<void> {
    // clear keyrings from memory
    this.keyring = [];
    this.memStore.updateState({
      keyrings: [],
    });
  }

  /**
   * Clear the Vault
   *
   * Clears the vault from the store's state, effectively removing all stored data.
   */
  async clearVault(): Promise<void> {
    // Clear the vault data in the store's state
    this.store.updateState({ vault: [] });
  }

  /**
   * Update Memstore Keyrings
   *
   * Updates the in-memory keyrings, without persisting.
   */
  async _updateMemStoreKeyrings(): Promise<void> {
    const keyrings = await Promise.all(
      this.keyring.map((keyring) => this.displayForKeyring(keyring))
    );
    return this.memStore.updateState({ keyrings });
  }

  /**
   * Unlock Keyrings
   *
   * Unlocks the keyrings.
   *
   * @emits KeyringController#unlock
   */
  setUnlocked(): void {
    this.memStore.updateState({ isUnlocked: true });
    this.emit('unlock');
  }

  loadStore(initState) {
    this.store = new SimpleStore(initState || { booted: false });
    return this.store.subscribe((value) => storage.set('keyringState', value));
  }

  async decryptVaultArray(vaultArray, password) {
    const decryptedKeyrings: any = [];

    for (const entry of vaultArray) {
      const id = Object.keys(entry)[0]; // Get UUID
      const encryptedData = entry[id];

      try {
        // Decrypt the entry
        const decryptedData = await this.encryptor.decrypt(password, encryptedData);

        // Store in keyrings array with ID
        decryptedKeyrings.push({
          id,
          ...decryptedData, // Contains keyring data
        });
      } catch (err) {
        // maybe update the password for the keyring
        console.error(`Failed to decrypt entry ${id}:`, err);
      }
    }

    // Store in keyrings array
    this.keyringList = decryptedKeyrings;
  }
}

export default new KeyringService();
