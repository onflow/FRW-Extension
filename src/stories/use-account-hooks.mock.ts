import { fn } from 'storybook/test';

// These are the mock function instances, exported with the names the component expects.
export const useChildAccounts = fn().mockName('useChildAccounts');
export const useEvmAccount = fn().mockName('useEvmAccount');
export const useAccountBalance = fn().mockName('useAccountBalance');
export const usePendingAccountCreationTransactions = fn()
  .mockName('usePendingAccountCreationTransactions')
  .mockReturnValue([]);
