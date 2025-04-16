/// fork from https://github.com/MetaMask/KeyringController/blob/master/index.js

import { EventEmitter } from 'events';

import * as bip39 from 'bip39';
import encryptor from 'browser-passworder';
import * as ethUtil from 'ethereumjs-util';
import log from 'loglevel';

import { normalizeAddress } from '@/background/utils';
import {
  pkTuple2PubKey,
  formPubKeyTuple,
  seedWithPathAndPhrase2PublicPrivateKey,
} from '@/background/utils/modules/publicPrivateKey';
import i18n from '@/i18n';
import {
  combinePubPkTuple,
  type PublicPrivateKeyTuple,
  type PrivateKeyTuple,
  type PublicKeyTuple,
} from '@/shared/types/key-types';
import {
  KEYRING_DEEP_VAULT_KEY,
  KEYRING_STATE_CURRENT_KEY,
  KEYRING_STATE_VAULT_V1,
  KEYRING_STATE_VAULT_V2,
  type VaultEntryV2,
  type KeyringStateV2,
  KEYRING_STATE_V2_KEY,
  KEYRING_STATE_V1_KEY,
  CURRENT_ID_KEY,
} from '@/shared/types/keyring-types';
import { type LoggedInAccount } from '@/shared/types/wallet-types';
import { FLOW_BIP44_PATH } from '@/shared/utils/algo-constants';
import { returnCurrentProfileId } from '@/shared/utils/current-id';
import storage from '@/shared/utils/storage';
import { KEYRING_TYPE } from 'consts';

import preference from '../preference';

import { HDKeyring, type HDKeyringType, type HDKeyringData } from './hdKeyring';
import { type SimpleKeyPairType, SimpleKeyring, type SimpleKeyringData } from './simpleKeyring';

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

interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
}
interface VaultEntryV1 {
  [uuid: string]: string;
}
// Handle old vault entries
type CompatibleVaultEntry = string | VaultEntryV1 | null;

type KeyringStateV1 = {
  booted: string;
  vault: CompatibleVaultEntry[];
};

export type KeyringType = HDKeyringType | SimpleKeyPairType;
export type Keyring = SimpleKeyring | HDKeyring;

type KeyringKeyData = HDKeyringData | SimpleKeyringData;

interface KeyringData {
  decryptedData: KeyringKeyData[];
  id: string;
}

