import {
  SIGN_ALGO_NUM_ECDSA_P256,
  SIGN_ALGO_NUM_ECDSA_secp256k1,
} from '@/shared/utils/algo-constants';

export type PublicPrivateKey = {
  publicKey: string;
  privateKey: string;
  signAlgo: number;
};

export type PublicKeyTuple = {
  P256: { pubK: string };
  SECP256K1: { pubK: string };
};
export type PrivateKeyTuple = {
  P256: { pk: string };
  SECP256K1: { pk: string };
};

export type PublicPrivateKeyTuple = PublicKeyTuple & PrivateKeyTuple;

export const combinePubPkTuple = (
  pubKeyTuple: PublicKeyTuple,
  pkTuple: PrivateKeyTuple
): PublicPrivateKeyTuple => {
  return {
    P256: {
      pubK: pubKeyTuple.P256.pubK,
      pk: pkTuple.P256.pk,
    },
    SECP256K1: {
      pubK: pubKeyTuple.SECP256K1.pubK,

      pk: pkTuple.SECP256K1.pk,
    },
  };
};
export const combinePubPkString = (
  pubKeyTuple: PublicKeyTuple,
  pk: string
): PublicPrivateKeyTuple => {
  return {
    P256: {
      pubK: pubKeyTuple.P256.pubK,
      pk,
    },
    SECP256K1: {
      pubK: pubKeyTuple.SECP256K1.pubK,
      pk,
    },
  };
};
export const tupleToPubKey = (tuple: PublicKeyTuple, signAlgo: number): string => {
  if (signAlgo === SIGN_ALGO_NUM_ECDSA_P256) {
    return tuple.P256.pubK;
  }
  if (signAlgo === SIGN_ALGO_NUM_ECDSA_secp256k1) {
    return tuple.SECP256K1.pubK;
  }
  throw new Error('Invalid algo');
};

/**
 * Get the private key from the public key tuple
 * @param tuple - The public key tuple
 * @param signAlgo - The sign algorithm
 * @returns The private key
 */
export const tupleToPrivateKey = (tuple: PublicPrivateKeyTuple, signAlgo: number): string => {
  if (signAlgo === SIGN_ALGO_NUM_ECDSA_P256) {
    return tuple.P256.pk;
  }
  if (signAlgo === SIGN_ALGO_NUM_ECDSA_secp256k1) {
    return tuple.SECP256K1.pk;
  }
  throw new Error('Invalid algo');
};
