import { type SignAlgoString, type HashAlgoString, type ImportKeyType } from '../types/algo-types';
export const FLOW_BIP44_PATH = "m/44'/539'/0'/0/0";

export const KEY_TYPE: { [key: string]: ImportKeyType } = {
  PASSKEY: 'Passkey',
  GOOGLE_DRIVE: 'GoogleDrive',
  SEED_PHRASE: 'SeedPhrase',
  KEYSTORE: 'Keystore',
  PRIVATE_KEY: 'PrivateKey',
};

// From the enum in the @onflow/typedefs package but not with the enum (as who want's an enum)
export const SIGN_ALGO_NUM_ECDSA_P256 = 1;
export const SIGN_ALGO_NUM_ECDSA_secp256k1 = 2;
export const SIGN_ALGO_NUM_BLS_BLS12_381 = 3;

export const HASH_ALGO_NUM_SHA2_256 = 1;
export const HASH_ALGO_NUM_SHA2_384 = 2;
export const HASH_ALGO_NUM_SHA3_256 = 3;
export const HASH_ALGO_NUM_SHA3_384 = 4;
export const HASH_ALGO_NUM_KMAC128_BLS_BLS12_381 = 5;

// Default hashAlgo and signAlgo for new accounts
export const SIGN_ALGO_NUM_DEFAULT = SIGN_ALGO_NUM_ECDSA_secp256k1;
export const HASH_ALGO_NUM_DEFAULT = HASH_ALGO_NUM_SHA2_256;

// note that HASH_ALGO_NUM_SHA3_256 is the default for SIGN_ALGO_NUM_ECDSA_P256
export const DEFAULT_WEIGHT = 1000;
export const SIGN_ALGO: { [key: string]: SignAlgoString } = {
  P256: 'ECDSA_P256',
  SECP256K1: 'ECDSA_secp256k1',
};

export const HASH_ALGO: { [key: string]: HashAlgoString } = {
  SHA256: 'SHA256',
  SHA3_256: 'SHA3_256',
};
