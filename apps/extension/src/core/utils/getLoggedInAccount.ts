import { type LoggedInAccount } from '@onflow/flow-wallet-shared/types/wallet-types';

import { getCurrentProfileId } from '@/extension-shared/utils/current-id';
import storage from '@/extension-shared/utils/storage';

export const getLoggedInAccount = async (): Promise<LoggedInAccount> => {
  // Note that currentAccountIndex is only used in keyring for old accounts that don't have an id stored in the keyring
  // currentId always takes precedence
  const currentId = await getCurrentProfileId();

  const loggedInAccounts: LoggedInAccount[] = (await storage.get('loggedInAccounts')) || [];
  const account = loggedInAccounts.find((acc) => acc.id === currentId);
  // NOTE: If no account is found with currentId, then loggedInAccounts is probably out of sync with the keyring. Throw an error use the backup method of getting the account

  if (!account) {
    // Handle the case when no account is found
    throw new Error('Account info not found.');
  } else {
    // Return account
    return account;
  }
};
