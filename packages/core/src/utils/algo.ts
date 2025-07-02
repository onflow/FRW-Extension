import type { HashAlgoString, SignAlgoString } from '@/shared/types/algo-types';

import {
  HASH_ALGO_NUM_SHA2_256,
  HASH_ALGO_NUM_SHA3_384,
  HASH_ALGO_NUM_SHA3_256,
  HASH_ALGO_NUM_SHA2_384,
  SIGN_ALGO_NUM_ECDSA_P256,
  SIGN_ALGO_NUM_ECDSA_secp256k1,
  SIGN_ALGO_NUM_BLS_BLS12_381,
  HASH_ALGO_NUM_KMAC128_BLS_BLS12_381,
} from './algo-constants';

export function getHashAlgo(value: string): number {
  switch (value) {
    case 'unknown':
      return 0;
    case 'SHA2_256':
      return HASH_ALGO_NUM_SHA2_256;
    case 'SHA2_384':
      return HASH_ALGO_NUM_SHA2_384;
    case 'SHA3_256':
      return HASH_ALGO_NUM_SHA3_256;
    case 'SHA3_384':
      return HASH_ALGO_NUM_SHA3_384;
    case 'KMAC128_BLS_BLS12_381':
      return HASH_ALGO_NUM_KMAC128_BLS_BLS12_381;
    default:
      return -1; // Handle unknown values
  }
}

export function getSignAlgo(value: string): number {
  switch (value) {
    case 'unknown':
      return 0;
    case 'ECDSA_P256':
      return SIGN_ALGO_NUM_ECDSA_P256;
    case 'ECDSA_p256':
      return SIGN_ALGO_NUM_ECDSA_P256;
    case 'ECDSA_SECP256k1':
      return SIGN_ALGO_NUM_ECDSA_secp256k1;
    case 'ECDSA_secp256k1':
      return SIGN_ALGO_NUM_ECDSA_secp256k1;
    case 'BLS_BLS12_381':
      return SIGN_ALGO_NUM_BLS_BLS12_381;
    default:
      return -1; // Handle unknown values
  }
}

export function getStringFromHashAlgo(value: number): HashAlgoString {
  switch (value) {
    case 0:
      return 'unknown';
    case HASH_ALGO_NUM_SHA2_256:
      return 'SHA2_256';
    case HASH_ALGO_NUM_SHA2_384:
      return 'SHA2_384';
    case HASH_ALGO_NUM_SHA3_256:
      return 'SHA3_256';
    case HASH_ALGO_NUM_SHA3_384:
      return 'SHA3_384';
    case HASH_ALGO_NUM_KMAC128_BLS_BLS12_381:
      return 'KMAC128_BLS_BLS12_381';
    default:
      return 'unknown'; // Handle unknown values
  }
}

export function getStringFromSignAlgo(value: number): SignAlgoString {
  switch (value) {
    case 0:
      return 'unknown';
    case SIGN_ALGO_NUM_ECDSA_P256:
      return 'ECDSA_P256';
    case SIGN_ALGO_NUM_ECDSA_secp256k1:
      return 'ECDSA_secp256k1';
    case SIGN_ALGO_NUM_BLS_BLS12_381:
      return 'BLS_BLS12_381';
    default:
      return 'unknown'; // Handle unknown values
  }
}
