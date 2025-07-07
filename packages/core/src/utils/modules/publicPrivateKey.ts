import { initWasm } from '@trustwallet/wallet-core';

import {
  FLOW_BIP44_PATH,
  HASH_ALGO_NUM_SHA2_256,
  HASH_ALGO_NUM_SHA3_256,
  SIGN_ALGO_NUM_ECDSA_P256,
  SIGN_ALGO_NUM_ECDSA_secp256k1,
} from '@/shared/constant/algo-constants';
import {
  type PrivateKeyTuple,
  type PublicKeyTuple,
  type PublicPrivateKeyTuple,
} from '@/shared/types/key-types';
import { CURRENT_ID_KEY } from '@/shared/types/keyring-types';
import { consoleError } from '@/shared/utils/console-log';
import storage from '@/shared/utils/storage';

const jsonToKey = async (json: string, password: string) => {
  try {
    const { StoredKey, PrivateKey } = await initWasm();
    // It appears StoredKey.importJSON expects a Buffer, not a string
    const jsonBuffer = Buffer.from(json);
    const keystore = StoredKey.importJSON(jsonBuffer);
    const privateKeyData = keystore.decryptPrivateKey(Buffer.from(password));
    const privateKey = PrivateKey.createWithData(privateKeyData);
    return privateKey;
  } catch (error) {
    consoleError(error);
    return null;
  }
};

const pkTuple2PubKeyTuple = async (pkTuple: PrivateKeyTuple): Promise<PublicKeyTuple> => {
  const { PrivateKey } = await initWasm();
  // The private keys could be different if created from a mnemonic
  const p256pk = PrivateKey.createWithData(Buffer.from(pkTuple.P256.pk, 'hex'));
  const p256PubK = Buffer.from(p256pk.getPublicKeyNist256p1().uncompressed().data())
    .toString('hex')
    .replace(/^04/, '');

  const secp256pk = PrivateKey.createWithData(Buffer.from(pkTuple.SECP256K1.pk, 'hex'));
  const secp256PubK = Buffer.from(secp256pk.getPublicKeySecp256k1(false).data())
    .toString('hex')
    .replace(/^04/, '');
  return {
    P256: {
      pubK: p256PubK,
    },
    SECP256K1: {
      pubK: secp256PubK,
    },
  };
};

const pk2PubKey = async (pk: string): Promise<PublicKeyTuple> => {
  const { PrivateKey } = await initWasm();
  const privateKey = PrivateKey.createWithData(Buffer.from(pk, 'hex'));

  const p256PubK = Buffer.from(privateKey.getPublicKeyNist256p1().uncompressed().data())
    .toString('hex')
    .replace(/^04/, '');
  const secp256PubK = Buffer.from(privateKey.getPublicKeySecp256k1(false).data())
    .toString('hex')
    .replace(/^04/, '');
  return {
    P256: {
      pubK: p256PubK,
    },
    SECP256K1: {
      pubK: secp256PubK,
    },
  };
};

/**
 * Convert a private key to a public key
 * @param pk the private key
 * @param signAlgo the sign algorithm
 * @returns the public key
 */
const getPublicKeyFromPrivateKey = async (pk: string, signAlgo: number): Promise<string> => {
  const { PrivateKey } = await initWasm();
  const privateKey = PrivateKey.createWithData(Buffer.from(pk, 'hex'));
  if (signAlgo === SIGN_ALGO_NUM_ECDSA_P256) {
    return Buffer.from(privateKey.getPublicKeyNist256p1().uncompressed().data())
      .toString('hex')
      .replace(/^04/, '');
  } else if (signAlgo === SIGN_ALGO_NUM_ECDSA_secp256k1) {
    return Buffer.from(privateKey.getPublicKeySecp256k1(false).data())
      .toString('hex')
      .replace(/^04/, '');
  } else {
    throw new Error(`Unsupported signAlgo: ${signAlgo}`);
  }
};

const formPubKey = async (pubKey: string): Promise<PublicKeyTuple> => {
  return {
    P256: {
      pubK: pubKey,
    },
    SECP256K1: {
      pubK: pubKey,
    },
  };
};

const formPubKeyTuple = (pkTuple: PublicKeyTuple | PublicPrivateKeyTuple): PublicKeyTuple => {
  return {
    P256: {
      pubK: pkTuple.P256.pubK,
    },
    SECP256K1: {
      pubK: pkTuple.SECP256K1.pubK,
    },
  };
};

