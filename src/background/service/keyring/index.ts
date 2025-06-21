/// fork from https://github.com/MetaMask/KeyringController/blob/master/index.js

import { EventEmitter } from 'events';

import * as bip39 from 'bip39';
import encryptor from 'browser-passworder';
import * as ethUtil from 'ethereumjs-util';

import { normalizeAddress } from '@/background/utils';
import { pubKeyAccountToAccountKey, defaultAccountKey } from '@/background/utils/account-key';
import { getAccountsByPublicKeyTuple } from '@/background/utils/modules/findAddressWithPubKey';
import {
  pkTuple2PubKey,
  formPubKeyTuple,
  seedWithPathAndPhrase2PublicPrivateKey,
  getPublicKeyFromPrivateKey,
} from '@/background/utils/modules/publicPrivateKey';
import i18n from '@/i18n';
import {
  combinePubPkTuple,
  type PublicPrivateKeyTuple,
  type PrivateKeyTuple,
  type PublicKeyTuple,
  type PublicPrivateKey,
} from '@/shared/types/key-types';
import {
  KEYRING_DEEP_VAULT_KEY,
  KEYRING_STATE_CURRENT_KEY,
  KEYRING_STATE_VAULT_V1,
  KEYRING_STATE_VAULT_V2,
  type VaultEntryV2,
  type KeyringState,
  KEYRING_STATE_V2_KEY,
  KEYRING_STATE_V1_KEY,
  CURRENT_ID_KEY,
  KEYRING_STATE_VAULT_V3,
  type VaultEntryV3,
  KEYRING_STATE_V3_KEY,
} from '@/shared/types/keyring-types';
import { type LoggedInAccount } from '@/shared/types/wallet-types';
import {
  FLOW_BIP44_PATH,
  SIGN_ALGO_NUM_ECDSA_P256,
  SIGN_ALGO_NUM_ECDSA_secp256k1,
} from '@/shared/utils/algo-constants';
import { consoleError, consoleInfo, consoleWarn } from '@/shared/utils/console-log';
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

type MemStoreState = {
  isUnlocked: boolean;
};

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

type EncryptedData = {
  data: string;
  iv: string;
  salt: string;
};
type VaultEntryV1 = {
  [uuid: string]: string;
};
// Handle old vault entries
type CompatibleVaultEntry = string | VaultEntryV1 | null;

type KeyringStateV1 = {
  booted: string;
  vault: CompatibleVaultEntry[];
};

export type KeyringType = HDKeyringType | SimpleKeyPairType;
export type Keyring = SimpleKeyring | HDKeyring;

type DecryptedKeyDataV2 = HDKeyringData | SimpleKeyringData;

type DecryptedKeyringV2 = {
  id: string;
  decryptedData: DecryptedKeyDataV2[];
};

