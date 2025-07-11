import { FLOW_BIP44_PATH } from '@onflow/flow-wallet-shared/constant/algo-constants';
import { type PublicPrivateKeyTuple } from '@onflow/flow-wallet-shared/types/key-types';
import { type AccountKeyRequest } from '@onflow/flow-wallet-shared/types/network-types';
import { type PublicKeyAccount } from '@onflow/flow-wallet-shared/types/wallet-types';

import {
  accountKeyRequestForAccount,
  getAccountsByPublicKeyTuple,
  getOrCheckAccountsByPublicKeyTuple,
} from './findAddressWithPubKey';
import { pk2PubKeyTuple, seedWithPathAndPhrase2PublicPrivateKey } from './publicPrivateKey';

export const findAddressWithPK = async (
  pk: string,
  address: string
): Promise<PublicKeyAccount[]> => {
  const pubKTuple = await pk2PubKeyTuple(pk);
  return await getOrCheckAccountsByPublicKeyTuple(pubKTuple, address);
};

export const findAddressWithSeed = async (
  seed: string,
  address: string | null = null,
  derivationPath: string = FLOW_BIP44_PATH,
  passphrase: string = ''
): Promise<PublicKeyAccount[]> => {
  const pubKTuple: PublicPrivateKeyTuple = await seedWithPathAndPhrase2PublicPrivateKey(
    seed,
    derivationPath,
    passphrase
  );

  return await getOrCheckAccountsByPublicKeyTuple(pubKTuple, address);
};

export const getPublicAccountForPK = async (pk: string): Promise<PublicKeyAccount> => {
  const pubKTuple = await pk2PubKeyTuple(pk);
  const accounts = await getAccountsByPublicKeyTuple(pubKTuple, 'mainnet');
  if (accounts.length === 0) {
    throw new Error('No accounts found');
  }
  return accounts[0];
};

export const getAccountKeyRequestForPK = async (pk: string): Promise<AccountKeyRequest> => {
  const account = await getPublicAccountForPK(pk);
  return accountKeyRequestForAccount(account);
};