const seedWithPathAndPhrase2PublicPrivateKey = async (
  seed: string,
  derivationPath: string = FLOW_BIP44_PATH,
  passphrase: string = ''
): Promise<PublicPrivateKeyTuple> => {
  const { HDWallet, Curve } = await initWasm();

  const wallet = HDWallet.createWithMnemonic(seed, passphrase);
  const p256PK = wallet.getKeyByCurve(Curve.nist256p1, derivationPath);
  const p256PubK = Buffer.from(p256PK.getPublicKeyNist256p1().uncompressed().data())
    .toString('hex')
    .replace(/^04/, '');
  const SECP256PK = wallet.getKeyByCurve(Curve.secp256k1, derivationPath);
  const secp256PubK = Buffer.from(SECP256PK.getPublicKeySecp256k1(false).data())
    .toString('hex')
    .replace(/^04/, '');
  const keyTuple: PublicPrivateKeyTuple = {
    P256: {
      pubK: p256PubK,
      pk: Buffer.from(p256PK.data()).toString('hex'),
    },
    SECP256K1: {
      pubK: secp256PubK,
      pk: Buffer.from(SECP256PK.data()).toString('hex'),
    },
  };
  return keyTuple;
};

/**
 * @deprecated use seedWithPathAndPhrase2PublicPrivateKey instead
 */
const seed2PublicPrivateKey_depreciated = async (seed: string): Promise<PublicPrivateKeyTuple> => {
  const currentId = (await storage.get(CURRENT_ID_KEY)) ?? 0;

  // Note that currentAccountIndex is only used in keyring for old accounts that don't have an id stored in the keyring
  // currentId always takes precedence
  const accountIndex = (await storage.get('currentAccountIndex')) ?? 0;
  const pathKeyIndex = `user${accountIndex}_path`;
  const phraseKeyIndex = `user${accountIndex}_phrase`;

  const pathKeyId = `user${currentId}_path`;
  const phraseKeyId = `user${currentId}_phrase`;

  const derivationPath =
    (await storage.get(pathKeyId)) ?? (await storage.get(pathKeyIndex)) ?? FLOW_BIP44_PATH;

  const passphrase = (await storage.get(phraseKeyId)) ?? (await storage.get(phraseKeyIndex)) ?? '';

  return seedWithPathAndPhrase2PublicPrivateKey(seed, derivationPath, passphrase);
};

const seed2PublicPrivateKeyTemp = async (seed: string): Promise<PublicPrivateKeyTuple> => {
  const { HDWallet, Curve } = await initWasm();

  const path = (await storage.get('temp_path')) || FLOW_BIP44_PATH;
  const passphrase = (await storage.get('temp_phrase')) || '';
  const wallet = HDWallet.createWithMnemonic(seed, passphrase);
  const p256PK = wallet.getKeyByCurve(Curve.nist256p1, path);
  const p256PubK = Buffer.from(p256PK.getPublicKeyNist256p1().uncompressed().data())
    .toString('hex')
    .replace(/^04/, '');
  const SECP256PK = wallet.getKeyByCurve(Curve.secp256k1, path);
  const secp256PubK = Buffer.from(SECP256PK.getPublicKeySecp256k1(false).data())
    .toString('hex')
    .replace(/^04/, '');
  return {
    P256: {
      pubK: p256PubK,
      pk: Buffer.from(p256PK.data()).toString('hex'),
    },
    SECP256K1: {
      pubK: secp256PubK,
      pk: Buffer.from(SECP256PK.data()).toString('hex'),
    },
  };
};
/**
 * Signs a hex encoded message using the private key
 * @param hashAlgo the hash algorithm to use
 * @param messageData the hex encoded message to sign
 * @returns the signature
 */
const signMessageHash = async (hashAlgo: number, messageData: string) => {
  // Other key
  const { Hash } = await initWasm();
  const messageHash =
    hashAlgo === HASH_ALGO_NUM_SHA3_256
      ? Hash.sha3_256(Buffer.from(messageData, 'hex'))
      : Hash.sha256(Buffer.from(messageData, 'hex'));
  return messageHash;
};

