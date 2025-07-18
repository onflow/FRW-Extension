import { p256 } from '@noble/curves/nist';
import { secp256k1 } from '@noble/curves/secp256k1';
import { hmac } from '@noble/hashes/hmac';
import { sha256, sha512 } from '@noble/hashes/sha2';
import { sha3_256 } from '@noble/hashes/sha3';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';

import {
  HASH_ALGO_NUM_SHA2_256,
  HASH_ALGO_NUM_SHA3_256,
  SIGN_ALGO_NUM_ECDSA_P256,
  SIGN_ALGO_NUM_ECDSA_secp256k1,
} from '@onflow/flow-wallet-shared/constant/algo-constants';
import { type PublicPrivateKeyTuple } from '@onflow/flow-wallet-shared/types/key-types';

// Custom BIP32 implementation for P256 curve to match TrustWallet
class P256HDKey {
  private privateKey: Uint8Array;
  private chainCode: Uint8Array;

  constructor(privateKey: Uint8Array, chainCode: Uint8Array) {
    this.privateKey = privateKey;
    this.chainCode = chainCode;
  }

  static fromMasterSeed(seed: Uint8Array): P256HDKey {
    // BIP32 master key generation using "Nist256p1 seed" as key
    const I = hmac(sha512, Buffer.from('Nist256p1 seed', 'utf8'), seed);
    const IL = I.slice(0, 32); // Private key
    const IR = I.slice(32); // Chain code
    return new P256HDKey(IL, IR);
  }

  derive(path: string): P256HDKey {
    const segments = path.split('/').slice(1); // Remove 'm'
    let key = new P256HDKey(this.privateKey, this.chainCode);

    for (const segment of segments) {
      const isHardened = segment.endsWith("'");
      const index = parseInt(isHardened ? segment.slice(0, -1) : segment, 10);
      key = key.deriveChild(index + (isHardened ? 0x80000000 : 0));
    }

    return key;
  }

  private deriveChild(index: number): P256HDKey {
    const isHardened = index >= 0x80000000;
    const data = new Uint8Array(37);

    if (isHardened) {
      // Hardened: 0x00 || private key || index
      data[0] = 0x00;
      data.set(this.privateKey, 1);
    } else {
      // Non-hardened: public key || index
      const pubKey = p256.getPublicKey(this.privateKey, true);
      data.set(pubKey, 0);
    }

    // Add index (big-endian)
    data[33] = (index >> 24) & 0xff;
    data[34] = (index >> 16) & 0xff;
    data[35] = (index >> 8) & 0xff;
    data[36] = index & 0xff;

    const I = hmac(sha512, this.chainCode, data);
    const IL = I.slice(0, 32);
    const IR = I.slice(32);

    // Add parent key to child key (mod n)
    const n = p256.CURVE.n;
    const parentKeyNum = BigInt('0x' + Buffer.from(this.privateKey).toString('hex'));
    const childKeyNum = BigInt('0x' + Buffer.from(IL).toString('hex'));

    // Check if childKeyNum is zero or equals n (invalid according to BIP32)
    if (childKeyNum === 0n || childKeyNum >= n) {
      throw new Error('Invalid child key derivation');
    }
    const newKeyNum = (parentKeyNum + childKeyNum) % n;

    // Ensure the derived key is within valid range (1 to n-1)
    if (newKeyNum <= 0n || newKeyNum >= n) {
      throw new Error('Invalid derived private key');
    }

    // Convert back to bytes (32 bytes, big-endian)
    const newKey = new Uint8Array(32);
    const hexStr = newKeyNum.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) {
      newKey[i] = parseInt(hexStr.slice(i * 2, (i + 1) * 2), 16);
    }

    return new P256HDKey(newKey, IR);
  }

  getPrivateKey(): Uint8Array {
    return this.privateKey;
  }
}

/**
 * Derives a key pair from a mnemonic and path.
 * @param mnemonic - The mnemonic phrase
 * @param path - The derivation path
 * @param passphrase - Optional passphrase
 * @returns The derived key pair
 */
export function seedWithPathAndPhrase2PublicPrivateKeyNoble(
  mnemonic: string,
  path: string,
  passphrase: string = ''
): PublicPrivateKeyTuple {
  const seed = mnemonicToSeedSync(mnemonic, passphrase);

  // P256 derivation using BIP32 with P256 curve (matching TrustWallet)
  const p256HDKey = P256HDKey.fromMasterSeed(seed);
  const p256Derived = p256HDKey.derive(path);
  const p256PrivateKey = p256Derived.getPrivateKey();

  // SECP256K1 derivation using standard BIP32
  const hdkey = HDKey.fromMasterSeed(seed);
  const derived = hdkey.derive(path);

  if (!derived.privateKey) {
    throw new Error('Could not derive secp256k1 private key');
  }
  const privateKey = derived.privateKey;

  // Generate public keys using their respective private keys
  const p256PubKey = p256.getPublicKey(p256PrivateKey, false);
  const secp256k1PubKey = secp256k1.getPublicKey(privateKey, false);

  // Convert to uncompressed format and remove the '04' prefix
  const p256PubKeyHex = Buffer.from(p256PubKey).toString('hex').replace(/^04/, '');
  const secp256k1PubKeyHex = Buffer.from(secp256k1PubKey).toString('hex').replace(/^04/, '');

  return {
    P256: {
      pubK: p256PubKeyHex,
      pk: Buffer.from(p256PrivateKey).toString('hex'),
    },
    SECP256K1: {
      pubK: secp256k1PubKeyHex,
      pk: Buffer.from(privateKey).toString('hex'),
    },
  };
}

/**
 * Get public key from private key for a specific algorithm
 * @param pk - Private key in hex
 * @param signAlgo - Signing algorithm (P256 or SECP256K1)
 * @returns Public key in hex
 */
export function getPublicKeyFromPrivateKeyNoble(pk: string, signAlgo: number): string {
  const privateKey = Buffer.from(pk, 'hex');

  if (signAlgo === SIGN_ALGO_NUM_ECDSA_P256) {
    const pubKey = p256.getPublicKey(privateKey, false);
    return Buffer.from(pubKey).toString('hex').replace(/^04/, '');
  } else if (signAlgo === SIGN_ALGO_NUM_ECDSA_secp256k1) {
    const pubKey = secp256k1.getPublicKey(privateKey, false);
    return Buffer.from(pubKey).toString('hex').replace(/^04/, '');
  } else {
    throw new Error(`Unsupported signAlgo: ${signAlgo}`);
  }
}

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
  // Type validation for message
  if (typeof message !== 'string' && typeof message !== 'object') {
    throw new Error('Message must be either a string or an object');
  }
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
