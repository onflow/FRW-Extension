import * as fcl from '@onflow/fcl';
import { type AccountKey } from '@onflow/typedefs';

import openapiService from '@/background/service/openapi';
import userWalletService from '@/background/service/userWallet';
import type { PublicKeyTuple } from '@/shared/types/key-types';
import { type AccountKeyRequest } from '@/shared/types/network-types';
import { type PublicKeyAccount } from '@/shared/types/wallet-types';

/**
 * Get accounts with public key tuple
 * This is the main function to look up the account with the public key. Called when loading the wallet.
 * This allows for the use of two different public keys for the same address.
 * We look first for the account with the P256 key. If that is not found, we look for the SECP256K1 key.
 * This calls the indexer to get the accounts with the public key.
 *
 * @param {PublicKeyTuple} pubKTuple - The public key tuple containing both key types
 * @returns {Array<Object>} An array of account information objects with keys, weights, and algorithms
 */

export const getAccountsByPublicKeyTuple = async (
  pubKTuple: PublicKeyTuple,
  network: string
): Promise<PublicKeyAccount[]> => {
  const { P256, SECP256K1 } = pubKTuple;

  // Check for P256 accounts first
  const p256Accounts = await getAccountsWithPublicKey(P256.pubK, network);
  // Otherwise, check for SECP256K1 accounts
  const sepc256k1Accounts = await getAccountsWithPublicKey(SECP256K1.pubK, network);
  // Combine the accounts
  const accounts = [...p256Accounts, ...sepc256k1Accounts];

  // Filter out accounts with weight of < 1000
  const accountsOver1000 = accounts.filter((account) => account.weight >= 1000);

  // Otherwise, return the accounts
  return accountsOver1000;
};

/*
 * Connect to the indexer to get all accounts associated with a public key
 * This is used to get the accounts for the current user
 * @param {string} publicKey - The public key to search for
 * @param {string} network - The network to search on
 * @returns {Promise<KeyIndexerProfile>} The accounts associated with the public key
 */

export async function getAccountsWithPublicKey(
  publicKey: string,
  network: string
): Promise<PublicKeyAccount[]> {
  return openapiService.getAccountsWithPublicKey(publicKey, network);
}

const getPublicKeyInfoForAccount = async (
  address: string,
  pubKeyHex: string
): Promise<PublicKeyAccount[] | null> => {
  // Verfify that the address is associated with the public key

  // I'm not sure this is needed. I'm updating what was here
  await userWalletService.setupFcl();

  // This is the account object from the Flow blockchain
  const account = await fcl.account(address);

  // Filter the keys to only include the ones that are associated with the public key,
  // have a weight of 1000 or more, and are not revoked
  const keys: AccountKey[] = account.keys
    .filter((key) => key.publicKey === pubKeyHex && !key.revoked)
    .filter((key) => key.weight >= 1000);

  // If there a valid matching key is not found, return null
  if (keys.length === 0) {
    return null;
  }
  // Return the keys that match the criteria
  return keys.map((key) => {
    return {
      ...key,
      address: address,
      keyIndex: key.index,
    };
  });
};

export const getOrCheckAccountsWithPublicKey = async (
  pubKeyHex: string,
  address: string | null = null
): Promise<PublicKeyAccount[] | null> => {
  // If the address is not provided, get the accounts from the indexer
  return address
    ? await getPublicKeyInfoForAccount(address, pubKeyHex)
    : await getAccountsWithPublicKey(pubKeyHex, 'mainnet');
};

export const getOrCheckAccountsByPublicKeyTuple = async (
  pubKTuple: PublicKeyTuple,
  address: string | null = null
): Promise<PublicKeyAccount[]> => {
  const { P256, SECP256K1 } = pubKTuple;
  const p256Accounts = (await getOrCheckAccountsWithPublicKey(P256.pubK, address)) || [];
  const sepc256k1Accounts = (await getOrCheckAccountsWithPublicKey(SECP256K1.pubK, address)) || [];
  // Combine the accounts
  const accounts = [...p256Accounts, ...sepc256k1Accounts];

  // Filter out accounts with weight of < 1000
  const accountsOver1000 = accounts.filter((account) => account.weight >= 1000);

  // Return the accounts
  return accountsOver1000;
};

export const accountKeyRequestForAccount = async (
  account: PublicKeyAccount
): Promise<AccountKeyRequest> => {
  return {
    public_key: account.publicKey,
    hash_algo: account.hashAlgo,
    sign_algo: account.signAlgo,
    weight: account.weight,
  };
};
