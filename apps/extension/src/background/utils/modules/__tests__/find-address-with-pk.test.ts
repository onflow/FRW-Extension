import { describe, it, expect, vi, beforeEach } from 'vitest';

import { mixpanelTrack } from '@/background/service';
import {
  FLOW_BIP44_PATH,
  HASH_ALGO_NUM_SHA3_256,
  SIGN_ALGO_NUM_ECDSA_P256,
} from '@/shared/utils/algo-constants';

import { findAddressWithPK, findAddressWithSeed } from '../findAddressWithPK';
import * as findAddressWithPubKeyModule from '../findAddressWithPubKey';
import * as publicPrivateKeyModule from '../publicPrivateKey';

// Mock the dependent modules
vi.mock('../publicPrivateKey');
vi.mock('../findAddressWithPubKey');
vi.mock('@/background/service', () => ({
  userWalletService: {
    setupFcl: vi.fn(),
  },
  mixpanelTrack: {
    identify: vi.fn(),
  },
  openapiService: {
    getAccountsWithPublicKey: vi.fn().mockResolvedValue([]),
  },
  notificationService: {
    showNotification: vi.fn(),
  },
  permissionService: {
    getPermission: vi.fn().mockResolvedValue({
      permission: 'granted',
    }),
  },
}));

describe('findAddressWithPK module', () => {
  const mockP256PubKey = '0x123456789abcdef_p256';
  const mockSECP256K1PubKey = '0x123456789abcdef_secp256k1';
  const mockAddress = '0x1234';
  const mockPK = 'mock-private-key';
  const mockSeed = 'mock-seed';

  const mockPubKeyTuple = {
    P256: {
      pubK: mockP256PubKey,
      pk: 'mock-p256-pk',
    },
    SECP256K1: {
      pubK: mockSECP256K1PubKey,
      pk: 'mock-secp256k1-pk',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAddressWithPK', () => {
    it('should convert PK to public keys and find address', async () => {
      vi.mocked(publicPrivateKeyModule.pk2PubKeyTuple).mockResolvedValueOnce(mockPubKeyTuple);

      const mockAccounts = [
        {
          address: mockAddress,
          keyIndex: 0,
          weight: 1000,
          hashAlgo: HASH_ALGO_NUM_SHA3_256,
          signAlgo: SIGN_ALGO_NUM_ECDSA_P256,
          hashAlgoString: 'SHA3_256',
          signAlgoString: 'ECDSA_P256',
          publicKey: mockP256PubKey,
        },
      ];

      vi.mocked(
        findAddressWithPubKeyModule.getOrCheckAccountsByPublicKeyTuple
      ).mockResolvedValueOnce(mockAccounts);

      const result = await findAddressWithPK(mockPK, mockAddress);

      expect(publicPrivateKeyModule.pk2PubKeyTuple).toHaveBeenCalledWith(mockPK);
      expect(findAddressWithPubKeyModule.getOrCheckAccountsByPublicKeyTuple).toHaveBeenCalledWith(
        mockPubKeyTuple,
        mockAddress
      );
      expect(result).toEqual(mockAccounts);
    });

    it('should throw error when no accounts are found', async () => {
      vi.mocked(publicPrivateKeyModule.pk2PubKeyTuple).mockResolvedValueOnce(mockPubKeyTuple);
      vi.mocked(
        findAddressWithPubKeyModule.getOrCheckAccountsByPublicKeyTuple
      ).mockRejectedValueOnce(new Error('No accounts found with the given public key'));

      await expect(findAddressWithPK(mockPK, mockAddress)).rejects.toThrow(
        'No accounts found with the given public key'
      );
    });
  });

  describe('findAddressWithSeed', () => {
    it('should convert seed to public keys and find address (non-temp)', async () => {
      vi.mocked(
        publicPrivateKeyModule.seedWithPathAndPhrase2PublicPrivateKey
      ).mockResolvedValueOnce(mockPubKeyTuple);

      const mockAccounts = [
        {
          address: mockAddress,
          keyIndex: 0,
          weight: 1000,
          hashAlgo: HASH_ALGO_NUM_SHA3_256,
          signAlgo: SIGN_ALGO_NUM_ECDSA_P256,
          hashAlgoString: 'SHA3_256',
          signAlgoString: 'ECDSA_P256',
          publicKey: mockP256PubKey,
        },
      ];

      vi.mocked(
        findAddressWithPubKeyModule.getOrCheckAccountsByPublicKeyTuple
      ).mockResolvedValueOnce(mockAccounts);

      const result = await findAddressWithSeed(mockSeed, mockAddress);

      expect(publicPrivateKeyModule.seedWithPathAndPhrase2PublicPrivateKey).toHaveBeenCalledWith(
        mockSeed,
        FLOW_BIP44_PATH,
        ''
      );
      expect(publicPrivateKeyModule.seed2PublicPrivateKeyTemp).not.toHaveBeenCalled();
      expect(findAddressWithPubKeyModule.getOrCheckAccountsByPublicKeyTuple).toHaveBeenCalledWith(
        mockPubKeyTuple,
        mockAddress
      );
      expect(result).toEqual(mockAccounts);
    });

    it('should convert seed to public keys and find address (temp)', async () => {
      vi.mocked(
        publicPrivateKeyModule.seedWithPathAndPhrase2PublicPrivateKey
      ).mockResolvedValueOnce(mockPubKeyTuple);

      const mockAccounts = [
        {
          address: mockAddress,
          keyIndex: 0,
          weight: 1000,
          hashAlgo: HASH_ALGO_NUM_SHA3_256,
          signAlgo: SIGN_ALGO_NUM_ECDSA_P256,
          hashAlgoString: 'SHA3_256',
          signAlgoString: 'ECDSA_P256',
          publicKey: mockP256PubKey,
        },
      ];

      vi.mocked(
        findAddressWithPubKeyModule.getOrCheckAccountsByPublicKeyTuple
      ).mockResolvedValueOnce(mockAccounts);

      const result = await findAddressWithSeed(mockSeed, mockAddress);

      expect(publicPrivateKeyModule.seed2PublicPrivateKey).not.toHaveBeenCalled();
      expect(findAddressWithPubKeyModule.getOrCheckAccountsByPublicKeyTuple).toHaveBeenCalledWith(
        mockPubKeyTuple,
        mockAddress
      );
      expect(result).toEqual(mockAccounts);
    });

    it('should throw error when no accounts are found', async () => {
      vi.mocked(publicPrivateKeyModule.seed2PublicPrivateKey).mockResolvedValueOnce(
        mockPubKeyTuple
      );
      vi.mocked(
        findAddressWithPubKeyModule.getOrCheckAccountsByPublicKeyTuple
      ).mockRejectedValueOnce(new Error('No accounts found with the given public key'));

      await expect(findAddressWithSeed(mockSeed, mockAddress)).rejects.toThrow(
        'No accounts found with the given public key'
      );
    });
  });
});
