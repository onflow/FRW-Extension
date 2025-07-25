import { fn } from 'storybook/test';

import * as actual from './preference-hooks';

// Mock for preference hooks
export const useAccountHidden = fn(actual.useAccountHidden).mockName('useAccountHidden');
export const toggleAccountHidden = fn(actual.toggleAccountHidden).mockName('toggleAccountHidden');
export const useHiddenAccounts = fn(actual.useHiddenAccounts).mockName('useHiddenAccounts');
export const useCurrency = fn(actual.useCurrency).mockName('useCurrency');
export const useSupportedCurrencies = fn(actual.useSupportedCurrencies).mockName(
  'useSupportedCurrencies'
);
