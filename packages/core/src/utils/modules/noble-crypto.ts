import { p256 } from '@noble/curves/nist';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha2';
import { sha3_256 } from '@noble/hashes/sha3';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeed } from '@scure/bip39';

import {
  HASH_ALGO_NUM_SHA2_256,
  HASH_ALGO_NUM_SHA3_256,
  SIGN_ALGO_NUM_ECDSA_P256,
  SIGN_ALGO_NUM_ECDSA_secp256k1,
} from '@onflow/flow-wallet-shared/constant/algo-constants';
import { type PublicPrivateKeyTuple } from '@onflow/flow-wallet-shared/types/key-types';

/**
 * Create HD wallet from mnemonic and get keys for a specific derivation path
 * @param mnemonic - BIP39 mnemonic phrase
 * @param passphrase - Optional passphrase
 * @param derivationPath - BIP44 derivation path
 * @returns PublicPrivateKeyTuple with P256 and SECP256K1 keys
 */
export const seedWithPathAndPhrase2PublicPrivateKeyNoble = async (
  mnemonic: string,
  derivationPath: string,
  passphrase: string = ''
): Promise<PublicPrivateKeyTuple> => {
  // Convert mnemonic to seed
  const seed = await mnemonicToSeed(mnemonic, passphrase);

  // Create HD key from seed
  const hdkey = HDKey.fromMasterSeed(seed);

  // Derive key at path
  const derived = hdkey.derive(derivationPath);

  if (!derived.privateKey) {
    throw new Error('Failed to derive private key');
  }

  // Get private key
  const privateKey = derived.privateKey;

  // Generate public keys for both curves
  const p256PubKey = p256.getPublicKey(privateKey);
  const secp256k1PubKey = secp256k1.getPublicKey(privateKey);

  // Convert to uncompressed format and remove the '04' prefix
  const p256PubKeyHex = Buffer.from(p256PubKey).toString('hex').replace(/^04/, '');
  const secp256k1PubKeyHex = Buffer.from(secp256k1PubKey).toString('hex').replace(/^04/, '');

  return {
    P256: {
      pubK: p256PubKeyHex,
      pk: Buffer.from(privateKey).toString('hex'),
    },
    SECP256K1: {
      pubK: secp256k1PubKeyHex,
      pk: Buffer.from(privateKey).toString('hex'),
    },
  };
};

/**
 * Get public key from private key for a specific algorithm
 * @param pk - Private key in hex
 * @param signAlgo - Signing algorithm (P256 or SECP256K1)
 * @returns Public key in hex without '04' prefix
 */
export const getPublicKeyFromPrivateKeyNoble = async (
  pk: string,
  signAlgo: number
): Promise<string> => {
  const privateKey = Buffer.from(pk, 'hex');

  if (signAlgo === SIGN_ALGO_NUM_ECDSA_P256) {
    const pubKey = p256.getPublicKey(privateKey);
    return Buffer.from(pubKey).toString('hex').replace(/^04/, '');
  } else if (signAlgo === SIGN_ALGO_NUM_ECDSA_secp256k1) {
    const pubKey = secp256k1.getPublicKey(privateKey);
    return Buffer.from(pubKey).toString('hex').replace(/^04/, '');
  } else {
    throw new Error(`Unsupported signAlgo: ${signAlgo}`);
  }
};

/**
 * Sign a message with a private key
 * @param messageHex - Message in hex format
 * @param signAlgo - Signing algorithm
 * @param hashAlgo - Hash algorithm
 * @param pk - Private key in hex
 * @param includeV - Include recovery ID (for ECDSA)
 * @param isPrehashed - Whether message is already hashed
 * @returns Signature in hex format
 */
export const signWithKeyNoble = async (
  messageHex: string,
  signAlgo: number,
  hashAlgo: number,
  pk: string,
  includeV: boolean = false,
  isPrehashed: boolean = false
): Promise<string> => {
  const messageBuffer = Buffer.from(messageHex, 'hex');
  const privateKey = Buffer.from(pk, 'hex');

  // Hash the message if not prehashed
  let digestToSign: Uint8Array;
  if (isPrehashed) {
    digestToSign = messageBuffer;
  } else {
    if (hashAlgo === HASH_ALGO_NUM_SHA3_256) {
      digestToSign = sha3_256(messageBuffer);
    } else if (hashAlgo === HASH_ALGO_NUM_SHA2_256) {
      digestToSign = sha256(messageBuffer);
    } else {
      throw new Error(`Unsupported hashAlgo: ${hashAlgo}`);
    }
  }

  // Sign based on algorithm
  if (signAlgo === SIGN_ALGO_NUM_ECDSA_P256) {
    const signature = p256.sign(digestToSign, privateKey);

    // P256 doesn't have recovery ID, so just return the signature
    return signature.toCompactHex();
  } else if (signAlgo === SIGN_ALGO_NUM_ECDSA_secp256k1) {
    const signature = secp256k1.sign(digestToSign, privateKey);

    if (includeV) {
      // Include recovery ID
      const signatureObj = signature;
      const r = signatureObj.r.toString(16).padStart(64, '0');
      const s = signatureObj.s.toString(16).padStart(64, '0');
      const v = (signatureObj.recovery ?? 0).toString(16).padStart(2, '0');
      return r + s + v;
    } else {
      return signature.toCompactHex();
    }
  } else {
    throw new Error(`Unsupported signAlgo: ${signAlgo}`);
  }
};

/**
 * Compute message hash
 * @param hashAlgo - Hash algorithm to use
 * @param messageData - Message data in hex
 * @returns Hash as Uint8Array
 */
export const signMessageHashNoble = async (
  hashAlgo: number,
  messageData: string
): Promise<Uint8Array> => {
  const messageBuffer = Buffer.from(messageData, 'hex');

  if (hashAlgo === HASH_ALGO_NUM_SHA3_256) {
    return sha3_256(messageBuffer);
  } else if (hashAlgo === HASH_ALGO_NUM_SHA2_256) {
    return sha256(messageBuffer);
  } else {
    throw new Error(`Unsupported hashAlgo: ${hashAlgo}`);
  }
};

/**
 * Verify a signature
 * @param signature - Signature in hex
 * @param message - Message to verify
 * @param publicKeyHex - Public key in hex (with or without '04' prefix)
 * @returns true if signature is valid
 */
export const verifySignatureNoble = async (
  signature: string,
  message: unknown,
  publicKeyHex?: string
): Promise<boolean> => {
  const scriptsPublicKey = publicKeyHex || process.env.SCRIPTS_PUBLIC_KEY;
  if (!scriptsPublicKey) {
    throw new Error('Public key is required for signature verification');
  }

  const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
  const messageHash = sha256(Buffer.from(messageStr, 'utf8'));

  // Ensure public key has '04' prefix for uncompressed format
  const pubKeyHex = scriptsPublicKey.replace('0x', '').replace(/^04/, '');
  const pubKeyBuffer = Buffer.from('04' + pubKeyHex, 'hex');

  try {
    return p256.verify(signature, messageHash, pubKeyBuffer);
  } catch {
    // Failed to verify signature
    return false;
  }
};
