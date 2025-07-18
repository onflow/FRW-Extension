import { CURRENT_ID_KEY } from '@onflow/flow-wallet-shared/types/keyring-types';

import storage from './storage';

export const returnCurrentProfileId = async (): Promise<string | null> => {
  return await storage.get(CURRENT_ID_KEY);
};

export const getCurrentProfileId = async (): Promise<string> => {
  const currentId = await returnCurrentProfileId();
  if (!currentId) {
    throw new Error('Current id is not set.');
  }
  return currentId;
};
