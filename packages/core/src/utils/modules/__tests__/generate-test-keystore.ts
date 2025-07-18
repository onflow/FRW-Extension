import { ctr } from '@noble/ciphers/aes';
import { scrypt } from '@noble/hashes/scrypt';
import { keccak_256 } from '@noble/hashes/sha3';
import { concatBytes, randomBytes } from '@noble/hashes/utils';

/**
 * Generate a test keystore for testing
 */
export function generateTestKeystore(privateKey: Uint8Array, password: string) {
  const salt = randomBytes(32);
  const iv = randomBytes(16);
  const dklen = 32;

  // Derive key using scrypt
  const derivedKey = scrypt(new TextEncoder().encode(password), salt, {
    N: 8192,
    r: 8,
    p: 1,
    dkLen: dklen,
  });

  // Encrypt private key
  const aes = ctr(derivedKey.slice(0, 16), iv);
  const ciphertext = aes.encrypt(privateKey);

  // Generate MAC
  const macData = concatBytes(derivedKey.slice(16, 32), ciphertext);
  const mac = keccak_256(macData);

  return {
    version: 3,
    id: 'test-id',
    crypto: {
      ciphertext: Buffer.from(ciphertext).toString('hex'),
      cipherparams: {
        iv: Buffer.from(iv).toString('hex'),
      },
      cipher: 'aes-128-ctr',
      kdf: 'scrypt',
      kdfparams: {
        dklen: 32,
        salt: Buffer.from(salt).toString('hex'),
        n: 8192,
        r: 8,
        p: 1,
      },
      mac: Buffer.from(mac).toString('hex'),
    },
  };
}
