import { fn } from 'storybook/test';

import * as actual from './use-account-hooks';

// These are the mock function instances, exported with the names the component expects.
export const useAccountBalance = fn(actual.useAccountBalance).mockName('useAccountBalance');
export const usePendingAccountCreationTransactions = fn(
  actual.usePendingAccountCreationTransactions
)
  .mockName('usePendingAccountCreationTransactions')
  .mockReturnValue([]);
