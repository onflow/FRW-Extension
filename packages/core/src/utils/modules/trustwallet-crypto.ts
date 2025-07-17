import { initWasm } from '@trustwallet/wallet-core';

import { type PublicPrivateKeyTuple } from '@onflow/flow-wallet-shared/types/key-types';

/**
 * Derives a key pair from a mnemonic and path using TrustWallet library.
 * @param mnemonic - The mnemonic phrase
 * @param path - The derivation path
 * @param passphrase - Optional passphrase
 * @returns The derived key pair
 */
export async function seedWithPathAndPhrase2PublicPrivateKeyTrustWallet(
  mnemonic: string,
  path: string,
  passphrase: string = ''
): Promise<PublicPrivateKeyTuple> {
  const { HDWallet, Curve } = await initWasm();

  const wallet = HDWallet.createWithMnemonic(mnemonic, passphrase);
  const p256PK = wallet.getKeyByCurve(Curve.nist256p1, path);
  const p256PubK = Buffer.from(p256PK.getPublicKeyNist256p1().uncompressed().data())
    .toString('hex')
    .replace(/^04/, '');
  const SECP256PK = wallet.getKeyByCurve(Curve.secp256k1, path);
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
}

/**
 * Get public key from private key for a specific algorithm using TrustWallet
 * @param pk - Private key in hex
 * @param signAlgo - Signing algorithm (P256 or SECP256K1)
 * @returns Public key in hex
 */
export async function getPublicKeyFromPrivateKeyTrustWallet(
  pk: string,
  signAlgo: 'P256' | 'SECP256K1'
): Promise<string> {
  const { PrivateKey } = await initWasm();

  const privateKeyData = Buffer.from(pk, 'hex');
  const privateKey = PrivateKey.createWithData(privateKeyData);

  if (signAlgo === 'P256') {
    const pubKey = privateKey.getPublicKeyNist256p1().uncompressed().data();
    return Buffer.from(pubKey).toString('hex').replace(/^04/, '');
  } else {
    const pubKey = privateKey.getPublicKeySecp256k1(false).data();
    return Buffer.from(pubKey).toString('hex').replace(/^04/, '');
  }
}
