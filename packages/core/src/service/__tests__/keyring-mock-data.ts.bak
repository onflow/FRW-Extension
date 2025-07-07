/**
 * Mock data for keyring tests
 * Generated from keyring-boot-mnemonics.test.ts
 */

import encryptor from 'browser-passworder';

import { SIGN_ALGO_NUM_ECDSA_P256 } from '@/shared/constant/algo-constants';
import { CURRENT_ID_KEY, KEYRING_STATE_V3_KEY } from '@/shared/types/keyring-types';

/**
 * Constants used for keyring testing
 *
 * NOTE: DO NOT change these values as they are used in the encrypted mock data
 */
export const MOCK_PASSWORD = 'test_password_123';
export const MOCK_MNEMONIC = 'test test test test test test test test test test test junk';
export const MOCK_ID = 'testId1';

/**
 * This is the data that would be encrypted in the encryptedData field
 * of the vault entry. It represents a serialized HD keyring with our mock mnemonic.
 */
export const MOCK_VAULT_DATA = [
  {
    type: 'HD Key Tree',
    data: {
      mnemonic: MOCK_MNEMONIC,
      activeIndexes: [0],
      derivationPath: "m/44'/539'/0'/0/0",
      passphrase: '',
    },
  },
];
// Expected output keys from the mnemonic
export const MOCK_KEYS = {
  privateKey: '7348f26224629d28aa68f7280161839aaf40b38ce5f13fc3e5612cf8691d2725',
  publicKeys: {
    P256: {
      pubK: '587c247c7cd090bc7abdd9fc6c02a135457a59195ee9cdd5e0b35c61cd857377b20dec3ba642e77901ce5b382218668cc1718f7a133304c50962fc8eda911ec5',
    },
    SECP256K1: {
      pubK: '25cb73bf0f93acc8e01e5fb1b2608e9f9ca19259bcb6072610c91ba0866a6c1f1840ed4549f172776e24f4dad703a2c9d22399220833f218ea90ada9c9585d95',
    },
  },
};

/**
 * Real encrypted keyring state for testing
 *
 * This contains the actual encrypted data created with encryptor.encrypt using MOCK_PASSWORD
 */
export const MOCK_KEYRING_STATE_V2 = {
  booted:
    '{"data":"8TzxAMair8Ui+gZP7udSpWlL4zDtpw==","iv":"3Y5NRX9ApIr52XYoWpCuXA==","salt":"bcukqOMOG+IZIWybNaEfg1ra5hIfUTCn/0NDxy5HBl4="}',
  vault: [
    {
      id: MOCK_ID,
      encryptedData:
        '{"data":"E8+vzwvQaGX38vzxn+ufZejpI48T0Ev0EB5esgmJsFFpB/K+/A5umeFY7taThGvKF6RxS9VORjTmrNWAzjeNvsHGCKAFWwzUfmByGRAcC9DEbXE35yO73A2aBigaQdQknlBG7T5jKfTIZdIvMnWOofinr6efAJrYwnr71NGAnPdj8GjYGweYPlRCKLdggIpCldf2AhvOKYYFWaQRkHtJ3RDecSvb+ldVqha23nuG2J0t4iTrKqJxrZDmIJ/T4ruW8Bha","iv":"7SLDGGs1lz1mNbuSnfbPwQ==","salt":"H20o1zs1ryQqaV7sYvpitUk7yGdTf6+vjbAa9K+2UOk="}',
    },
  ],
  vaultVersion: 2,
};

export const MOCK_KEYRING_STATE_V3 = {
  booted:
    '{"data":"8TzxAMair8Ui+gZP7udSpWlL4zDtpw==","iv":"3Y5NRX9ApIr52XYoWpCuXA==","salt":"bcukqOMOG+IZIWybNaEfg1ra5hIfUTCn/0NDxy5HBl4="}',
  vault: [
    {
      id: MOCK_ID,
      pubKey: MOCK_KEYS.publicKeys.P256.pubK,
      signAlgo: SIGN_ALGO_NUM_ECDSA_P256,
      encryptedData:
        '{"data":"E8+vzwvQaGX38vzxn+ufZejpI48T0Ev0EB5esgmJsFFpB/K+/A5umeFY7taThGvKF6RxS9VORjTmrNWAzjeNvsHGCKAFWwzUfmByGRAcC9DEbXE35yO73A2aBigaQdQknlBG7T5jKfTIZdIvMnWOofinr6efAJrYwnr71NGAnPdj8GjYGweYPlRCKLdggIpCldf2AhvOKYYFWaQRkHtJ3RDecSvb+ldVqha23nuG2J0t4iTrKqJxrZDmIJ/T4ruW8Bha","iv":"7SLDGGs1lz1mNbuSnfbPwQ==","salt":"H20o1zs1ryQqaV7sYvpitUk7yGdTf6+vjbAa9K+2UOk="}',
    },
  ],
  vaultVersion: 3,
};
/**
 * Setup mock storage with real encrypted data for keyring tests
 *
 * @param memoryStore - Map to use for mock storage
 */
