import type { HashAlgoString, SignAlgoString } from '@/shared/types/algo-types';

export function getHashAlgo(value: string): number {
  switch (value) {
    case 'unknown':
      return 0;
    case 'SHA2_256':
      return 1;
    case 'SHA2_384':
      return 2;
    case 'SHA3_256':
      return 3;
    case 'SHA3_384':
      return 4;
    default:
      return -1; // Handle unknown values
  }
}

export function getSignAlgo(value: string): number {
  switch (value) {
    case 'unknown':
      return 0;
    case 'ECDSA_P256':
      return 1;
    case 'ECDSA_p256':
      return 1;
    case 'ECDSA_SECP256k1':
      return 2;
    case 'ECDSA_secp256k1':
      return 2;
    default:
      return -1; // Handle unknown values
  }
}

export function getStringFromHashAlgo(value: number): HashAlgoString {
  switch (value) {
    case 0:
      return 'unknown';
    case 1:
      return 'SHA2_256';
    case 2:
      return 'SHA2_384';
    case 3:
      return 'SHA3_256';
    case 4:
      return 'SHA3_384';
    default:
      return 'unknown'; // Handle unknown values
  }
}

export function getStringFromSignAlgo(value: number): SignAlgoString {
  switch (value) {
    case 0:
      return 'unknown';
    case 1:
      return 'ECDSA_P256';
    case 2:
      return 'ECDSA_secp256k1';
    default:
      return 'unknown'; // Handle unknown values
  }
}
