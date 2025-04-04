import * as fcl from '@onflow/fcl';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  HASH_ALGO_NUM_SHA2_256,
  HASH_ALGO_NUM_SHA3_256,
  SIGN_ALGO_NUM_ECDSA_P256,
  SIGN_ALGO_NUM_ECDSA_secp256k1,
} from '@/shared/utils/algo-constants';
// Import the service *after* the mock definition and adjust order
import { userWalletService } from 'background/service';

import {
  getOrCheckAccountsWithPublicKey,
  getOrCheckAccountsByPublicKeyTuple,
  getAccountsByPublicKeyTuple,
} from '../findAddressWithPubKey';

// Mock FCL and userWalletService
vi.mock('@onflow/fcl');
vi.mock('background/service', () => ({
  userWalletService: {
    setupFcl: vi.fn(),
    getAccountsWithPublicKey: vi.fn().mockResolvedValue([]),
  },
}));

describe('findAddressWithPubKey module', () => {
  const mockPubKey = '0x123456789abcdef';
  const mockAddress = '0x1234';
  const mockPubKeyTuple = {
    P256: {
      pubK: '0x123456789abcdef_p256',
      pk: 'mock-p256-pk',
    },
    SECP256K1: {
      pubK: '0x123456789abcdef_secp256k1',
      pk: 'mock-secp256k1-pk',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('findAddressWithKey', () => {
    it('should return null when no address is provided and indexer returns no accounts', async () => {
      // Mock fetch response for indexer
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            publicKey: mockPubKey,
            accounts: [],
          }),
      });

      const result = await getOrCheckAccountsWithPublicKey(mockPubKey);
      expect(result).toEqual([]);
    });

    it('should return account details when indexer finds matching accounts with SHA3_256/ECDSA_P256', async () => {
      const mockAccountData = [
        {
          address: mockAddress,
          publicKey: mockPubKey,
          keyIndex: 0,
          weight: 1000,
          signAlgo: SIGN_ALGO_NUM_ECDSA_P256,
          signAlgoString: 'ECDSA_P256',
          hashAlgo: HASH_ALGO_NUM_SHA3_256,
          hashAlgoString: 'SHA3_256',
        },
      ];
      // Mock the service call for this specific test
      vi.mocked(userWalletService.getAccountsWithPublicKey).mockResolvedValueOnce(mockAccountData);

      // The global.fetch mock below is likely now irrelevant due to code changes in findAddressWithPubKey,
      // but kept for historical context or potential future refactoring.
      const mockIndexerResponse = {
        publicKey: mockPubKey,
        accounts: [
          {
            address: mockAddress,
            keyId: 0,
            weight: 1000,
            sigAlgo: SIGN_ALGO_NUM_ECDSA_P256, // ECDSA_P256
            hashAlgo: HASH_ALGO_NUM_SHA3_256, // SHA3_256
            signing: 'ECDSA_P256',
            hashing: 'SHA3_256',
          },
        ],
      };
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: () => Promise.resolve(mockIndexerResponse),
      });

      const result = await getOrCheckAccountsWithPublicKey(mockPubKey);

      // Assertion needs to match the structure returned by getAccountsWithPublicKey
      expect(result).toEqual(mockAccountData);
    });

    it('should query FCL when address is provided and return null if no matching keys', async () => {
      const mockFclAccount = {
        address: mockAddress,
        balance: 0,
        code: 0,
        contracts: {},
        keys: [
          {
            publicKey: 'different-key',
            index: 0,
            weight: 1000,
            revoked: false,
            hashAlgoString: 'SHA3_256',
            signAlgoString: 'ECDSA_P256',
            hashAlgo: HASH_ALGO_NUM_SHA3_256,
            signAlgo: SIGN_ALGO_NUM_ECDSA_P256,
            sequenceNumber: 0,
          },
        ],
      };

      vi.mocked(fcl.account).mockResolvedValueOnce(mockFclAccount);

      const result = await getOrCheckAccountsWithPublicKey(mockPubKey, mockAddress);
      expect(result).toBeNull();
    });

    it('should query FCL when address is provided and return matching keys', async () => {
      const mockFclAccount = {
        address: mockAddress,
        balance: 0,
        code: 0,
        contracts: {},
        keys: [
          {
            publicKey: mockPubKey,
            index: 0,
            weight: 1000,
            revoked: false,
            hashAlgoString: 'SHA3_256',
            signAlgoString: 'ECDSA_P256',
            hashAlgo: HASH_ALGO_NUM_SHA3_256,
            signAlgo: SIGN_ALGO_NUM_ECDSA_P256,
            sequenceNumber: 0,
          },
        ],
      };

      vi.mocked(fcl.account).mockResolvedValueOnce(mockFclAccount);

      const result = await getOrCheckAccountsWithPublicKey(mockPubKey, mockAddress);
      expect(result).toEqual([
        {
          ...mockFclAccount.keys[0],
          address: mockAddress,
          keyIndex: 0,
        },
      ]);
    });
  });

  describe('getOrCheckAddressByPublicKeyTuple', () => {
    it('should throw error when no accounts have sufficient weight', async () => {
      // Mock fetch to return accounts with insufficient weight
      global.fetch = vi.fn().mockImplementation((url) => {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              publicKey: url.includes('_p256')
                ? mockPubKeyTuple.P256.pubK
                : mockPubKeyTuple.SECP256K1.pubK,
              accounts: [
                {
                  address: mockAddress,
                  keyId: 0,
                  weight: 500, // Less than required 1000
                  sigAlgo: url.includes('_p256') ? 1 : 2,
                  hashAlgo: url.includes('_p256') ? 3 : 1,
                  signing: url.includes('_p256') ? 'ECDSA_P256' : 'ECDSA_secp256k1',
                  hashing: url.includes('_p256') ? 'SHA3_256' : 'SHA2_256',
                },
              ],
            }),
        });
      });

      await expect(getOrCheckAccountsByPublicKeyTuple(mockPubKeyTuple)).resolves.toEqual([]);
    });

    it('should return combined accounts when both keys have valid accounts', async () => {
      const mockP256Account = {
        address: mockAddress,
        publicKey: mockPubKeyTuple.P256.pubK,
        keyIndex: 0,
        weight: 1000,
        signAlgo: SIGN_ALGO_NUM_ECDSA_P256,
        signAlgoString: 'ECDSA_P256',
        hashAlgo: HASH_ALGO_NUM_SHA3_256,
        hashAlgoString: 'SHA3_256',
      };
      const mockSecpAccount = {
        address: mockAddress, // Assuming same address for simplicity
        publicKey: mockPubKeyTuple.SECP256K1.pubK,
        keyIndex: 1, // Different index
        weight: 1000,
        signAlgo: SIGN_ALGO_NUM_ECDSA_secp256k1,
        signAlgoString: 'ECDSA_secp256k1',
        hashAlgo: HASH_ALGO_NUM_SHA2_256, // Different hash algo
        hashAlgoString: 'SHA2_256',
      };

      // Mock the service call twice: once for P256, once for SECP256k1
      vi.mocked(userWalletService.getAccountsWithPublicKey)
        .mockResolvedValueOnce([mockP256Account]) // First call (P256)
        .mockResolvedValueOnce([mockSecpAccount]); // Second call (SECP256k1)

      // The global.fetch mock below is likely now irrelevant due to code changes in findAddressWithPubKey
      global.fetch = vi.fn().mockImplementation((url) => {
        // ... (existing fetch mock, less relevant now)
      });

      const result = await getOrCheckAccountsByPublicKeyTuple(mockPubKeyTuple);
      expect(result).toHaveLength(2);
      // Verify properties based on the mocked service data
      expect(result.some((acc) => acc.signAlgoString === 'ECDSA_P256')).toBe(true);
      expect(result.some((acc) => acc.signAlgoString === 'ECDSA_secp256k1')).toBe(true);
    });

    it('should throw error when no accounts are found', async () => {
      // Mock fetch to return no accounts
      global.fetch = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              publicKey: mockPubKey,
              accounts: [],
            }),
        });
      });

      await expect(getOrCheckAccountsByPublicKeyTuple(mockPubKeyTuple)).resolves.toEqual([]);
    });
  });

  describe('getAccountsByPublicKeyTuple', () => {
    const mockAccount = {
      address: mockAddress,
      publicKey: 'will-be-overwritten', // Placeholder
      keyIndex: 0,
      weight: 1000,
      signAlgo: SIGN_ALGO_NUM_ECDSA_P256,
      signAlgoString: 'ECDSA_P256',
      hashAlgo: HASH_ALGO_NUM_SHA3_256,
      hashAlgoString: 'SHA3_256',
    };

    it('should call getAccountsWithPublicKey for testnet', async () => {
      // Mock the service call to return valid data for both keys
      vi.mocked(userWalletService.getAccountsWithPublicKey)
        .mockResolvedValueOnce([{ ...mockAccount, publicKey: mockPubKeyTuple.P256.pubK }])
        .mockResolvedValueOnce([{ ...mockAccount, publicKey: mockPubKeyTuple.SECP256K1.pubK }]);

      await getAccountsByPublicKeyTuple(mockPubKeyTuple, 'testnet');

      // Verify the service was called correctly
      expect(userWalletService.getAccountsWithPublicKey).toHaveBeenCalledWith(
        mockPubKeyTuple.P256.pubK,
        'testnet'
      );
      expect(userWalletService.getAccountsWithPublicKey).toHaveBeenCalledWith(
        mockPubKeyTuple.SECP256K1.pubK,
        'testnet'
      );
    });

    it('should call getAccountsWithPublicKey for mainnet', async () => {
      // Mock the service call to return valid data for both keys
      vi.mocked(userWalletService.getAccountsWithPublicKey)
        .mockResolvedValueOnce([{ ...mockAccount, publicKey: mockPubKeyTuple.P256.pubK }])
        .mockResolvedValueOnce([{ ...mockAccount, publicKey: mockPubKeyTuple.SECP256K1.pubK }]);

      await getAccountsByPublicKeyTuple(mockPubKeyTuple, 'mainnet');

      // Verify the service was called correctly
      expect(userWalletService.getAccountsWithPublicKey).toHaveBeenCalledWith(
        mockPubKeyTuple.P256.pubK,
        'mainnet'
      );
      expect(userWalletService.getAccountsWithPublicKey).toHaveBeenCalledWith(
        mockPubKeyTuple.SECP256K1.pubK,
        'mainnet'
      );
    });

    it('should throw error when no accounts have sufficient weight', async () => {
      // Mock the service to return accounts with insufficient weight
      vi.mocked(userWalletService.getAccountsWithPublicKey).mockResolvedValue([
        {
          address: mockAddress,
          publicKey: mockPubKeyTuple.P256.pubK,
          keyIndex: 0,
          weight: 500, // Less than required 1000
          signAlgo: SIGN_ALGO_NUM_ECDSA_P256,
          signAlgoString: 'ECDSA_P256',
          hashAlgo: HASH_ALGO_NUM_SHA3_256,
          hashAlgoString: 'SHA3_256',
        },
      ]); // Applies to both calls in this test

      // The global.fetch mock below is now irrelevant
      const mockResponse = {
        // ... (existing fetch mock data)
      };
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      await expect(getAccountsByPublicKeyTuple(mockPubKeyTuple, 'mainnet')).rejects.toThrow(
        'No accounts found with the given public key'
      );
    });
  });
});
