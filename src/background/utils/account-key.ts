import { type PublicKeyTuple, tupleToPubKey } from '@/shared/types/key-types';
import { type PublicKeyAccount } from '@/shared/types/wallet-types';

import type { AccountKeyRequest } from '../../shared/types/network-types';
import {
  FLOW_BIP44_PATH,
  HASH_ALGO_NUM_DEFAULT,
  SIGN_ALGO_NUM_DEFAULT,
  DEFAULT_WEIGHT,
  HASH_ALGO_NUM_SHA2_256,
  HASH_ALGO_NUM_SHA3_256,
  SIGN_ALGO_NUM_ECDSA_P256,
  SIGN_ALGO_NUM_ECDSA_secp256k1,
} from '../../shared/utils/algo-constants';

import { seedWithPathAndPhrase2PublicPrivateKey } from './modules/publicPrivateKey';

export const defaultAccountKey = (pubKeyTuple: PublicKeyTuple): AccountKeyRequest => {
  return {
    hash_algo: HASH_ALGO_NUM_DEFAULT,
    sign_algo: SIGN_ALGO_NUM_DEFAULT,
    weight: DEFAULT_WEIGHT,
    public_key: tupleToPubKey(pubKeyTuple, SIGN_ALGO_NUM_DEFAULT),
  };
};

export const getAccountKey = async (mnemonic: string): Promise<AccountKeyRequest> => {
  // Get the public key from the mnemonic
  const pubKTuple = await seedWithPathAndPhrase2PublicPrivateKey(mnemonic, FLOW_BIP44_PATH);
  return defaultAccountKey(pubKTuple);
};

export const pubKeyAccountToAccountKey = (pubKeyAccount: PublicKeyAccount): AccountKeyRequest => {
  return {
    public_key: pubKeyAccount.publicKey,
    sign_algo: pubKeyAccount.signAlgo,
    hash_algo: pubKeyAccount.hashAlgo,
    weight: pubKeyAccount.weight,
  };
};

export const pubKeyTupleToAccountKey = (
  pubKey: string,
  pubKeyTuple: PublicKeyTuple
): AccountKeyRequest => {
  if (pubKey === pubKeyTuple.P256.pubK) {
    return {
      public_key: pubKey,
      sign_algo: SIGN_ALGO_NUM_ECDSA_P256,
      hash_algo: HASH_ALGO_NUM_SHA3_256,
      weight: DEFAULT_WEIGHT,
    };
  }
  if (pubKey === pubKeyTuple.SECP256K1.pubK) {
    return {
      public_key: pubKey,
      sign_algo: SIGN_ALGO_NUM_ECDSA_secp256k1,
      hash_algo: HASH_ALGO_NUM_SHA2_256,
      weight: DEFAULT_WEIGHT,
    };
  }
  throw new Error('Invalid public key');
};

export const pubKeySignAlgoToAccountKey = (pubKey: string, signAlgo: number): AccountKeyRequest => {
  return {
    public_key: pubKey,
    sign_algo: signAlgo,
    hash_algo:
      signAlgo === SIGN_ALGO_NUM_ECDSA_P256 ? HASH_ALGO_NUM_SHA3_256 : HASH_ALGO_NUM_SHA2_256,
    weight: DEFAULT_WEIGHT,
  };
};
