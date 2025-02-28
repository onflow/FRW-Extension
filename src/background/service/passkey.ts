import { storage } from '@/background/webapi';

interface PasskeyStore {
  enabled: boolean;
  lastUsed: string | null;
  registeredCredentials: RegisteredCredential[];
  encryptedPassword?: {
    data: string;
    iv: string;
    encryptionKey: string;
  };
}

interface RegisteredCredential {
  id: string;
  rawId: string;
  createdAt: string;
}

class PasskeyService {
  store!: PasskeyStore;

  init = async () => {
    // Initialize the passkey store
    this.store = {
      enabled: false,
      lastUsed: null,
      registeredCredentials: [],
    };

    // Load state from storage if available
    const storedData = await storage.get('passkey');
    if (storedData) {
      this.store = storedData;
    }
  };

  /**
   * Encrypts and stores the user's password
   * @param password The user's password to encrypt and store
   * @returns Promise<boolean> Success status
   */
  storeEncryptedPassword = async (password: string): Promise<boolean> => {
    try {
      // Generate a random encryption key
      const encryptionKey = new Uint8Array(32);
      globalThis.crypto.getRandomValues(encryptionKey);

      // Encrypt the password
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));

      const encryptedPassword = await globalThis.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        await globalThis.crypto.subtle.importKey('raw', encryptionKey, { name: 'AES-GCM' }, false, [
          'encrypt',
        ]),
        passwordData
      );

      // Store the encrypted password and encryption materials
      this.store.encryptedPassword = {
        data: Buffer.from(encryptedPassword).toString('base64'),
        iv: Buffer.from(iv).toString('base64'),
        encryptionKey: Buffer.from(encryptionKey).toString('base64'),
      };

      await storage.set('passkey', this.store);
      return true;
    } catch (error) {
      console.error('Error storing encrypted password:', error);
      return false;
    }
  };

  /**
   * Decrypts and returns the user's password
   * @returns Promise<string|null> The decrypted password or null if not available
   */
  getDecryptedPassword = async (): Promise<string | null> => {
    try {
      if (!this.store.encryptedPassword) {
        return null;
      }

      const { data, iv, encryptionKey } = this.store.encryptedPassword;

      // Decrypt the password
      const decryptedPassword = await globalThis.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: Buffer.from(iv, 'base64'),
        },
        await globalThis.crypto.subtle.importKey(
          'raw',
          Buffer.from(encryptionKey, 'base64'),
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        ),
        Buffer.from(data, 'base64')
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedPassword);
    } catch (error) {
      console.error('Error decrypting password:', error);
      return null;
    }
  };

  /**
   * Get available passkeys for the current user
   */
  getAvailablePasskeys = async () => {
    return this.store.registeredCredentials;
  };

  /**
   * Delete a specific passkey
   * @param passkeyId The ID of the passkey to delete
   */
  deletePasskey = async (passkeyId: string): Promise<boolean> => {
    try {
      const initialCount = this.store.registeredCredentials.length;
      this.store.registeredCredentials = this.store.registeredCredentials.filter(
        (cred) => cred.id !== passkeyId
      );

      // Check if any were removed
      if (this.store.registeredCredentials.length === initialCount) {
        return false;
      }

      // Update enabled status if no credentials remain
      if (this.store.registeredCredentials.length === 0) {
        this.store.enabled = false;
        this.store.lastUsed = null;
        // Also remove the encrypted password if no passkeys remain
        delete this.store.encryptedPassword;
      }

      await storage.set('passkey', this.store);
      return true;
    } catch (error) {
      console.error('Error deleting passkey:', error);
      return false;
    }
  };
}

export default new PasskeyService();
