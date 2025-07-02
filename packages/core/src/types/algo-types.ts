export type SignAlgoString = 'ECDSA_P256' | 'ECDSA_secp256k1' | 'unknown' | string;

export type HashAlgoString =
  | 'SHA256'
  | 'SHA2_256'
  | 'SHA3_256'
  | 'SHA2_384'
  | 'SHA3_384'
  | 'unknown'
  | string;
export type ImportKeyType = 'Passkey' | 'GoogleDrive' | 'SeedPhrase' | 'Keystore' | 'PrivateKey';

export type RecoveryMechanismType = ImportKeyType | 'Multi-Backup' | 'Device-Backup';
