// Testing imports
import encryptor from 'browser-passworder';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FLOW_BIP44_PATH } from '@onflow/flow-wallet-shared/constant/algo-constants';
import {
  CURRENT_ID_KEY,
  KEYRING_STATE_V2_KEY,
} from '@onflow/flow-wallet-shared/types/keyring-types';

// Internal imports
import storage from '@/extension-shared/utils/storage';

import keyringService from '../keyring';
import { MOCK_KEYS, MOCK_MNEMONIC, MOCK_PASSWORD } from './keyring-mock-data';

// Mock dependencies
vi.mock('@/extension-shared/utils/storage', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@/core/service/openapi', () => ({
  default: {
    getAccountsWithPublicKey: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/core/service/userWallet', () => ({
  default: {
    setupFcl: vi.fn(),
  },
}));

vi.mock('@/core/service/i18n', () => ({
  default: {
    t: (key) => key,
  },
}));

vi.mock('@/core/service/preference', () => ({
  default: {
    getHiddenAddresses: vi.fn().mockReturnValue([]),
  },
}));

vi.mock('@onflow/flow-wallet-shared/utils/current-id', () => ({
  returnCurrentProfileId: vi.fn().mockResolvedValue('testId1'),
}));

// Use real BIP39 for fixed mnemonic
vi.mock('bip39', () => ({
  validateMnemonic: vi.fn((mnemonic) => {
    // Simple validation for testing purposes
    return mnemonic && mnemonic.split(' ').length === 12;
  }),
  generateMnemonic: vi.fn(() => 'test test test test test test test test test test test junk'),
}));

// Import the mocked modules after all mocks are defined

describe('Keyring Boot and Mnemonics Test', () => {
  // Create in-memory storage
  const memoryStore = new Map<string, any>();

  beforeEach(async () => {
    // Reset mocks and storage
    vi.clearAllMocks();
    memoryStore.clear();

    // Set currentId in storage
    memoryStore.set(CURRENT_ID_KEY, 'testId1');

    // Mock storage
    vi.mocked(storage.get).mockImplementation((key) => memoryStore.get(key));
    vi.mocked(storage.set).mockImplementation((key, value) => {
      memoryStore.set(key, value);
      return Promise.resolve();
    });

    // Reset KeyringService state
    await keyringService.resetKeyRing();
  });

  it('generates mock data with real encryption', async () => {
    // Create encrypted booted data manually for testing
    const encryptedBooted = await encryptor.encrypt(MOCK_PASSWORD, 'true');

    // Verify we can decrypt it
    const decryptedBooted = await encryptor.decrypt(MOCK_PASSWORD, encryptedBooted);
    expect(decryptedBooted).toBe('true');

    // Create a simple vault data structure
    const mockVaultData = [
      {
        type: 'HD Key Tree',
        data: {
          mnemonic: MOCK_MNEMONIC,
          activeIndexes: [0],
          derivationPath: FLOW_BIP44_PATH,
          passphrase: '',
        },
      },
    ];

    // Encrypt the vault data
    const encryptedVaultData = await encryptor.encrypt(MOCK_PASSWORD, mockVaultData);

    // Verify we can decrypt the vault data
    const decryptedVaultData = await encryptor.decrypt(MOCK_PASSWORD, encryptedVaultData);
    expect(decryptedVaultData).toMatchObject(mockVaultData);

    // Create a mock keyring state with encrypted data
    const keyringStateV2 = {
      booted: encryptedBooted,
      vault: [
        {
          id: 'testId1',
          encryptedData: encryptedVaultData,
        },
      ],
      vaultVersion: 2,
    };

    // Store this for future tests
    memoryStore.set(KEYRING_STATE_V2_KEY, keyringStateV2);

    // Log the mock data for future use
    const mockData = {
      password: MOCK_PASSWORD,
      keyringStateV2: keyringStateV2,
      decryptedVaultData: mockVaultData,
      mnemonic: MOCK_MNEMONIC,
    };

    const mockPublicKeyTuple = MOCK_KEYS.publicKeys;
    const mockPrivateKey = MOCK_KEYS.privateKey;

    // Now let's verify we can actually use this to unlock a KeyringService

    // Initialize the KeyringService with our mocked data
    await keyringService.loadKeyringStore();

    // Test unlocking with the password
    await keyringService.unlock(MOCK_PASSWORD);

    // Verify it's unlocked
    expect(keyringService.isUnlocked()).toBe(true);

    // Verify we have the keyring in memory
    expect((await keyringService.getKeyring()).length).toBeGreaterThan(0);

    // Check that we can access keys
    const publicKeyTuple = await keyringService.getCurrentPublicKeyTuple();
    expect(publicKeyTuple).toEqual(mockPublicKeyTuple);

    const privateKeyTuple = await keyringService.getCurrentPrivateKeyTuple();
    expect(privateKeyTuple.SECP256K1.pk).toEqual(mockPrivateKey);
  });
});
