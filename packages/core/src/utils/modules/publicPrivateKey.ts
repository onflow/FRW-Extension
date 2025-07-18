import storage from '@onflow/flow-wallet-extension-shared/storage';
import {
  FLOW_BIP44_PATH,
  SIGN_ALGO_NUM_ECDSA_P256,
  SIGN_ALGO_NUM_ECDSA_secp256k1,
} from '@onflow/flow-wallet-shared/constant/algo-constants';
import {
  type PrivateKeyTuple,
  type PublicKeyTuple,
  type PublicPrivateKeyTuple,
} from '@onflow/flow-wallet-shared/types/key-types';
import { CURRENT_ID_KEY } from '@onflow/flow-wallet-shared/types/keyring-types';
import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import { decryptJsonKeystore } from './keystore-decrypt';
import {
  seedWithPathAndPhrase2PublicPrivateKeyNoble,
  getPublicKeyFromPrivateKeyNoble,
  signWithKeyNoble,
  signMessageHashNoble,
  verifySignatureNoble,
} from './noble-crypto';

const jsonToKey = async (json: string, password: string) => {
  try {
    const privateKeyData = await decryptJsonKeystore(json, password);
    if (!privateKeyData) {
      return null;
    }
    // Return an object that mimics the TrustWallet PrivateKey interface
    // with a data() method that returns the private key bytes
    return {
      data: () => privateKeyData,
    };
  } catch (error) {
    consoleError(error);
    return null;
  }
};

const pkTuple2PubKeyTuple = async (pkTuple: PrivateKeyTuple): Promise<PublicKeyTuple> => {
  // The private keys could be different if created from a mnemonic
  const p256PubK = await getPublicKeyFromPrivateKeyNoble(pkTuple.P256.pk, SIGN_ALGO_NUM_ECDSA_P256);
  const secp256PubK = await getPublicKeyFromPrivateKeyNoble(
    pkTuple.SECP256K1.pk,
    SIGN_ALGO_NUM_ECDSA_secp256k1
  );

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
  const p256PubK = await getPublicKeyFromPrivateKeyNoble(pk, SIGN_ALGO_NUM_ECDSA_P256);
  const secp256PubK = await getPublicKeyFromPrivateKeyNoble(pk, SIGN_ALGO_NUM_ECDSA_secp256k1);

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
  // Use Noble implementation
  return getPublicKeyFromPrivateKeyNoble(pk, signAlgo);
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
  // Use Noble implementation
  return seedWithPathAndPhrase2PublicPrivateKeyNoble(seed, derivationPath, passphrase);
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
  const path = (await storage.get('temp_path')) || FLOW_BIP44_PATH;
  const passphrase = (await storage.get('temp_phrase')) || '';

  // Use Noble implementation
  return seedWithPathAndPhrase2PublicPrivateKeyNoble(seed, path, passphrase);
};
/**
 * Signs a hex encoded message using the private key
 * @param hashAlgo the hash algorithm to use
 * @param messageData the hex encoded message to sign
 * @returns the signature
 */
const signMessageHash = async (hashAlgo: number, messageData: string) => {
  // Use Noble implementation
  return signMessageHashNoble(hashAlgo, messageData);
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
  // Use Noble implementation
  return signWithKeyNoble(messageHex, signAlgo, hashAlgo, pk, includeV, isPrehashed);
};

const verifySignature = async (signature: string, message: unknown) => {
  try {
    // Use Noble implementation
    return verifySignatureNoble(signature, message);
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
