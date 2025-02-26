import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth/web-extension';

import { storage } from '@/background/webapi';

import { mixpanelTrack } from './mixpanel';

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
   * Check if passkeys are available in the browser environment
   */
  isPasskeySupported = async (): Promise<boolean> => {
    // More robust check for Chrome extension environment
    try {
      // Check basic WebAuthn API availability
      if (typeof PublicKeyCredential === 'undefined') {
        console.log('Passkey not supported: PublicKeyCredential is undefined');
        return false;
      }

      // Check if platform authenticator is available
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        const isPlatformAuthenticatorAvailable =
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

        console.log('Platform authenticator available:', isPlatformAuthenticatorAvailable);
        return isPlatformAuthenticatorAvailable;
      }

      // If we can't check specifically, assume it's available
      // The actual passkey creation will fail gracefully if not supported
      console.log('Cannot determine platform authenticator availability; assuming supported');
      return true;
    } catch (error) {
      console.error('Error checking passkey support:', error);
      // In case of errors, assume it's supported and let the actual operation handle failures
      return true;
    }
  };

  /**
   * Creates a new passkey for the current user
   * @returns Promise<boolean> Success status
   */
  createPasskey = async (): Promise<boolean> => {
    try {
      const app = getApp(process.env.NODE_ENV!);
      const auth = getAuth(app);
      const user = auth.currentUser;

      if (!user || user.isAnonymous) {
        throw new Error('User must be signed in to create a passkey');
      }

      // Create a new passkey using WebAuthn
      const userId = user.uid;
      const displayName = user.displayName || user.email || userId;

      // Generate a random challenge
      const challenge = new Uint8Array(32);
      globalThis.crypto.getRandomValues(challenge);

      // Create credential options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'FRW Extension Wallet',
          id: globalThis.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: user.email || userId,
          displayName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      };

      // Create credential
      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create passkey');
      }

      // Add credential to store
      const credentialId = credential.id;
      const rawId = Buffer.from(credential.rawId).toString('base64');
      const registeredCredential: RegisteredCredential = {
        id: credentialId,
        rawId,
        createdAt: new Date().toISOString(),
      };

      this.store.registeredCredentials.push(registeredCredential);
      this.store.enabled = true;
      this.store.lastUsed = new Date().toISOString();

      await storage.set('passkey', this.store);

      // Track successful passkey creation
      mixpanelTrack.track('passkey_created', {
        success: true,
      });

      return true;
    } catch (error) {
      console.error('Error creating passkey:', error);
      mixpanelTrack.track('passkey_created', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
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
   * Sign in using passkey
   */
  signInWithPasskey = async (): Promise<boolean> => {
    try {
      if (!this.store.enabled || this.store.registeredCredentials.length === 0) {
        throw new Error('No passkeys available');
      }

      // Generate a random challenge
      const challenge = new Uint8Array(32);
      globalThis.crypto.getRandomValues(challenge);

      // Prepare allowed credentials from stored credentials
      const allowCredentials = this.store.registeredCredentials.map((cred) => ({
        type: 'public-key' as const,
        id: Uint8Array.from(atob(cred.rawId), (c) => c.charCodeAt(0)),
        transports: ['internal'] as AuthenticatorTransport[],
      }));

      // Create credential request options
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials,
        timeout: 60000,
        userVerification: 'required',
        rpId: globalThis.location.hostname,
      };

      // Request credential
      const credential = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to get passkey');
      }

      // Successful authentication
      const matchedCredential = this.store.registeredCredentials.find(
        (cred) => cred.id === credential.id
      );

      if (matchedCredential) {
        this.store.lastUsed = new Date().toISOString();
        await storage.set('passkey', this.store);

        // At this point, the user has verified their identity with passkey
        // You would typically use this to authenticate with Firebase
        const app = getApp(process.env.NODE_ENV!);
        const auth = getAuth(app);

        if (!auth.currentUser) {
          // User is not logged in, would need to authenticate with Firebase
          // This would typically involve calling a backend service to verify
          // the passkey assertion and return a custom token for Firebase Auth
          console.warn('Firebase authentication would be needed here');
          mixpanelTrack.track('passkey_signin', {
            success: false,
            reason: 'not_logged_in',
          });
          return false;
        }

        // Track successful passkey sign-in
        mixpanelTrack.track('passkey_signin', {
          success: true,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error signing in with passkey:', error);
      mixpanelTrack.track('passkey_signin', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
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
