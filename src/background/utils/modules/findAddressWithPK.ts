import { type PublicPrivateKeyTuple } from '@/shared/types/key-types';
import { type PublicKeyAccount } from '@/shared/types/wallet-types';
import { FLOW_BIP44_PATH } from '@/shared/utils/algo-constants';

import { getOrCheckAddressByPublicKeyTuple } from './findAddressWithPubKey';
import { pk2PubKey, seedWithPathAndPhrase2PublicPrivateKey } from './publicPrivateKey';

export const findAddressWithPK = async (pk: string, address: string) => {
  const pubKTuple = await pk2PubKey(pk);
  return await getOrCheckAddressByPublicKeyTuple(pubKTuple, address);
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

  return await getOrCheckAddressByPublicKeyTuple(pubKTuple, address);
};
