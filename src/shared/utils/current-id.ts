import { storage } from '@/background/webapi';

export const returnCurrentProfileId = async (): Promise<string | null> => {
  return await storage.get('currentId');
};

export const getCurrentProfileId = async (): Promise<string> => {
  const currentId = await returnCurrentProfileId();
  if (!currentId) {
    throw new Error('Current id is not set.');
  }
  return currentId;
};