type DecryptedKeyringV3 = {
  id: string;
  publicKey: string;
  signAlgo: number;
  decryptedData: DecryptedKeyDataV2[];
};

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
  private store!: SimpleStore<KeyringState>;
  private memStore: SimpleStore<MemStoreState>;
  private currentKeyring: Keyring[];
  private currentPublicKey: string | undefined;
  private currentSignAlgo: number | undefined;
  private decryptedKeyrings: DecryptedKeyringV3[];
  private encryptor: typeof encryptor = encryptor;

  constructor() {
    super();
    this.keyringTypes = Object.values(KEYRING_SDK_TYPES);
    this.store = new SimpleStore<KeyringState>({
      booted: '',
      vault: [],
      vaultVersion: KEYRING_STATE_VAULT_V3,
    });
    this.memStore = new SimpleStore<MemStoreState>({
      isUnlocked: false,
    });
    this.currentKeyring = [];
    this.currentPublicKey = undefined;
    this.currentSignAlgo = undefined;
    this.decryptedKeyrings = [];
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
   * Get keyring public keys
   * @returns {Promise<string[]>} The keyring ids
   * @deprecated Use {@link getAllPublicKeys} instead and migrate to using public keys to refer to keyrings
   */
  getAllKeyringIds = async (): Promise<string[]> => {
    const keyringIds = this.decryptedKeyrings.map((keyring) => keyring.id);
    return keyringIds;
  };

  /**
   * Ensure valid currentId
   * @param currentId - The id of the keyring to switch to.
   * @returns {Promise<string>} The currentId
   * @deprecated Use {@link ensureValidKeyringPublicKey} instead and move profile ids out of keyring
   */
  ensureValidKeyringId = async (id: string | null): Promise<string> => {
    const keyringIds = await this.getAllKeyringIds();
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
   * Get keyring public keys
   * @returns {Promise<string[]>} The keyring public keys
   */
  getAllPublicKeys = async (): Promise<string[]> => {
    const keyringPublicKeys = this.decryptedKeyrings.map((keyring) => keyring.publicKey);
    return keyringPublicKeys;
  };

  /**
   * Ensure valid currentId
   * @param currentId - The id of the keyring to switch to.
   * @returns {Promise<string>} The currentId
   */
  ensureValidKeyringPublicKey = async (publicKey: string | null): Promise<string> => {
    const keyringPublicKeys = await this.getAllPublicKeys();
    if (keyringPublicKeys.length === 0) {
      throw new Error('KeyringController - No keyrings found');
    }
    if (!publicKey || !keyringPublicKeys.includes(publicKey)) {
      // Data has been corrupted somehow. Switch to the first keyring
      const firstKeyringPublicKey = keyringPublicKeys[0];
      return firstKeyringPublicKey;
    }
    return publicKey;
  };

  /**
   * Get the current sign algo
   * @returns {number} The current sign algo
   */
  getCurrentSignAlgo = (): number => {
    if (!this.isUnlocked()) {
      throw new Error('Keyring is not unlocked');
    }
    if (!this.currentSignAlgo) {
      throw new Error('Sign algo is not set');
    }
    return this.currentSignAlgo;
  };

  /**
   * Get the current public key
   * @returns {string} The current public key
   */
  getCurrentPublicKey = (): string => {
    if (!this.isUnlocked()) {
      throw new Error('Keyring is not unlocked');
    }
    if (!this.currentPublicKey) {
      throw new Error('Public key is not set');
    }
    return this.currentPublicKey;
  };

  /**
   * Get the current private key
   * @returns {Promise<string>} The current private key
   */
  getCurrentPrivateKey = async (): Promise<string> => {
    const pkTuple = await this.getKeyringPrivateKeyTuple(this.currentKeyring);
    switch (this.getCurrentSignAlgo()) {
      case SIGN_ALGO_NUM_ECDSA_secp256k1:
        return pkTuple.SECP256K1.pk;
      case SIGN_ALGO_NUM_ECDSA_P256:
        return pkTuple.P256.pk;
      default:
        throw new Error('Invalid sign algo');
    }
  };

  /**
   * Get the public private key from the current keyring
   * @returns {Promise<string>} The private key as a hex string
   * @throws {Error} If no private key is found
   */
  getKeyringPublicPrivateKey = async (
    signAlgo: number,
    keyring: Keyring
  ): Promise<PublicPrivateKey> => {
    if (keyring instanceof SimpleKeyring) {
      const privateKey = keyring.wallets[0].privateKey.toString('hex');
      const publicKey = await getPublicKeyFromPrivateKey(privateKey, signAlgo);
      return {
        publicKey,
        privateKey,
        signAlgo,
      };
    }
    if (keyring instanceof HDKeyring) {
      const serialized = await keyring.serialize();
      if (!serialized.mnemonic) {
        throw new Error('Mnemonic not found');
      }
      // If mnemonic is found, derive the private key
      const publicPrivateKeyTuple = await seedWithPathAndPhrase2PublicPrivateKey(
        serialized.mnemonic,
        serialized.derivationPath,
        serialized.passphrase
      );
      if (signAlgo === SIGN_ALGO_NUM_ECDSA_P256) {
        return {
          publicKey: publicPrivateKeyTuple.P256.pubK,
          privateKey: publicPrivateKeyTuple.P256.pk,
          signAlgo,
        };
      } else if (signAlgo === SIGN_ALGO_NUM_ECDSA_secp256k1) {
        return {
          publicKey: publicPrivateKeyTuple.SECP256K1.pubK,
          privateKey: publicPrivateKeyTuple.SECP256K1.pk,
          signAlgo,
        };
      } else {
        throw new Error('Invalid sign algo');
      }
    }

    // Invalid keyring type
    throw new Error('Invalid keyring type');
  };

  /**
   * Get the private key from the current keyring
   * @returns {Promise<string>} The private key as a hex string
   * @throws {Error} If no private key is found
   * @deprecated use {@link getKeyringPublicPrivateKey} instead
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
   * @deprecated use {@link getCurrentPublicKey} or {@link getCurrentPrivateKey} instead
   */
  getCurrentPrivateKeyTuple = async (): Promise<PrivateKeyTuple> => {
    return this.getKeyringPrivateKeyTuple(this.currentKeyring);
  };

  /**
   * Get the public key tuple from the current keyring
   * @returns {Promise<PublicPrivateKeyTuple>} The public key tuple
   */
  private getKeyringPublicPrivateKeyTuple = async (
    keyrings: Keyring[]
  ): Promise<PublicPrivateKeyTuple> => {
    try {
      // Get the private key
      const privateKeyTuple = await this.getKeyringPrivateKeyTuple(keyrings);
      // Generate public key tuple from private key
      const pubKTuple = await pkTuple2PubKey(privateKeyTuple);
      return combinePubPkTuple(pubKTuple, privateKeyTuple);
    } catch (error) {
      consoleError('Failed to get public key tuple');
      throw error;
    }
  };
  /**
   * Get the public private key tuple from the current keyring
   * @returns {Promise<PublicPrivateKeyTuple>} The public private key tuple
   * @deprecated use {@link getCurrentPublicKey} or {@link getCurrentPrivateKey} instead
   */
  getCurrentPublicPrivateKeyTuple = async (): Promise<PublicPrivateKeyTuple> => {
    return this.getKeyringPublicPrivateKeyTuple(this.currentKeyring);
  };
  /**
   * Get the public key tuple from the current keyring
   * @returns {Promise<PublicKeyTuple>} The public key tuple
   * @deprecated use {@link getKeyringPublicPrivateKey} instead
   */
  getKeyringPublicKeyTuple = async (keyrings: Keyring[]): Promise<PublicKeyTuple> => {
    return formPubKeyTuple(await this.getKeyringPublicPrivateKeyTuple(keyrings));
  };
  /**
   * Get the public key tuple from the current keyring
   * @returns {Promise<PublicKeyTuple>} The public key tuple
   * @deprecated use {@link getCurrentPublicKey} instead
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
  async importPrivateKey(
    publicKey: string,
    signAlgo: number,
    password: string,
    privateKey: string
  ): Promise<Keyring> {
    // Verify the password
    await this.verifyOrBoot(password);
    // Clear the current keyrings as the new keyring will be a simple keyring
    await this.clearCurrentKeyring();
    // Add the new keyring
    const keyring = await this.addNewKeyring(publicKey, signAlgo, password, 'Simple Key Pair', [
      privateKey,
    ]);
    await this.persistAllKeyrings(password);
    await this.setUnlocked();
    await this.fullUpdate();
    return keyring;
  }

  generateMnemonic(): string {
    return bip39.generateMnemonic();
  }

  getKeyringByType(type: string) {
    const keyring = this.currentKeyring.find((keyring) => keyring.type === type);

    return keyring;
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
    publicKey: string,
    signAlgo: number,
    password: string,
    seed: string,
    derivationPath = FLOW_BIP44_PATH,
    passphrase = ''
  ): Promise<Keyring> {
    // Verify the password
    await this.verifyOrBoot(password);
    // Validate mnemonic first
    if (!bip39.validateMnemonic(seed)) {
      throw new Error(i18n.t('mnemonic phrase is invalid'));
    }
    // Clear the current keyrings as the new keyring will replace it
    await this.clearCurrentKeyring();

    // Create new keyring
    const keyring = await this.addNewKeyring(publicKey, signAlgo, password, 'HD Key Tree', {
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

  async addKeyring(
    publicKey: string,
    signAlgo: number,
    password: string,
    keyring: SimpleKeyring | HDKeyring
  ): Promise<Keyring> {
    // Get accounts and check for duplicates
    if (this.currentPublicKey === publicKey) {
      throw new Error('Current public key or sign algo is already set');
    }

    // Add keyring to current keyrings and persist
    // Don't use push here because we want to replace the current keyring
    this.currentKeyring = [keyring];
    this.currentPublicKey = publicKey;
    this.currentSignAlgo = signAlgo;

    await this.persistAllKeyrings(password);

    // Update memory store and state
    await this.fullUpdate();

    return keyring;
  }

  /**
   * Lock
   * This method deallocates all secrets.
   *
   * @emits KeyringController#lock
   * @returns {Promise<Object>} A Promise that resolves to the state.
   */
  async lock(): Promise<MemStoreState> {
    // set locked
    this.memStore.updateState({ isUnlocked: false });
    // remove keyrings
    this.currentKeyring = [];
    this.currentPublicKey = undefined;
    this.currentSignAlgo = undefined;
    this.decryptedKeyrings = [];
    this.emit('lock');
    return this.fullUpdate();
  }

  /**
   * Unlock
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
  async unlock(password: string): Promise<MemStoreState> {
    try {
      await this.verifyOrBoot(password);
      await this.unlockKeyrings(password);
      this.setUnlocked();

      return this.fullUpdate();
    } catch (e) {
      consoleError('Could not unlock keyring', e);
      throw new Error(
        'Could not unlock keyring. Either the password is incorrect or the keyring is corrupted'
      );
    }
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
   * Verify or Boot
   *
   * Attempts to decrypt the current vault with a given password
   * to verify its validity. If the vault is not encrypted, it will boot.
   *
   * @param {string} password
   */
  async verifyOrBoot(password: string): Promise<void> {
    const encryptedBooted = this.store.getState().booted;
    if (!encryptedBooted) {
      await this.boot(password);
    } else {
      await this.verifyPassword(password);
    }
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
  addNewKeyring(
    publicKey: string,
    signAlgo: number,
    password: string,
    type: KeyringType,
    opts?: unknown
  ): Promise<Keyring> {
    const KeyringClass = this.getKeyringClassForType(type);
    if (!KeyringClass) {
      throw new Error(`Keyring type ${type} not found`);
    }
    const keyring = new KeyringClass(opts as typeof KeyringClass.arguments);
    return this.addKeyring(publicKey, signAlgo, password, keyring);
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
    if (validKeyrings.length === 0) {
      this.currentPublicKey = undefined;
      this.currentSignAlgo = undefined;
    }
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
   * @deprecated - This method should not be used anymore. It works on EOA addresses, not public keys.
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
   * @deprecated - This method should not be used anymore. It works on EOA addresses, not public keys.
   */
  async addNewAccount(password: string, selectedKeyring: any): Promise<string[]> {
    await this.verifyOrBoot(password);
    // Add accounts and get result
    const accounts = await selectedKeyring.addAccounts(1);

    // Emit events for each new account
    accounts.forEach((hexAccount) => {
      this.emit('newAccount', hexAccount);
    });

    // Persist and update state
    await this.persistAllKeyrings(password);
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
   * @deprecated - This method should not be used anymore. It works on EOA addresses, not public keys.
   */
  async exportAccount(address: string): Promise<string> {
    try {
      return this.getKeyringForAccount_deprecated(address).then((keyring) => {
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
   * @deprecated - This method should not be used anymore. It works on EOA addresses, not public keys.
   */
  async removeAccount(
    password: string,
    address: string,
    type: string,
    brand?: string
  ): Promise<any> {
    // Verify the password
    await this.verifyOrBoot(password);
    const keyring = await this.getKeyringForAccount_deprecated(address, type);

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
    await this.fullUpdate();
  }

  //
  // SIGNING METHODS
  //

  /**
   * Gets the app key address for the given Ethereum address and origin.
   *
   * @param {string} _address - The Ethereum address for the app key.
   * @param {string} origin - The origin for the app key.
   * @returns {string} The app key address.
   * @deprecated - This method should not be used anymore. It works on EOA addresses, not public keys.
   */
  async getAppKeyAddress(_address, origin) {
    const address = normalizeAddress(_address);
    const keyring = await this.getKeyringForAccount_deprecated(address);
    return keyring.getAppKeyAddress(address, origin);
  }

  /**
   * Exports an app key private key for the given Ethereum address and origin.
   *
   * @param {string} _address - The Ethereum address for the app key.
   * @param {string} origin - The origin for the app key.
   * @returns {string} The app key private key.
   * @deprecated - This method should not be used anymore. It works on EOA addresses, not public keys.
   */
  async exportAppKeyForAddress(_address, origin) {
    const address = normalizeAddress(_address);
    const keyring = await this.getKeyringForAccount_deprecated(address);
    if (!('exportAccount' in keyring)) {
      throw new Error(`The keyring for address ${_address} does not support exporting.`);
    }
    return keyring.exportAccount(address, { withAppKeyOrigin: origin });
  }

  //
  // PRIVATE METHODS
  //

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
  private async persistAllKeyrings(password: string): Promise<boolean> {
    // Check we're using the correct password
    await this.verifyPassword(password);
    if (!this.currentPublicKey || !this.currentSignAlgo) {
      throw new Error('Current public key or sign algo is not set');
    }
    // Serialize the current keyrings.
    const serializedKeyrings: DecryptedKeyDataV2[] = await Promise.all(
      this.currentKeyring.map(async (keyring) => keyring.serializeWithType())
    );

    // Encrypt the list of serialized keyrings. encryptedString = KeyringKeyData[]
    const encryptedString = await this.encryptor.encrypt(password, serializedKeyrings);

    // Get current ID and vaults
    const currentPublicKey = this.currentPublicKey;
    const keyringState = this.store.getState();

    const vaultArray =
      keyringState.vaultVersion === KEYRING_STATE_VAULT_V3
        ? keyringState.vault
        : await this.encryptVaultArray(await this.decryptVaultArray(password), password);

    const vaultArrayAccountIndex = vaultArray.findIndex(
      (entry) => entry.publicKey === currentPublicKey
    );
    // Update or add to vault array
    if (vaultArrayAccountIndex !== -1 && vaultArray[vaultArrayAccountIndex]) {
      vaultArray[vaultArrayAccountIndex].encryptedData = encryptedString;
      vaultArray[vaultArrayAccountIndex].publicKey = this.currentPublicKey;
      vaultArray[vaultArrayAccountIndex].signAlgo = this.currentSignAlgo;
    } else {
      // Handle legacy profile ID
      const currentId = await returnCurrentProfileId();
      if (!currentId) {
        throw new Error('No current profile ID found');
      }
      const newEntry: VaultEntryV3 = {
        id: currentId,
        encryptedData: encryptedString,
        publicKey: this.currentPublicKey,
        signAlgo: this.currentSignAlgo,
      };
      vaultArray.push(newEntry);
    }
    // Save the updated vault array to the state
    this.store.updateState({ vault: vaultArray });

    // NOTE: We could just add the decrypted serialized keyrings to the decrypted vault array, but we'll do it this way for now
    await this.decryptVaultArray(password);

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
  private async unlockKeyrings(password: string): Promise<void> {
    try {
      await this.decryptVaultArray(password);

      if (this.store.getState().vaultVersion !== KEYRING_STATE_VAULT_V3) {
        await this.encryptVaultArray(this.decryptedKeyrings, password);
      }
    } catch (error) {
      consoleError('unlockKeyrings - error', error);
      throw new Error('Authentication failed. Please check your password and try again.');
    }
    // Validate currentId

    // Note that currentAccountIndex is only used in keyring for old accounts that don't have an id stored in the keyring removing in 2.7.6
    // currentId always takes precedence
    const currentId = await returnCurrentProfileId();
    // Validate the currentId to ensure it's a valid keyring id (Note switchKeyring also does this)
    const validCurrentId = await this.ensureValidKeyringId(currentId);
    // switch to the keyring with the currentId
    await this.switchKeyring(validCurrentId);
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
  async switchKeyring(id: string): Promise<void> {
    // Ensure the id is valid
    const validKeyringId = await this.ensureValidKeyringId(id);
    // Find the keyring in the keyringList
    const selectedKeyringIndex = this.decryptedKeyrings.findIndex(
      (keyring) => keyring.id === validKeyringId
    );
    // If the keyring is not found, throw an error
    if (selectedKeyringIndex === -1) {
      throw new Error(
        'somehow the keyring is not found in the keyringList when we have a valid id'
      );
    }
    const decryptedKeyring: DecryptedKeyringV3 = this.decryptedKeyrings[selectedKeyringIndex];
    if (!decryptedKeyring || !decryptedKeyring.decryptedData) {
      throw new Error('KeyringController - selectedKeyring invalid');
    }
    // remove the keyring of the previous account
    await this.clearCurrentKeyring();
    // Restore the keyring
    await this._restoreKeyring(decryptedKeyring);
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
    const extractedData = this.decryptedKeyrings.map((entry, index): RetrievePkResult => {
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

  async revealKeyring(password: string): Promise<DecryptedKeyringV3[]> {
    try {
      await this.verifyPassword(password);
    } catch (error) {
      consoleError('revealKeyring - error', error);
      throw new Error('Authentication failed. Please check your password and try again.');
    }

    const vaultArray = this.store.getState().vault;
    if (!vaultArray) {
      throw new Error('No vault data found');
    }

    const extractedData = await this.decryptVaultArray(password);

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
    return keyring;
  }

  /**
   * Creates the keyring instance
   *
   * Attempts to initialize a new keyring from the provided serialized payload.
   * On success, returns the resulting keyring instance.
   *
   * @param {Object} serialized - The serialized keyring.
   * @returns {Promise<Keyring>} The deserialized keyring.
   */
  private async _instansiateKeyring(serialized: DecryptedKeyDataV2): Promise<Keyring> {
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
  private async _restoreKeyring(decryptedKeyring: DecryptedKeyringV3): Promise<Keyring> {
    const keyring = await this._instansiateKeyring(decryptedKeyring.decryptedData[0]);
    this.currentKeyring = [keyring];
    this.currentSignAlgo = decryptedKeyring.signAlgo;
    // Regenerate the public key from the private key
    const publicPrivateKey = await this.getKeyringPublicPrivateKey(
      decryptedKeyring.signAlgo,
      keyring
    );
    this.currentPublicKey = publicPrivateKey.publicKey;

    // throw an error if the public key is not the same as the one in the decrypted keyring
    if (this.currentPublicKey !== decryptedKeyring.publicKey) {
      throw new Error(
        `restoreKeyring - public key mismatch: ${this.currentPublicKey} !== ${decryptedKeyring.publicKey}`
      );
    }
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
  getKeyringsByType(type: string): Keyring[] {
    return this.currentKeyring.filter((keyring) => keyring.type === type);
  }

  /**
   * Get Accounts
   *
   * Returns the public addresses of all current accounts
   * managed by all currently unlocked keyrings.
   *
   * @returns {Promise<Array<string>>} The array of accounts.
   * @deprecated - This method should not be used anymore. It works on EOA addresses, not public keys.
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
   *
   * @deprecated use checkAvailableAccountKeys instead
   */
  getKeyringForAccount_deprecated(
    address: string,
    type?: string,
    start?: number,
    end?: number,
    includeWatchKeyring = true
  ): Promise<any> {
    const hexed = normalizeAddress(address).toLowerCase();
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

  /**
   *
   * @returns
   * @deprecated - This method should not be used anymore. It works on EOA addresses, not public keys.
   */
  getAllTypedAccounts(): Promise<DisplayedKeryring[]> {
    return Promise.all(this.currentKeyring.map((keyring) => this.displayForKeyring(keyring)));
  }

  /**
   * @deprecated - This method should not be used anymore. It works on EOA addresses, not public keys.
   */
  async getAllTypedVisibleAccounts(): Promise<DisplayedKeryring[]> {
    const keyrings = await Promise.all(
      this.currentKeyring.map((keyring) => this.displayForKeyring(keyring, false))
    );

    return keyrings.filter((keyring) => keyring.accounts.length > 0);
  }
  /**
   * @deprecated - This method should not be used anymore. It works on EOA addresses, not public keys.
   */
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
    await this.clearCurrentKeyring();
    await this.clearKeyringList();
    await this.clearVault();
  }

  /**
   * Clear Keyrings
   *
   * Deallocates all currently managed keyrings and accounts.
   * Used before initializing a new vault.
   */

  async clearCurrentKeyring(): Promise<void> {
    // clear keyrings from memory
    this.currentKeyring = [];
    this.currentPublicKey = undefined;
    this.currentSignAlgo = undefined;
  }

  /**
   * Clear Keyring list
   *
   * Deallocates all decrypted keyringList in state.
   *
   */

  async clearKeyringList(): Promise<void> {
    // clear keyringList from state
    this.decryptedKeyrings = [];
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
    const keyringState = await this.loadKeyringStateV3();
    return this.loadStore(keyringState);
  }

  private isValidKeyringKeyDataArray(data: any): data is DecryptedKeyDataV2[] {
    return (
      Array.isArray(data) &&
      data.every(
        (item) => typeof item === 'object' && typeof item.type === 'string' && 'data' in item
      )
    );
  }

  private async decryptVaultEntryV2(
    entry: VaultEntryV2,
    password: string
  ): Promise<DecryptedKeyringV3> {
    // Validate entry is a proper object
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('Invalid vault entry format');
    }

    const id = entry.id;
    const encryptedData = entry.encryptedData;

    if (!encryptedData) {
      // Silently continue as we want to try to decrypt as many as possible
      consoleError(`No encrypted data found for entry with ID ${id}`);
    }

    // Decrypt the entry
    // encryptedString = KeyringKeyData[]
    const decryptedData = (await this.encryptor.decrypt(password, encryptedData)) as unknown;

    // this returns an array of KeyringKeyDataV2
    switch (this.store.getState().vaultVersion) {
      case KEYRING_STATE_VAULT_V1:
        // Looking up the derivation path and passphrase
        const keyringDataV2 = await this.translateVaultV1toV2({
          id: entry.id,
          decryptedData: decryptedData as DecryptedKeyDataV2[],
        });
        return await this.translateVaultV2toV3(keyringDataV2);
      case KEYRING_STATE_VAULT_V2:
        return await this.translateVaultV2toV3({
          id: entry.id,
          decryptedData: decryptedData as DecryptedKeyDataV2[],
        });
    }
    throw new Error('Invalid vault version');
  }

  private async decryptVaultArrayV2(
    vaultArray: VaultEntryV2[],
    password: string
  ): Promise<DecryptedKeyringV3[]> {
    const decryptedKeyrings: DecryptedKeyringV3[] = [];

    for (const entry of vaultArray) {
      try {
        const keyringDataV3 = await this.decryptVaultEntryV2(entry, password);
        decryptedKeyrings.push(keyringDataV3);
      } catch (err) {
        // Don't print the error as it may contain sensitive data
        consoleError(`Failed to process vault entry`, err);
        // Continue with next entry
      }
    }
    this.decryptedKeyrings = decryptedKeyrings;
    return decryptedKeyrings;
  }
  private async decryptVaultEntryV3(
    entry: VaultEntryV3,
    password: string
  ): Promise<DecryptedKeyringV3> {
    // Validate entry is a proper object
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('Invalid vault entry format');
    }

    const encryptedData = entry.encryptedData;

    if (!encryptedData) {
      consoleError(`No encrypted data found for entry`);
    }

    // Decrypt the entry
    // encryptedString = KeyringKeyData[]
    const decryptedData = (await this.encryptor.decrypt(password, encryptedData)) as unknown;

    // this returns an array of KeyringKeyDataV2
    switch (this.store.getState().vaultVersion) {
      case KEYRING_STATE_VAULT_V3:
        return {
          id: entry.id,
          publicKey: entry.publicKey,
          signAlgo: entry.signAlgo,
          decryptedData: decryptedData as DecryptedKeyDataV2[],
        };
    }
    throw new Error('Invalid vault version');
  }
  private async decryptVaultArrayV3(
    vaultArray: VaultEntryV3[],
    password: string
  ): Promise<DecryptedKeyringV3[]> {
    const decryptedKeyrings: DecryptedKeyringV3[] = [];

    for (const entry of vaultArray) {
      try {
        const keyringDataV3 = await this.decryptVaultEntryV3(entry, password);
        decryptedKeyrings.push(keyringDataV3);
      } catch {
        // Don't print the error as it may contain sensitive data
        consoleError(`Failed to process vault entry`);
        // Continue with next entry
      }
    }
    this.decryptedKeyrings = decryptedKeyrings;
    return decryptedKeyrings;
  }
  private async decryptVaultArray(password: string): Promise<DecryptedKeyringV3[]> {
    const keyringState = this.store.getState();
    if (keyringState.vaultVersion === KEYRING_STATE_VAULT_V3) {
      return await this.decryptVaultArrayV3(keyringState.vault, password);
    } else {
      // Ensure vaultArray is an array and filter out null/undefined entries
      const vaultArray = Array.isArray(keyringState.vault)
        ? keyringState.vault.filter(Boolean)
        : [keyringState.vault];

      return await this.decryptVaultArrayV2(vaultArray, password);
    }
  }
  private async encryptVaultArray(
    vaultArray: DecryptedKeyringV3[],
    password: string
  ): Promise<VaultEntryV3[]> {
    const encryptedVaultArray: VaultEntryV3[] = [];

    for (const keyring of vaultArray) {
      const serializedKeyringData: DecryptedKeyDataV2[] = keyring.decryptedData;
      // encryptedString = KeyringKeyData[]
      const encryptedData = await this.encryptor.encrypt(password, serializedKeyringData);
      encryptedVaultArray.push({
        id: keyring.id,
        publicKey: keyring.publicKey,
        signAlgo: keyring.signAlgo,
        encryptedData,
      });
    }
    this.store.updateState({
      vault: encryptedVaultArray,
      vaultVersion: KEYRING_STATE_VAULT_V3,
    });
    return encryptedVaultArray;
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
          consoleInfo(`Fixed string entry by adding ID ${id} from deepVault`);
          return newEntry;
        }

        // If deepVault matching failed, try to use ID from loggedInAccounts based on index
        if (loggedInAccounts && loggedInAccounts[index] && loggedInAccounts[index].id) {
          const accountId = loggedInAccounts[index].id;
          const newEntry = { id: accountId, encryptedData: entry };
          consoleInfo(
            `Fixed string entry by adding ID ${accountId} from loggedInAccounts at index ${index}`
          );
          return newEntry;
        }

        // TODO: If no matching ID is found, then we 'could' decrypt the entry and use loginV3Api to get the ID
        // Handle through support. This isn't worth the effort. We won't update this old vault so it will still be there.

        consoleError('Could not find matching ID for string entry');
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

  /**
   * @deprecated Checking accounts by user id is deprecated - use the public key instead
   **/
  async checkAvailableAccount_deprecated(currentId: string): Promise<VaultEntryV2[]> {
    if (this.store.getState().vaultVersion !== KEYRING_STATE_VAULT_V2) {
      throw new Error('Checking accounts by user id is depreciated - use the public key instead');
    }
    const vaultArray = this.store.getState().vault as VaultEntryV2[];

    // Check if an entry with the given currentId exists
    const foundEntry = vaultArray.find((entry) => entry.id === currentId);

    if (foundEntry) {
      await storage.set(CURRENT_ID_KEY, currentId);
      try {
        const encryptedDataString = foundEntry[currentId];
        const encryptedData = JSON.parse(encryptedDataString) as EncryptedData;

        // Validate that it has the expected structure
        if (!encryptedData.data || !encryptedData.iv || !encryptedData.salt) {
          consoleWarn('Encrypted data is missing required fields');
        }
      } catch (error) {
        consoleError('Error parsing encrypted data:', error);
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
  private async loadKeyringStateV3(): Promise<KeyringState | null> {
    const keyringState = await storage.get(KEYRING_STATE_V3_KEY);
    if (!keyringState) {
      // Can't translate until unlocked
      return await this.loadKeyringStateV2();
    }
    return keyringState;
  }

  // Version 2
  private async loadKeyringStateV2(): Promise<KeyringState | null> {
    const keyringState = await storage.get(KEYRING_STATE_V2_KEY);
    if (!keyringState) {
      return await this.translateFromKeyringStateV1();
    }
    return keyringState;
  }

  // Version 1
  private async translateFromKeyringStateV1(): Promise<KeyringState | null> {
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
  private async translateVaultV2toV3(
    keyringDataV2: DecryptedKeyringV2
  ): Promise<DecryptedKeyringV3> {
    // We have decrypted data, so create the keyring instance
    const keyring = await this._instansiateKeyring(keyringDataV2.decryptedData[0]);

    // Get the public private key tuple
    const pubPkTuble = await this.getKeyringPublicPrivateKeyTuple([keyring]);

    // Convert the public private key tuple to a public key tuple
    const pubKeyTuple = await pkTuple2PubKey(pubPkTuble);

    // Find any account with public key information on mainnet
    const accountsMainnet = await getAccountsByPublicKeyTuple(pubPkTuble, 'mainnet');
    const accountsTestnet = await getAccountsByPublicKeyTuple(pubPkTuble, 'testnet');
    const accounts = [...accountsMainnet, ...accountsTestnet];

    // If no accounts are found, then the registration process may not have been completed
    // Assume the default account key
    const accountKeyRequest =
      accounts.length === 0
        ? defaultAccountKey(pubKeyTuple)
        : pubKeyAccountToAccountKey(accounts[0]);

    return {
      id: keyringDataV2.id,
      publicKey: accountKeyRequest.public_key,
      decryptedData: keyringDataV2.decryptedData,
      signAlgo: accountKeyRequest.sign_algo,
    };
  }

  // Translate decrypted vault data to the new format
  private async translateVaultV1toV2(
    keyringDataV1: DecryptedKeyringV2
  ): Promise<DecryptedKeyringV2> {
    // Get the logged in accounts
    const loggedInAccounts: LoggedInAccount[] = (await storage.get('loggedInAccounts')) || [];

    const keyringId = keyringDataV1.id;
    const keyringDataV2: DecryptedKeyDataV2[] = await Promise.all(
      keyringDataV1.decryptedData.map(async (keyringDataV1): Promise<DecryptedKeyDataV2> => {
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

  /**
   * Remove Profile
   *
   * Removes a specific profile and its associated keys from the keyring list.
   * If it's the last profile, it resets the entire wallet.
   * If it's the current active profile, it switches to another profile.
   *
   * @param {string} password - The keyring controller password.
   * @param {string} profileId - The ID of the profile to remove.
   * @returns {Promise<boolean>} - A promise that resolves to true if successful.
   * @deprecated Use {@link removeKeyring} instead and update the current profile ID outside of the function
   */
  async removeProfile(password: string, profileId: string): Promise<boolean> {
    const profileIndex = this.decryptedKeyrings.findIndex((keyring) => keyring.id === profileId);
    if (profileIndex === -1) {
      throw new Error(`Profile with ID ${profileId} not found`);
    }
    // Verify the password
    await this.verifyPassword(password);

    // Get all keyring IDs *before* modification
    const keyringIds = await this.getAllKeyringIds(); // Or use: this.keyringList.map(k => k.id);

    // If this is the only profile, reset the entire wallet
    if (keyringIds.length <= 1) {
      await this.resetKeyRing();
      // Update the memory store
      this.memStore.updateState({ isUnlocked: false });
      this.emit('lock');
      await storage.remove(CURRENT_ID_KEY);
      this.store.updateState({ booted: '' });
      return true;
    }

    // Get the current profile ID
    const currentId = await returnCurrentProfileId();

    // If we're removing the current profile, determine the next one to switch to
    let needToSwitchKeyring = false;
    let nextProfileId: string | undefined = undefined;

    if (currentId === profileId) {
      // Calculate the index of the next profile, wrapping around if removing the last one
      const nextIndex = (profileIndex + 1) % keyringIds.length;
      // Get the ID of the profile at the next index
      nextProfileId = keyringIds[nextIndex];

      if (nextProfileId && nextProfileId !== profileId) {
        // Ensure we found a valid *different* ID
        // Update the current profile ID in storage immediately
        await storage.set(CURRENT_ID_KEY, nextProfileId);
        needToSwitchKeyring = true;
      } else {
        // We thought about handling defensively here, but it's better to throw to stop the operation

        // This should theoretically not happen if length > 1, but handle defensively
        throw new Error(`Error: Could not determine the next profile ID to switch to`);
      }
      // Clear the current keyring
      this.clearCurrentKeyring();
    }

    // Remove the profile from the in-memory keyring list
    this.decryptedKeyrings.splice(profileIndex, 1);

    // Update the vault in the store by re-encrypting the remaining keyrings
    await this.encryptVaultArray(this.decryptedKeyrings, password);

    // Switch to the next profile's keyring in memory if needed
    // Note that we are switching the keyring without switching the login
    if (needToSwitchKeyring && nextProfileId) {
      await this.switchKeyring(nextProfileId);
    }

    // Update the memory store
    await this.fullUpdate();

    // Emit an event that a profile was removed
    this.emit('profileRemoved', profileId);

    return true;
  }

  /**
   * Remove Keyring
   *
   * Removes a specific keyring and its associated keys from the keyring list.
   * If it's the last keyring, it resets the entire wallet.
   * If it's the current active keyring, it figures out the next one to switch to.
   *
   * @param {string} password - The keyring controller password.
   * @param {string} publicKey - The public key of the keyring to remove.
   * @returns {Promise<string|undefined>} - A promise that resolves to the next keyring public key, undefined if there are no keyrings left.
   * @throws {Error} - If the keyring is not found.
   */
  async removeKeyring(password: string, publicKey: string): Promise<string | undefined> {
    const keyringIndex = this.decryptedKeyrings.findIndex(
      (keyring) => keyring.publicKey === publicKey
    );
    if (keyringIndex === -1) {
      throw new Error(`Keyring with public key ${publicKey} not found`);
    }
    // Verify the password
    await this.verifyPassword(password);

    // Get all keyring IDs *before* modification
    const publicKeyList = await this.getAllPublicKeys(); // Or use: this.keyringList.map(k => k.id);

    // If this is the only profile, reset the entire wallet
    if (publicKeyList.length <= 1) {
      await this.resetKeyRing();
      // Update the memory store
      this.memStore.updateState({ isUnlocked: false });
      this.emit('lock');
      this.store.updateState({ booted: '' });
      // There are no keyrings left, so return undefined
      return undefined;
    }

    // Get the current profile ID
    const currentPublicKey = this.getCurrentPublicKey();

    // If we're removing the current profile, determine the next one to switch to
    let nextPublicKey: string = currentPublicKey;

    if (currentPublicKey === publicKey) {
      // Calculate the index of the next profile, wrapping around if removing the last one
      const nextIndex = (keyringIndex + 1) % publicKeyList.length;
      // Get the ID of the profile at the next index
      nextPublicKey = publicKeyList[nextIndex];

      if (!nextPublicKey || nextPublicKey === publicKey) {
        // We thought about handling defensively here, but it's better to throw to stop the operation

        // This should theoretically not happen if length > 1, but handle defensively
        throw new Error(`Error: Could not determine the next keyring to switch to`);
      }
      // Clear the current keyring
      this.clearCurrentKeyring();
    }

    // Remove the profile from the in-memory keyring list
    this.decryptedKeyrings.splice(keyringIndex, 1);

    // Update the vault in the store by re-encrypting the remaining keyrings
    await this.encryptVaultArray(this.decryptedKeyrings, password);

    // Return the next keyring public key
    return nextPublicKey;
  }
  /**
   * Atomically change the password for all keyrings/vaults and the booted state.
   * If any step fails, nothing is written to storage.
   *
   * @param oldPassword - The current password.
   * @param newPassword - The new password to set.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // 1. Verify the old password
      await this.verifyPassword(oldPassword);

      // 2. Decrypt all vaults with the old password
      const allVaultData = await this.revealKeyring(oldPassword);
      if (!allVaultData || allVaultData.length === 0) {
        throw new Error('No vault data found to update');
      }

      // 3. Prepare to re-encrypt all vaults with the new password (in memory)
      const newVaultArray: VaultEntryV2[] = [];
      for (const vaultData of allVaultData) {
        // Re-encrypt each vault's decrypted data with the new password
        const encryptedData = await this.encryptor.encrypt(newPassword, vaultData.decryptedData);
        newVaultArray.push({ id: vaultData.id, encryptedData });
      }

      // 4. Re-encrypt the booted state with the new password (in memory)
      const newBooted = await this.encryptor.encrypt(newPassword, 'true');

      // 5. Write both the new vaults and the new booted state to storage (atomically)
      this.store.updateState({
        booted: newBooted,
        vault: newVaultArray,
        vaultVersion: KEYRING_STATE_VAULT_V2,
      });

      // 6. Update in-memory state (if needed)
      this.memStore.updateState({ isUnlocked: true });

      return true;
    } catch (error) {
      consoleError('Failed to change keyring password atomically:', error);
      return false;
    }
  }
}

export default new KeyringService();
