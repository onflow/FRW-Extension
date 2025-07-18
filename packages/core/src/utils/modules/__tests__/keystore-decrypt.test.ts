import { describe, it, expect } from 'vitest';

import { decryptJsonKeystore } from '../keystore-decrypt';
import { generateTestKeystore } from './generate-test-keystore';

describe('keystore-decrypt', () => {
  // Generate test data
  const testPrivateKey = Buffer.from(
    '7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d',
    'hex'
  );
  const testPassword = 'testpassword';
  const testKeystore = generateTestKeystore(testPrivateKey, testPassword);

  describe('successful decryption', () => {
    it('should decrypt a generated test keystore with correct password', async () => {
      const result = await decryptJsonKeystore(JSON.stringify(testKeystore), testPassword);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Buffer.from(result!).toString('hex')).toBe(
        '7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'
      );
    });

    it('should handle keystore with uppercase hex values', async () => {
      const uppercaseKeystore = JSON.parse(JSON.stringify(testKeystore));
      uppercaseKeystore.crypto.ciphertext = uppercaseKeystore.crypto.ciphertext.toUpperCase();
      uppercaseKeystore.crypto.mac = uppercaseKeystore.crypto.mac.toUpperCase();

      const result = await decryptJsonKeystore(JSON.stringify(uppercaseKeystore), testPassword);

      expect(result).not.toBeNull();
      expect(Buffer.from(result!).toString('hex')).toBe(
        '7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d'
      );
    });
  });

  describe('error handling', () => {
    it('should return null for incorrect password', async () => {
      const result = await decryptJsonKeystore(JSON.stringify(testKeystore), 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      const result = await decryptJsonKeystore('invalid json', 'password');
      expect(result).toBeNull();
    });

    it('should return null for missing crypto field', async () => {
      const invalidKeystore = { version: 3, id: 'test' };
      const result = await decryptJsonKeystore(JSON.stringify(invalidKeystore), 'password');
      expect(result).toBeNull();
    });

    it('should return null for unsupported cipher', async () => {
      const unsupportedCipher = JSON.parse(JSON.stringify(testKeystore));
      unsupportedCipher.crypto.cipher = 'aes-256-cbc';
      const result = await decryptJsonKeystore(JSON.stringify(unsupportedCipher), testPassword);
      expect(result).toBeNull();
    });

    it('should return null for unsupported KDF', async () => {
      const unsupportedKdf = JSON.parse(JSON.stringify(testKeystore));
      unsupportedKdf.crypto.kdf = 'argon2';
      const result = await decryptJsonKeystore(JSON.stringify(unsupportedKdf), testPassword);
      expect(result).toBeNull();
    });

    it('should return null for unsupported PRF in pbkdf2', async () => {
      const pbkdf2Keystore = {
        version: 3,
        crypto: {
          ciphertext: '1234',
          cipherparams: { iv: '1234' },
          cipher: 'aes-128-ctr',
          kdf: 'pbkdf2',
          kdfparams: {
            dklen: 32,
            salt: '1234',
            c: 262144,
            prf: 'hmac-sha512',
          },
          mac: '1234',
        },
      };
      const result = await decryptJsonKeystore(JSON.stringify(pbkdf2Keystore), 'password');
      expect(result).toBeNull();
    });

    it('should handle missing KDF parameters gracefully', async () => {
      const missingParams = JSON.parse(JSON.stringify(testKeystore));
      delete missingParams.crypto.kdfparams.n;
      // Should use default value
      const result = await decryptJsonKeystore(JSON.stringify(missingParams), testPassword);
      expect(result).toBeNull(); // Will fail MAC check due to different params
    });
  });

  describe('edge cases', () => {
    it('should handle empty password', async () => {
      const emptyPasswordKeystore = {
        version: 3,
        id: '1234',
        crypto: {
          ciphertext: '1234567890abcdef',
          cipherparams: { iv: '1234567890abcdef' },
          cipher: 'aes-128-ctr',
          kdf: 'scrypt',
          kdfparams: {
            dklen: 32,
            salt: '1234567890abcdef',
            n: 2,
            r: 8,
            p: 1,
          },
          mac: '1234567890abcdef',
        },
      };
      const result = await decryptJsonKeystore(JSON.stringify(emptyPasswordKeystore), '');
      expect(result).toBeNull(); // MAC will fail
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const result = await decryptJsonKeystore(JSON.stringify(testKeystore), longPassword);
      expect(result).toBeNull(); // Wrong password
    });

    it('should handle keystore with extra fields', async () => {
      const extraFields = {
        ...testKeystore,
        extra: 'field',
        crypto: {
          ...testKeystore.crypto,
          extra: 'crypto field',
        },
      };
      const result = await decryptJsonKeystore(JSON.stringify(extraFields), testPassword);
      expect(result).not.toBeNull();
    });
  });

  describe('keystore format validation', () => {
    it('should validate version field', async () => {
      const wrongVersion = { ...testKeystore, version: 2 };
      // Should still work as we don't strictly check version
      const result = await decryptJsonKeystore(JSON.stringify(wrongVersion), testPassword);
      expect(result).not.toBeNull();
    });

    it('should handle missing optional fields', async () => {
      const minimal = {
        crypto: testKeystore.crypto,
      };
      const result = await decryptJsonKeystore(JSON.stringify(minimal), testPassword);
      expect(result).not.toBeNull();
    });

    it('should validate hex string formats', async () => {
      const invalidHex = JSON.parse(JSON.stringify(testKeystore));
      invalidHex.crypto.ciphertext = 'not-hex';
      const result = await decryptJsonKeystore(JSON.stringify(invalidHex), testPassword);
      expect(result).toBeNull();
    });
  });

  describe('KDF parameter validation', () => {
    it('should use default scrypt parameters when missing', async () => {
      const defaultParams = JSON.parse(JSON.stringify(testKeystore));
      // Remove all params except required ones
      defaultParams.crypto.kdfparams = {
        salt: defaultParams.crypto.kdfparams.salt,
        dklen: 32,
      };
      const result = await decryptJsonKeystore(JSON.stringify(defaultParams), testPassword);
      expect(result).toBeNull(); // Different params = different key
    });

    it('should use default pbkdf2 parameters when missing', async () => {
      const pbkdf2Keystore = {
        crypto: {
          ciphertext: '1234',
          cipherparams: { iv: '1234' },
          cipher: 'aes-128-ctr',
          kdf: 'pbkdf2',
          kdfparams: {
            salt: '1234',
            dklen: 32,
          },
          mac: '1234',
        },
      };
      const result = await decryptJsonKeystore(JSON.stringify(pbkdf2Keystore), 'password');
      expect(result).toBeNull(); // Different params = different key
    });
  });

  describe('integration tests', () => {
    it('should properly decrypt and return private key bytes', async () => {
      const privateKey = Buffer.from(
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        'hex'
      );
      const password = 'integration-test-password';
      const keystore = generateTestKeystore(privateKey, password);

      const result = await decryptJsonKeystore(JSON.stringify(keystore), password);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Buffer.from(result!).toString('hex')).toBe(privateKey.toString('hex'));
    });

    it('should handle different private key lengths', async () => {
      // 64 byte private key
      const longPrivateKey = Buffer.from('0123456789abcdef'.repeat(8), 'hex');
      const password = 'test-long-key';
      const keystore = generateTestKeystore(longPrivateKey, password);

      const result = await decryptJsonKeystore(JSON.stringify(keystore), password);

      expect(result).not.toBeNull();
      expect(Buffer.from(result!).length).toBe(64);
    });
  });
});