export type RetrievePkResult = {
  index: number;
  keyType: 'publicKey' | 'mnemonic' | 'privateKey';
  value: string;
};

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
  private keyringTypes: (typeof SimpleKeyring | typeof HDKeyring)[];
  private store!: SimpleStore<KeyringStateV2>;
  private memStore: SimpleStore<MemStoreState>;
  private currentKeyring: Keyring[];
  private keyringList: KeyringData[];
  private encryptor: typeof encryptor = encryptor;

  constructor() {
    super();
    this.keyringTypes = Object.values(KEYRING_SDK_TYPES);
    this.store = new SimpleStore<KeyringStateV2>({ booted: '', vault: [], vaultVersion: 2 });
    this.memStore = new SimpleStore<MemStoreState>({
      isUnlocked: false,
      keyringTypes: this.keyringTypes.map((krt) => krt.type),
      keyrings: [],
      preMnemonics: '',
    });
    this.currentKeyring = [];
    this.keyringList = [];
  }

  /**
   * Boot the keyring
   * create a new clean keyring with a new password
   * @param {string} password - The password used to unlock the keyring
   */
  async boot(password: string) {
    const encryptBooted = await this.encryptor.encrypt(password, 'true');
    this.store.updateState({ booted: encryptBooted });
    this.memStore.updateState({ isUnlocked: true });
  }

  async update(password: string) {
    const encryptBooted = await this.encryptor.encrypt(password, 'true');
    this.store.updateState({ booted: encryptBooted });
  }
  /**
   * Get keyring ids
   * @returns {Promise<string[]>} The keyring ids
   */
  getKeyringIds = async (): Promise<string[]> => {
    const keyringIds = this.keyringList.map((keyring) => keyring.id);
    return keyringIds;
  };

  /**
   * Ensure valid currentId
   * @param currentId - The id of the keyring to switch to.
   * @returns {Promise<string>} The currentId
   */
  ensureValidKeyringId = async (id: string | null): Promise<string> => {
    const keyringIds = await this.getKeyringIds();
    if (keyringIds.length === 0) {
      throw new Error('KeyringController - No keyrings found');
    }
    if (!id || !keyringIds.includes(id)) {
      // Data has been corrupted somehow. Switch to the first keyring
      const firstKeyringId = keyringIds[0];
      return firstKeyringId;
    }
    return id;
  };
  /**
   * Get the private key from the current keyring
   * @returns {Promise<string>} The private key as a hex string
   * @throws {Error} If no private key is found
   */
  getKeyringPrivateKeyTuple = async (keyrings: Keyring[]): Promise<PrivateKeyTuple> => {
    for (const keyring of keyrings) {
      if (keyring instanceof SimpleKeyring) {
        // If a private key is found, extract it and break the loop
        const privateKey = keyring.wallets[0].privateKey.toString('hex');
        if (privateKey) {
          return {
            P256: { pk: privateKey },
            SECP256K1: { pk: privateKey },
          };
        }
      } else if (keyring instanceof HDKeyring) {
        // Get a copy of the keyring data
        const serialized = await keyring.serialize();
        if (serialized.mnemonic) {
          // If mnemonic is found, derive the private key
          const privateKeyTuple = await seedWithPathAndPhrase2PublicPrivateKey(
            serialized.mnemonic,
            serialized.derivationPath,
            serialized.passphrase
          );
          return privateKeyTuple;
        }
      } else if (
        (keyring as any).wallets &&
        (keyring as any).wallets.length > 0 &&
        (keyring as any).wallets[0].privateKey
      ) {
        // If a private key is found, extract it and break the loop
        const privateKey = (keyring as any).wallets[0].privateKey.toString('hex');
        if (privateKey) {
          return {
            P256: { pk: privateKey },
            SECP256K1: { pk: privateKey },
          };
        }
      }
    }
    throw new Error('No private key found in any of the keyrings.');
  };
  /**
   * Get the private key tuple from the current keyring
   * @returns {Promise<PrivateKeyTuple>} The private key tuple
   * @throws {Error} If no private key is found
   */
  getCurrentPrivateKeyTuple = async (): Promise<PrivateKeyTuple> => {
    return this.getKeyringPrivateKeyTuple(this.currentKeyring);
  };

  /**
   * Get the public key tuple from the current keyring
   * @returns {Promise<PublicPrivateKeyTuple>} The public key tuple
   */
  getKeyringPublicPrivateKeyTuple = async (keyrings: Keyring[]): Promise<PublicPrivateKeyTuple> => {
    try {
      // Get the private key
      const privateKeyTuple = await this.getKeyringPrivateKeyTuple(keyrings);
      // Generate public key tuple from private key
      const pubKTuple = await pkTuple2PubKey(privateKeyTuple);
      return combinePubPkTuple(pubKTuple, privateKeyTuple);
    } catch (error) {
      console.error('Failed to get public key tuple');
      throw error;
    }
  };
  /**
   * Get the public private key tuple from the current keyring
   * @returns {Promise<PublicPrivateKeyTuple>} The public private key tuple
   */
  getCurrentPublicPrivateKeyTuple = async (): Promise<PublicPrivateKeyTuple> => {
    return this.getKeyringPublicPrivateKeyTuple(this.currentKeyring);
  };
  /**
   * Get the public key tuple from the current keyring
   * @returns {Promise<PublicKeyTuple>} The public key tuple
   */
  getKeyringPublicKeyTuple = async (keyrings: Keyring[]): Promise<PublicKeyTuple> => {
    return formPubKeyTuple(await this.getKeyringPublicPrivateKeyTuple(keyrings));
  };
  /**
   * Get the public key tuple from the current keyring
   * @returns {Promise<PublicKeyTuple>} The public key tuple
   */
  getCurrentPublicKeyTuple = async (): Promise<PublicKeyTuple> => {
    return this.getKeyringPublicKeyTuple(this.currentKeyring);
  };

  /**
   * Unlock Keyrings without emitting event because the new keyring is not added yet
   *
   */
  updateUnlocked = async (password: string): Promise<void> => {
    await this.verifyPassword(password);

    this.memStore.updateState({ isUnlocked: true });
  };

  isBooted() {
    return !!this.store.getState().booted;
  }

  hasVault() {
    return !!this.store.getState().vault;
  }

  isUnlocked() {
    return this.isBooted() && this.memStore.getState().isUnlocked;
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
   * @param {string} password - The password used to unlock the keyring
   * @param {string} privateKey - The privateKey to generate address
   * @returns {Promise<Keyring>} A Promise that resolves to the keyring.
   */
  async importPrivateKey(password: string, privateKey: string): Promise<Keyring> {
    // Verify the password
    await this.verifyPassword(password);
    // Clear the current keyrings as the new keyring will be a simple keyring
    await this.clearKeyrings();
    // Add the new keyring
    const keyring = await this.addNewKeyring(password, 'Simple Key Pair', [privateKey]);
    await this.persistAllKeyrings(password);
    await this.setUnlocked();
    await this.fullUpdate();
    return keyring;
  }

  /**
   * Import Keychain using Proxy publickey
   *
   * @emits KeyringController#unlock
   * @param {string} privateKey - The privateKey to generate address
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  async importPublicKey(password: string, key: string, seed: string): Promise<any> {
    // Verify the password
    await this.verifyPassword(password);
    // Clear the current keyrings as the new keyring will replace it
    await this.clearKeyrings();

    // Add new keyring and store reference
    const keyring = await this.addNewKeyring(password, 'HD Key Tree', {
      publicKey: key,
      mnemonic: seed,
      activeIndexes: [1],
    });

    // Get accounts from the keyring
    const accounts = await keyring.getAccounts();
    const [firstAccount] = accounts;

    // Validate first account exists
    if (!firstAccount) {
      throw new Error('KeyringController - First Account not found.');
    }

    // Persist, unlock and update
    await this.persistAllKeyrings(password);
    await this.setUnlocked();
    await this.fullUpdate();

    return keyring;
  }

  generateMnemonic(): string {
    return bip39.generateMnemonic();
  }

  async generatePreMnemonic(password: string): Promise<string> {
    // Make sure we're using the correct password
    await this.verifyPassword(password);
    const mnemonic = this.generateMnemonic();
    const preMnemonics = await this.encryptor.encrypt(password, mnemonic);
    this.memStore.updateState({ preMnemonics });

    return mnemonic;
  }

  getKeyringByType(type: string) {
    const keyring = this.currentKeyring.find((keyring) => keyring.type === type);

    return keyring;
  }

  removePreMnemonics() {
    this.memStore.updateState({ preMnemonics: '' });
  }

  async getPreMnemonics(password: string): Promise<any> {
    // Verify the password
    await this.verifyPassword(password);
    if (!this.memStore.getState().preMnemonics) {
      return '';
    }

    return await this.encryptor.decrypt(password, this.memStore.getState().preMnemonics);
  }

  /**
   * CreateNewVaultAndRestore Mnenoic
   *
   * Destroys any old encrypted storage,
   * creates a new HD wallet from the given seed with 1 account.
   *
   * @emits KeyringController#unlock
   * @param {string} seed - The BIP44-compliant seed phrase.
   * @returns {Promise<Keyring>} A Promise that resolves to the keyring.
   */
  async createKeyringWithMnemonics(
    password: string,
    seed: string,
    derivationPath = FLOW_BIP44_PATH,
    passphrase = ''
  ): Promise<Keyring> {
    // Verify the password
    await this.verifyPassword(password);
    // Validate mnemonic first
    if (!bip39.validateMnemonic(seed)) {
      throw new Error(i18n.t('mnemonic phrase is invalid'));
    }
    // Clear the current keyrings as the new keyring will replace it
    await this.clearKeyrings();

    // Create new keyring
    const keyring = await this.addNewKeyring(password, 'HD Key Tree', {
      mnemonic: seed,
      activeIndexes: [0],
      derivationPath,
      passphrase,
    });

    // Persist and update state
    await this.persistAllKeyrings(password);
    await this.setUnlocked();
    await this.fullUpdate();

    return keyring;
  }

  async addKeyring(password: string, keyring: SimpleKeyring | HDKeyring): Promise<Keyring> {
    // Get accounts and check for duplicates
    const accounts = await keyring.getAccounts();
    await this.checkForDuplicate(keyring.type, accounts);

    // Add keyring to current keyrings and persist
    this.currentKeyring.push(keyring);
    await this.persistAllKeyrings(password);

    // Update memory store and state
    await this._updateMemStoreKeyrings();
    await this.fullUpdate();

    return keyring;
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
    this.memStore.updateState({ isUnlocked: false });
    // remove keyrings
    this.currentKeyring = [];
    this.keyringList = [];
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
    this.currentKeyring = [];
    await this._updateMemStoreKeyrings();
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

    this.currentKeyring = await this.unlockKeyrings(password);
    this.setUnlocked();

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
   * @param {string} password - The password to use to persist the keyring.
   * @param {string} type - The type of keyring to add.
   * @param {Object} opts - The constructor options for the keyring.
   * @returns {Promise<Keyring>} The new keyring.
   */
  addNewKeyring(password: string, type: KeyringType, opts?: unknown): Promise<Keyring> {
    const KeyringClass = this.getKeyringClassForType(type);
    if (!KeyringClass) {
      throw new Error(`Keyring type ${type} not found`);
    }
    const keyring = new KeyringClass(opts as typeof KeyringClass.arguments);
    return this.addKeyring(password, keyring);
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
      this.currentKeyring.map(async (keyring) => {
        const accounts = await keyring.getAccounts();
        if (accounts.length > 0) {
          validKeyrings.push(keyring);
        }
      })
    );
    this.currentKeyring = validKeyrings;
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
   * @param {string} password - The password to use to persist the keyring.
   * @param {Keyring} selectedKeyring - The currently selected keyring.
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  async addNewAccount(password: string, selectedKeyring: any): Promise<string[]> {
    await this.verifyPassword(password);
    // Add accounts and get result
    const accounts = await selectedKeyring.addAccounts(1);

    // Emit events for each new account
    accounts.forEach((hexAccount) => {
      this.emit('newAccount', hexAccount);
    });

    // Persist and update state
    await this.persistAllKeyrings(password);
    await this._updateMemStoreKeyrings();
    await this.fullUpdate();

    return accounts;
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
   * @param {string} password - The password to use to persist the keyring.
   * @param {string} address - The address of the account to remove.
   * @param {string} type - The type of keyring to remove the account from.
   * @param {string} brand - The brand of the keyring to remove the account from.
   * @returns {Promise<void>} A Promise that resolves if the operation was successful.
   */
  async removeAccount(
    password: string,
    address: string,
    type: string,
    brand?: string
  ): Promise<any> {
    // Verify the password
    await this.verifyPassword(password);
    const keyring = await this.getKeyringForAccount(address, type);

    // Not all the keyrings support this, so we have to check
    if (typeof keyring.removeAccount !== 'function') {
      throw new Error(`Keyring ${keyring.type} doesn't support account removal operations`);
    }

    keyring.removeAccount(address, brand);
    this.emit('removedAccount', address);

    const accounts = await keyring.getAccounts();

    // Check if this was the last/only account
    if (accounts.length === 0) {
      await this.removeEmptyKeyrings();
    }

    await this.persistAllKeyrings(password);
    await this._updateMemStoreKeyrings();
    await this.fullUpdate();
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
  createFirstKeyTree(password: string) {
    this.clearKeyrings();
    return this.addNewKeyring(password, 'HD Key Tree', { activeIndexes: [0] })
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
   * @param {string} password - The password to use to persist the keyring.
   * @returns {Promise<boolean>} Resolves to true once keyrings are persisted.
   */
  async persistAllKeyrings(password: string): Promise<boolean> {
    // Check we're using the correct password
    await this.verifyPassword(password);
    // Serialize the current keyrings.
    const serializedKeyrings: KeyringKeyData[] = await Promise.all(
      this.currentKeyring.map(async (keyring) => keyring.serializeWithType())
    );

    // Encrypt the list of serialized keyrings. encryptedString = KeyringKeyData[]
    const encryptedString = await this.encryptor.encrypt(password, serializedKeyrings);

    // Get current ID and vaults
    const currentId = await storage.get(CURRENT_ID_KEY);
    const vaultArray = this.store.getState().vault || [];

    if (currentId === null || currentId === undefined) {
      throw new Error('KeyringController - currentId is not provided');
    }

    // Find existing entries
    const vaultArrayAccountIndex = vaultArray.findIndex((entry) => entry.id === currentId);

    // Update or add to vault array
    if (vaultArrayAccountIndex !== -1 && vaultArray[vaultArrayAccountIndex]) {
      vaultArray[vaultArrayAccountIndex].encryptedData = encryptedString;
    } else {
      const newEntry = { id: currentId, encryptedData: encryptedString };
      vaultArray.push(newEntry);
    }
    // Save the updated vault array to the state
    this.store.updateState({ vault: vaultArray });

    // NOTE: We could just add the decrypted serialized keyrings to the decrypted vault array, but we'll do it this way for now
    await this.decryptVaultArray(vaultArray, password);

    return true;
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
    let vaultArray = this.store.getState().vault;

    // Ensure vaultArray is an array and filter out null/undefined entries
    vaultArray = Array.isArray(vaultArray) ? vaultArray.filter(Boolean) : [vaultArray];

    await this.decryptVaultArray(vaultArray, password);

    if (this.store.getState().vaultVersion !== KEYRING_STATE_VAULT_V2) {
      await this.encryptVaultArray(this.keyringList, password);
    }

    // Validate currentId

    // Note that currentAccountIndex is only used in keyring for old accounts that don't have an id stored in the keyring removing in 2.7.6
    // currentId always takes precedence
    const currentId = await returnCurrentProfileId();
    // Validate the currentId to ensure it's a valid keyring id (Note switchKeyring also does this)
    const validCurrentId = await this.ensureValidKeyringId(currentId);
    // switch to the keyring with the currentId
    const keyrings = await this.switchKeyring(validCurrentId);

    // Return the current keyring
    return keyrings;
  }

  /**
   * Switch Keyrings
   *
   * Attempts to switch the keyring based on the given id,
   * Set the new keyring to ram.
   *
   * @param {string} id - The id of the keyring to switch to.
   * @returns {Promise<Array<Keyring>>} The keyring.
   */
  async switchKeyring(id: string): Promise<Keyring[]> {
    // Ensure the id is valid
    const validKeyringId = await this.ensureValidKeyringId(id);
    // Find the keyring in the keyringList
    const selectedKeyringIndex = this.keyringList.findIndex(
      (keyring) => keyring.id === validKeyringId
    );
    // If the keyring is not found, throw an error
    if (selectedKeyringIndex === -1) {
      throw new Error(
        'somehow the keyring is not found in the keyringList when we have a valid id'
      );
    }
    const selectedKeyring = this.keyringList[selectedKeyringIndex];
    if (!selectedKeyring || !selectedKeyring.decryptedData) {
      throw new Error('KeyringController - selectedKeyring invalid');
    }
    // remove the keyring of the previous account
    await this.clearKeyrings();
    // Restore the keyring
    await this._restoreKeyring(selectedKeyring.decryptedData[0]);

    await this._updateMemStoreKeyrings();
    // Return the current keyring
    return this.currentKeyring;
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

  async retrievePk(password: string): Promise<RetrievePkResult[]> {
    // Verify the password
    await this.verifyPassword(password);
    // Extract the private key and mnemonic from the decrypted vault
    const extractedData = this.keyringList.map((entry, index): RetrievePkResult => {
      const keyringKeyData = entry.decryptedData[0];

      if (keyringKeyData.type === 'HD Key Tree') {
        // Active index tells us if the key is a public key or a mnemonic
        if (keyringKeyData.data.activeIndexes[0] === 1) {
          return {
            index,
            keyType: 'publicKey',
            value: keyringKeyData.data.publicKey || '',
          };
        }
        return {
          index,
          keyType: 'mnemonic',
          value: keyringKeyData.data.mnemonic || '',
        };
      } else if (keyringKeyData.type === 'Simple Key Pair') {
        return {
          index,
          keyType: 'privateKey',
          value: keyringKeyData.data[0],
        };
      }
      throw new Error(`Unsupported keyring type`);
    });

    return extractedData;
  }

  /**
   * Reveal the decrypted data from vault
   *
   * Doesn't unlock the keyrings or save it to the state
   * Return all the privatekey stored in vault.
   *
   * @param {string} password - The keyring controller password.
   * @returns {Promise<Array<Keyring>>} The keyrings.
   */

  async revealKeyring(password: string): Promise<KeyringData[]> {
    try {
      await this.verifyPassword(password);
    } catch (error) {
      throw new Error('Authentication failed. Please check your password and try again.');
    }

    let vaultArray = this.store.getState().vault;
    if (!vaultArray) {
      throw new Error('No vault data found');
    }
    vaultArray = Array.isArray(vaultArray) ? vaultArray.filter(Boolean) : [vaultArray];

    const extractedData = await this.revealVaultArray(vaultArray, password);

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
  async _restoreKeyring(serialized: KeyringKeyData): Promise<Keyring> {
    const { type, data } = serialized;
    const KeyringClass = this.getKeyringClassForType(type);
    if (!KeyringClass) {
      throw new Error(`Keyring type ${type} not found`);
    }
    const keyring = new KeyringClass();

    // For HD Key Tree, initialize with just the mnemonic and indexes
    if (type === 'HD Key Tree' && data) {
      await (keyring as HDKeyring).deserialize({
        mnemonic: (data.mnemonic as string) || '',
        activeIndexes: (data.activeIndexes as number[]) || [0],
        derivationPath: data.derivationPath || FLOW_BIP44_PATH,
        passphrase: data.passphrase || '',
      });
    } else {
      await (keyring as SimpleKeyring).deserialize(data as string[]);
    }

    await keyring.getAccounts();
    this.currentKeyring.push(keyring);
    return keyring;
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
  getKeyringClassForType(type: KeyringType) {
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
    return this.currentKeyring.filter((keyring) => keyring.type === type);
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
    const keyrings = this.currentKeyring || [];
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
   * @returns {Promise<Array<Keyring>>} The array of keyrings.
   */
  async getKeyring(): Promise<Keyring[]> {
    const keyrings = this.currentKeyring || [];
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
    let keyrings = type
      ? this.currentKeyring.filter((keyring) => keyring.type === type)
      : this.currentKeyring;
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
    return Promise.all(this.currentKeyring.map((keyring) => this.displayForKeyring(keyring)));
  }

  async getAllTypedVisibleAccounts(): Promise<DisplayedKeryring[]> {
    const keyrings = await Promise.all(
      this.currentKeyring.map((keyring) => this.displayForKeyring(keyring, false))
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
    await this.clearKeyringList();
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
    this.currentKeyring = [];
    this.memStore.updateState({
      keyrings: [],
    });
  }

  /**
   * Clear Keyring list
   *
   * Deallocates all decrypted keyringList in state.
   *
   */

  async clearKeyringList(): Promise<void> {
    // clear keyringList from state
    this.keyringList = [];
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
      this.currentKeyring.map((keyring) => this.displayForKeyring(keyring))
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
  private setUnlocked(): void {
    this.memStore.updateState({ isUnlocked: true });
    this.emit('unlock');
  }

  private loadStore(initState) {
    this.store = new SimpleStore(initState || { booted: false });
    // Any changes to the store will be saved to storage
    return this.store.subscribe((value) => storage.set(KEYRING_STATE_CURRENT_KEY, value));
  }

  async loadKeyringStore() {
    const keyringState = await this.loadKeyringStateV2();
    return this.loadStore(keyringState);
  }

  private isValidKeyringKeyDataArray(data: any): data is KeyringKeyData[] {
    return (
      Array.isArray(data) &&
      data.every(
        (item) => typeof item === 'object' && typeof item.type === 'string' && 'data' in item
      )
    );
  }

  /**
   * Only reveal the decrypted data for user to retrieve when login fail
   *
   * Doesn't unlock the keyrings
   *
   */
  private async revealVaultArray(
    vaultArray: VaultEntryV2[],
    password: string
  ): Promise<KeyringData[]> {
    const decryptedKeyrings: KeyringData[] = [];

    for (const entry of vaultArray) {
      try {
        // Validate entry is a proper object
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          console.error('Invalid vault entry format');
          continue;
        }

        const id = entry.id;
        const encryptedData = entry.encryptedData;

        if (!encryptedData) {
          console.error(`No encrypted data found for entry with ID ${id}`);
          continue;
        }

        const decryptedData = await this.encryptor.decrypt(password, encryptedData);

        if (!this.isValidKeyringKeyDataArray(decryptedData)) {
          throw new Error('Invalid keyring data format');
        }

        const keyringData = {
          id,
          decryptedData: decryptedData,
        };
        decryptedKeyrings.push(keyringData);
      } catch (err) {
        // Don't print the error as it may contain sensitive data
        console.error(`Failed to process vault entry`);
        // Continue with next entry
      }
    }
    return decryptedKeyrings;
  }

  private async decryptVaultArray(vaultArray: VaultEntryV2[], password: string): Promise<void> {
    const decryptedKeyrings: KeyringData[] = [];

    for (const entry of vaultArray) {
      try {
        // Validate entry is a proper object
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          console.error('Invalid vault entry format');
          continue;
        }

        const id = entry.id;
        const encryptedData = entry.encryptedData;

        if (!encryptedData) {
          console.error(`No encrypted data found for entry with ID ${id}`);
          continue;
        }

        // Decrypt the entry
        // encryptedString = KeyringKeyData[]
        const decryptedData = (await this.encryptor.decrypt(
          password,
          encryptedData
        )) as unknown as KeyringKeyData[];
        let keyringData = {
          id,
          decryptedData: decryptedData,
        };
        // this returns an array of KeyringKeyDataV2
        if (this.store.getState().vaultVersion === KEYRING_STATE_VAULT_V1) {
          // Looking up the derivation path and passphrase
          keyringData = await this.translateVaultV1toV2(keyringData);
        }

        decryptedKeyrings.push(keyringData);
      } catch (err) {
        // Don't print the error as it may contain sensitive data
        console.error(`Failed to process vault entry`);
        // Continue with next entry
      }
    }
    // Update the keyringList
    this.keyringList = decryptedKeyrings;
  }

  private async encryptVaultArray(vaultArray: KeyringData[], password: string): Promise<void> {
    const encryptedVaultArray: VaultEntryV2[] = [];

    for (const keyring of vaultArray) {
      const serializedKeyringData: KeyringKeyData[] = keyring.decryptedData;
      // encryptedString = KeyringKeyData[]
      const encryptedData = await this.encryptor.encrypt(password, serializedKeyringData);
      encryptedVaultArray.push({
        id: keyring.id,
        encryptedData,
      });
    }
    this.store.updateState({
      vault: encryptedVaultArray,
      vaultVersion: KEYRING_STATE_VAULT_V2,
    });
  }

  private async checkVaultId(vaultArray: CompatibleVaultEntry[]): Promise<VaultEntryV2[]> {
    const deepVault: CompatibleVaultEntry[] = (await storage.get(KEYRING_DEEP_VAULT_KEY)) || [];
    const loggedInAccounts: LoggedInAccount[] = (await storage.get('loggedInAccounts')) || [];

    // Process vault entries to fix missing IDs
    const updatedVaultArray = vaultArray.map((entry, index): VaultEntryV2 | null => {
      // Return null for any entries that are not an object
      if (!entry) return null;

      if (typeof entry === 'string') {
        // First try to find ID in deepVault
        const deepVaultEntry = deepVault.find((deepVaultEntry) => {
          if (!deepVaultEntry || typeof deepVaultEntry !== 'object') return false;
          const values = Object.values(deepVaultEntry);
          const encryptedData = values[0];
          if (!encryptedData) return false;
          return entry === encryptedData;
        });

        if (deepVaultEntry) {
          const keys = Object.keys(deepVaultEntry);
          const id = keys[0];
          const newEntry: VaultEntryV2 = { id, encryptedData: entry };
          console.log(`Fixed string entry by adding ID ${id} from deepVault`);
          return newEntry;
        }

        // If deepVault matching failed, try to use ID from loggedInAccounts based on index
        if (loggedInAccounts && loggedInAccounts[index] && loggedInAccounts[index].id) {
          const accountId = loggedInAccounts[index].id;
          const newEntry = { id: accountId, encryptedData: entry };
          console.log(
            `Fixed string entry by adding ID ${accountId} from loggedInAccounts at index ${index}`
          );
          return newEntry;
        }

        // TODO: If no matching ID is found, then we 'could' decrypt the entry and use loginV3Api to get the ID
        // Handle through support. This isn't worth the effort. We won't update this old vault so it will still be there.

        console.log('Could not find matching ID for string entry');
        return null;
      }
      // If the entry is an object, we can just map the values to the new format
      const [id, encryptedData] = Object.entries(entry)[0];
      return { id, encryptedData };
    });

    // Filter out null entries
    const filteredUpdatedVaultArray: VaultEntryV2[] = updatedVaultArray.filter(
      (entry) => entry !== null
    );

    return filteredUpdatedVaultArray;
  }

  async checkAvailableAccount(currentId: string): Promise<VaultEntryV2[]> {
    const vaultArray = this.store.getState().vault;

    // Check if an entry with the given currentId exists
    const foundEntry = vaultArray.find((entry) => entry.id === currentId);

    if (foundEntry) {
      console.log('Found account with ID:', currentId);
      await storage.set(CURRENT_ID_KEY, currentId);
      try {
        const encryptedDataString = foundEntry[currentId];
        const encryptedData = JSON.parse(encryptedDataString) as EncryptedData;

        // Validate that it has the expected structure
        if (!encryptedData.data || !encryptedData.iv || !encryptedData.salt) {
          console.warn('Encrypted data is missing required fields');
        }
      } catch (error) {
        console.error('Error parsing encrypted data:', error);
      }

      return [foundEntry];
    } else {
      throw new Error('No account found with ID: ' + currentId);
    }
  }

  // ---------------------------------------------------------------------------
  // Translation & Migration
  // ---------------------------------------------------------------------------
  // There's two parts to this - loading the data from storage in the right format
  // and then saving the data in the right format
  //
  // Before unlock we load the data, translate it to the right format
  // After unlock we save the data in the right format

  // Current version
  private async loadKeyringStateV2(): Promise<KeyringStateV2 | null> {
    const keyringState = await storage.get(KEYRING_STATE_V2_KEY);
    if (!keyringState) {
      return await this.translateFromKeyringStateV1();
    }
    return keyringState;
  }
  // Version 1
  private async translateFromKeyringStateV1(): Promise<KeyringStateV2 | null> {
    // Version 1 - if nothing exists in the store, use deepVault
    const keyringState = await this.loadKeyringStateV1();
    if (!keyringState) {
      return null;
    }

    // Translate the vault
    // We need to make sure we have valid ids for each entry
    const translatedVault = await this.checkVaultId(keyringState.vault);
    return {
      booted: keyringState.booted,
      vault: translatedVault,
      vaultVersion: 1,
    };
  }
  // Version 1
  private async loadKeyringStateV1(): Promise<KeyringStateV1 | null> {
    const keyringState = await storage.get(KEYRING_STATE_V1_KEY);
    if (!keyringState) {
      return null;
    }
    if (!keyringState.vault) {
      return {
        ...keyringState,
        vault: await this.translateFromDeepVault(),
      };
    }
    return keyringState;
  }

  // Version 0
  private async translateFromDeepVault(): Promise<CompatibleVaultEntry[] | null> {
    // Version 1 - if nothing exists in the store, use deepVault
    const deepVault = await storage.get(KEYRING_DEEP_VAULT_KEY);
    if (!deepVault) {
      return null;
    }
    return deepVault;
  }

  // Vault Translation
  // Translate decrypted vault data to the new format
  private async translateVaultV1toV2(keyringDataV1: KeyringData): Promise<KeyringData> {
    // Get the logged in accounts
    const loggedInAccounts: LoggedInAccount[] = (await storage.get('loggedInAccounts')) || [];

    const keyringId = keyringDataV1.id;
    const keyringDataV2: KeyringKeyData[] = await Promise.all(
      keyringDataV1.decryptedData.map(async (keyringDataV1): Promise<KeyringKeyData> => {
        const keyringDataType = keyringDataV1.type;
        if (keyringDataType === 'Simple Key Pair') {
          return keyringDataV1;
        }
        if (keyringDataType === 'HD Key Tree') {
          // Figure out the derivation path from storage
          const accountIndex = loggedInAccounts.findIndex((account) => account.id === keyringId);
          let derivationPath = FLOW_BIP44_PATH;
          let passphrase = '';
          if (accountIndex !== -1) {
            derivationPath = (await storage.get(`user${accountIndex}_path`)) ?? FLOW_BIP44_PATH;
            passphrase = (await storage.get(`user${accountIndex}_phrase`)) ?? '';
          }
          return {
            type: keyringDataType,
            data: {
              mnemonic: keyringDataV1.data.mnemonic || '',
              activeIndexes: keyringDataV1.data.activeIndexes || [0],
              publicKey: keyringDataV1.data.publicKey || '',
              derivationPath,
              passphrase,
            },
          };
        }

        // Unsupported keyring type
        throw new Error('Unsupported keyring type');
      })
    );
    return {
      id: keyringId,
      decryptedData: keyringDataV2,
    };
  }
}

export default new KeyringService();