/**
 * Signs a hex encoded message using the private key
 * @param messageHex the hex encoded message to sign
 * @param signAlgo the sign algorithm to use
 * @param hashAlgo the hash algorithm to use (used if message is not prehashed)
 * @param pk the private key to use
 * @param includeV if true, the signature will include the recovery id (v)
 * @param isPrehashed if true, messageHex is treated as a prehashed digest
 * @returns the signature
 */
const signWithKey = async (
  messageHex: string,
  signAlgo: number,
  hashAlgo: number,
  pk: string,
  includeV: boolean = false,
  isPrehashed: boolean = false
) => {
  const { Curve, Hash, PrivateKey } = await initWasm();
  const messageBuffer = Buffer.from(messageHex, 'hex');
  const privateKey = PrivateKey.createWithData(Buffer.from(pk, 'hex'));

  let selectedCurve: typeof Curve.secp256k1 | typeof Curve.nist256p1; // TrustWallet's Curve type
  if (signAlgo === SIGN_ALGO_NUM_ECDSA_secp256k1) {
    selectedCurve = Curve.secp256k1;
  } else if (signAlgo === SIGN_ALGO_NUM_ECDSA_P256) {
    selectedCurve = Curve.nist256p1;
  } else {
    throw new Error(`Unsupported signAlgo: ${signAlgo} - pk: ${pk.substring(0, 10)}`);
  }
  let digestToSign: Uint8Array = messageBuffer;
  if (isPrehashed) {
    digestToSign = messageBuffer;
  } else {
    if (hashAlgo === HASH_ALGO_NUM_SHA3_256) {
      digestToSign = Hash.sha3_256(messageBuffer);
    } else if (hashAlgo === HASH_ALGO_NUM_SHA2_256) {
      digestToSign = Hash.sha256(messageBuffer);
    } else {
      throw new Error(`Unsupported hashAlgo: ${hashAlgo}`);
    }
  }

  // Ensure digest is 32 bytes for secp256k1 if prehashed, as privateKey.sign might expect it.
  // If not prehashed, Hash.sha256/sha3_256 will produce 32 bytes.
  if (isPrehashed && selectedCurve === Curve.secp256k1 && digestToSign.length !== 32) {
    throw new Error('Prehashed digest for secp256k1 signing must be 32 bytes long.');
  }

  const signature = privateKey.sign(digestToSign, selectedCurve);
  // For secp256k1, privateKey.sign from TrustWallet usually returns r (32) + s (32) + v (1, recId 0/1).
  // For nist256p1, it might be DER or just r (32) + s (32).
  // The test expects r+s+v (v=recId), so this should align if Wallet Core behaves as such for secp256k1.
  if (includeV) {
    return Buffer.from(signature).toString('hex');
  } else {
    return Buffer.from(signature.subarray(0, signature.length - 1)).toString('hex');
  }
};

const verifySignature = async (signature: string, message: unknown) => {
  try {
    const { PublicKey, PublicKeyType, Hash } = await initWasm();
    const scriptsPublicKey = process.env.SCRIPTS_PUBLIC_KEY;
    if (!scriptsPublicKey) {
      throw new Error('SCRIPTS_PUBLIC_KEY is not set');
    }

    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);

    const messageHash = Hash.sha256(Buffer.from(messageStr, 'utf8'));
    const signatureBuffer = Buffer.from(signature, 'hex');
    const pubkeyData = Buffer.from(
      '04' + scriptsPublicKey.replace('0x', '').replace(/^04/, ''),
      'hex'
    );

    const pubKey = PublicKey.createWithData(pubkeyData, PublicKeyType.nist256p1Extended);
    if (!pubKey) {
      throw new Error('Failed to create public key');
    }

    return pubKey.verify(signatureBuffer, messageHash);
  } catch (error) {
    consoleError(
      'Failed to verify signature:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
};

export {
  formPubKey,
  formPubKeyTuple,
  getPublicKeyFromPrivateKey,
  jsonToKey,
  pk2PubKey as pk2PubKeyTuple,
  pkTuple2PubKeyTuple as pkTuple2PubKey,
  seed2PublicPrivateKey_depreciated as seed2PublicPrivateKey,
  seed2PublicPrivateKeyTemp,
  seedWithPathAndPhrase2PublicPrivateKey,
  signMessageHash,
  signWithKey,
  verifySignature,
};
