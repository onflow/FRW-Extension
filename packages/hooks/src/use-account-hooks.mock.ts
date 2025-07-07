import { fn } from 'storybook/test';

import * as actual from './use-account-hooks';

// These are the mock function instances, exported with the names the component expects.
export const useAccountBalance = fn(actual.useAccountBalance).mockName('useAccountBalance');
export const usePendingAccountCreationTransactions = fn(
  actual.usePendingAccountCreationTransactions
)
  .mockName('usePendingAccountCreationTransactions')
  .mockReturnValue([]);
export const useMainAccount = fn(actual.useMainAccount).mockName('useMainAccount');
export const useMainAccounts = fn(actual.useMainAccounts).mockName('useMainAccounts');
export const useChildAccountAllowTypes = fn(actual.useChildAccountAllowTypes).mockName(
  'useChildAccountAllowTypes'
);
export const useChildAccountDescription = fn(actual.useChildAccountDescription).mockName(
  'useChildAccountDescription'
);
export const useCurrentId = fn(actual.useCurrentId).mockName('useCurrentId');

export const useUserInfo = fn(actual.useUserInfo).mockName('useUserInfo');