export const setupMockKeyringStorage = (memoryStore: Map<string, any>) => {
  // Set up basic state
  memoryStore.set(CURRENT_ID_KEY, MOCK_ID);

  // Set up keyring state with real encrypted data
  memoryStore.set(KEYRING_STATE_V3_KEY, MOCK_KEYRING_STATE_V2);
};

/**
 * Verify the mocked keyring data by decrypting it
 *
 * This is useful in test setup to ensure the mock data is working correctly
 *
 * @returns {Promise<boolean>} - True if verification succeeds
 */
export const verifyMockKeyringData = async (): Promise<boolean> => {
  try {
    // Try to decrypt the booted flag
    const decryptedBooted = await encryptor.decrypt(MOCK_PASSWORD, MOCK_KEYRING_STATE_V2.booted);

    // Check if we got the expected 'true' string
    if (typeof decryptedBooted !== 'string' || decryptedBooted !== 'true') {
      console.error('Failed to decrypt booted flag correctly');
      return false;
    }

    // Try to decrypt the vault data
    const encryptedVaultData = MOCK_KEYRING_STATE_V2.vault[0].encryptedData;
    const decryptedVaultData = await encryptor.decrypt(MOCK_PASSWORD, encryptedVaultData);

    // Basic structure validation without type checking issues
    if (
      !decryptedVaultData ||
      !Array.isArray(decryptedVaultData) ||
      decryptedVaultData.length === 0
    ) {
      console.error('Decrypted vault data has incorrect structure');
      return false;
    }

    // Success!
    return true;
  } catch (error) {
    console.error('Error verifying mock keyring data:', error);
    return false;
  }
};

/**
 * Example of how to use the mock data in tests:
 *
 * ```typescript
 * import {
 *   MOCK_PASSWORD,
 *   MOCK_ID,
 *   MOCK_KEYRING_STATE,
 *   setupMockKeyringStorage,
 *   verifyMockKeyringData
 * } from './keyring-mock-data';
 * import KeyringService from '.';
 *
 * describe('Keyring Test', () => {
 *   const memoryStore = new Map<string, any>();
 *
 *   beforeEach(async () => {
 *     // Clear mocks and reset state
 *     vi.clearAllMocks();
 *     memoryStore.clear();
 *
 *     // Setup storage mocks
 *     vi.mocked(storage.get).mockImplementation((key) => memoryStore.get(key));
 *     vi.mocked(storage.set).mockImplementation((key, value) => {
 *       memoryStore.set(key, value);
 *       return Promise.resolve();
 *     });
 *
 *     // Setup mock keyring storage with real encryption
 *     setupMockKeyringStorage(memoryStore);
 *
 *     // Initialize KeyringService with the mock data
 *     KeyringService.store.updateState(MOCK_KEYRING_STATE);
 *
 *     // Reset keyring service state
 *     KeyringService.currentKeyring = [];
 *     KeyringService.keyringList = [];
 *     KeyringService.password = null;
 *
 *     // Optional: Verify the mock data is working correctly
 *     await verifyMockKeyringData();
 *   });
 *
 *   it('should unlock correctly with password', async () => {
 *     // Unlock with password - this will use real decryption
 *     await KeyringService.submitPassword(MOCK_PASSWORD);
 *
 *     // Verify unlocked state
 *     expect(KeyringService.password).toBe(MOCK_PASSWORD);
 *     expect(KeyringService.isUnlocked()).toBe(true);
 *
 *     // Access the keyring data
 *     const publicKeyTuple = await KeyringService.getCurrentPublicKeyTuple();
 *     expect(publicKeyTuple).toBeDefined();
 *   });
 * });
 * ```
 */
