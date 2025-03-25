import { type SignAlgoString, type HashAlgoString, type ImportKeyType } from '../types/algo-types';

const FLOW_BIP44_PATH = "m/44'/539'/0'/0/0";

const KEY_TYPE: { [key: string]: ImportKeyType } = {
  PASSKEY: 'Passkey',
  GOOGLE_DRIVE: 'GoogleDrive',
  SEED_PHRASE: 'SeedPhrase',
  KEYSTORE: 'Keystore',
  PRIVATE_KEY: 'PrivateKey',
};

const SIGN_ALGO: { [key: string]: SignAlgoString } = {
  P256: 'ECDSA_P256',
  SECP256K1: 'ECDSA_secp256k1',
};

const HASH_ALGO: { [key: string]: HashAlgoString } = {
  SHA256: 'SHA256',
  SHA3_256: 'SHA3_256',
};

export { FLOW_BIP44_PATH, KEY_TYPE, SIGN_ALGO, HASH_ALGO };
