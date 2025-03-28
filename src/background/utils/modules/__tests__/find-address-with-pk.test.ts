import { describe, it, expect, vi, beforeEach } from 'vitest';

import { FLOW_BIP44_PATH } from '@/shared/utils/algo-constants';

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
      vi.mocked(publicPrivateKeyModule.pk2PubKey).mockResolvedValueOnce(mockPubKeyTuple);

      const mockAccounts = [
        {
          address: mockAddress,
          keyIndex: 0,
          weight: 1000,
          hashAlgo: 3,
          signAlgo: 1,
          hashAlgoString: 'SHA3_256',
          signAlgoString: 'ECDSA_P256',
          publicKey: mockP256PubKey,
        },
      ];

      vi.mocked(
        findAddressWithPubKeyModule.getOrCheckAddressByPublicKeyTuple
      ).mockResolvedValueOnce(mockAccounts);

      const result = await findAddressWithPK(mockPK, mockAddress);

      expect(publicPrivateKeyModule.pk2PubKey).toHaveBeenCalledWith(mockPK);
      expect(findAddressWithPubKeyModule.getOrCheckAddressByPublicKeyTuple).toHaveBeenCalledWith(
        mockPubKeyTuple,
        mockAddress
      );
      expect(result).toEqual(mockAccounts);
    });

    it('should throw error when no accounts are found', async () => {
      vi.mocked(publicPrivateKeyModule.pk2PubKey).mockResolvedValueOnce(mockPubKeyTuple);
      vi.mocked(
        findAddressWithPubKeyModule.getOrCheckAddressByPublicKeyTuple
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
          hashAlgo: 3,
          signAlgo: 1,
          hashAlgoString: 'SHA3_256',
          signAlgoString: 'ECDSA_P256',
          publicKey: mockP256PubKey,
        },
      ];

      vi.mocked(
        findAddressWithPubKeyModule.getOrCheckAddressByPublicKeyTuple
      ).mockResolvedValueOnce(mockAccounts);

      const result = await findAddressWithSeed(mockSeed, mockAddress);

      expect(publicPrivateKeyModule.seedWithPathAndPhrase2PublicPrivateKey).toHaveBeenCalledWith(
        mockSeed,
        FLOW_BIP44_PATH,
        ''
      );
      expect(publicPrivateKeyModule.seed2PublicPrivateKeyTemp).not.toHaveBeenCalled();
      expect(findAddressWithPubKeyModule.getOrCheckAddressByPublicKeyTuple).toHaveBeenCalledWith(
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
          hashAlgo: 3,
          signAlgo: 1,
          hashAlgoString: 'SHA3_256',
          signAlgoString: 'ECDSA_P256',
          publicKey: mockP256PubKey,
        },
      ];

      vi.mocked(
        findAddressWithPubKeyModule.getOrCheckAddressByPublicKeyTuple
      ).mockResolvedValueOnce(mockAccounts);

      const result = await findAddressWithSeed(mockSeed, mockAddress);

      expect(publicPrivateKeyModule.seed2PublicPrivateKey).not.toHaveBeenCalled();
      expect(findAddressWithPubKeyModule.getOrCheckAddressByPublicKeyTuple).toHaveBeenCalledWith(
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
        findAddressWithPubKeyModule.getOrCheckAddressByPublicKeyTuple
      ).mockRejectedValueOnce(new Error('No accounts found with the given public key'));

      await expect(findAddressWithSeed(mockSeed, mockAddress)).rejects.toThrow(
        'No accounts found with the given public key'
      );
    });
  });
});
