import { ctr } from '@noble/ciphers/aes';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { scrypt } from '@noble/hashes/scrypt';
import { sha256 } from '@noble/hashes/sha2';
import { keccak_256 } from '@noble/hashes/sha3';
import { concatBytes } from '@noble/hashes/utils';

import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

interface KeystoreV3 {
  version: number;
  id: string;
  address?: string;
  crypto: {
    ciphertext: string;
    cipherparams: {
      iv: string;
    };
    cipher: string;
    kdf: string;
    kdfparams: {
      dklen: number;
      salt: string;
      n?: number;
      r?: number;
      p?: number;
      c?: number;
      prf?: string;
    };
    mac: string;
  };
}

/**
 * Decrypt an Ethereum JSON keystore file
 * @param json - JSON keystore content as string
 * @param password - Password to decrypt the keystore
 * @returns Decrypted private key as Uint8Array or null if decryption fails
 */
export async function decryptJsonKeystore(
  json: string,
  password: string
): Promise<Uint8Array | null> {
  try {
    const keystore: KeystoreV3 = JSON.parse(json);

    // Validate keystore format
    if (!keystore.crypto || !keystore.crypto.ciphertext) {
      throw new Error('Invalid keystore format');
    }

    const { crypto } = keystore;

    // Only support AES-128-CTR cipher
    if (crypto.cipher !== 'aes-128-ctr') {
      throw new Error(`Unsupported cipher: ${crypto.cipher}`);
    }

    // Derive key using KDF
    let derivedKey: Uint8Array;
    const passwordBytes = new TextEncoder().encode(password);
    const salt = Buffer.from(crypto.kdfparams.salt, 'hex');

    if (crypto.kdf === 'scrypt') {
      const { n = 262144, r = 8, p = 1, dklen = 32 } = crypto.kdfparams;
      derivedKey = scrypt(passwordBytes, salt, { N: n, r, p, dkLen: dklen });
    } else if (crypto.kdf === 'pbkdf2') {
      const { c = 262144, dklen = 32, prf = 'hmac-sha256' } = crypto.kdfparams;
      if (prf !== 'hmac-sha256') {
        throw new Error(`Unsupported PRF: ${prf}`);
      }
      derivedKey = pbkdf2(sha256, passwordBytes, salt, { c, dkLen: dklen });
    } else {
      throw new Error(`Unsupported KDF: ${crypto.kdf}`);
    }

    // Verify MAC
    const ciphertext = Buffer.from(crypto.ciphertext, 'hex');
    const macData = concatBytes(derivedKey.slice(16, 32), ciphertext);
    const mac = keccak_256(macData);
    const expectedMac = Buffer.from(crypto.mac, 'hex');

    const macArray = new Uint8Array(mac);
    const expectedMacArray = new Uint8Array(expectedMac);

    // Better constant-time comparison
    let result = macArray.length ^ expectedMacArray.length; // XOR lengths
    for (let i = 0; i < Math.min(macArray.length, expectedMacArray.length); i++) {
      result |= macArray[i] ^ expectedMacArray[i]; // XOR each byte
    }
    const mismatch = result !== 0;

    if (mismatch) {
      throw new Error('Invalid password - MAC verification failed');
    }

    // Decrypt private key
    const iv = Buffer.from(crypto.cipherparams.iv, 'hex');
    const aes = ctr(derivedKey.slice(0, 16), iv);
    const privateKey = aes.decrypt(ciphertext);

    return privateKey;
  } catch (error) {
    consoleError('Failed to decrypt keystore:', error);
    return null;
  }
}
