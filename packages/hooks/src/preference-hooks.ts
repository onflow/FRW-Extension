import { DEFAULT_CURRENCY } from '@/shared/types/wallet-types';
import {
  type SupportedCurrenciesStore,
  supportedCurrenciesKey,
} from '@/shared/utils/cache-data-keys';
import { setUserData, getUserData } from '@/shared/utils/user-data-access';
import { preferencesKey, type PreferencesStore } from '@/shared/utils/user-data-keys';

import { useCachedData, useUserData } from './use-data';

export const useCurrency = () => {
  const preferences = useUserData<PreferencesStore>(preferencesKey);
  return preferences?.displayCurrency;
};

export const useSupportedCurrencies = () => {
  return useCachedData<SupportedCurrenciesStore>(supportedCurrenciesKey());
};

export const useHiddenAccounts = () => {
  const preferences = useUserData<PreferencesStore>(preferencesKey);
  return preferences?.hiddenAccounts || [];
};

export const useAccountHidden = (address: string) => {
  const hiddenAccounts = useHiddenAccounts();
  return hiddenAccounts.includes(address);
};

export const toggleAccountHidden = async (address: string) => {
  const preferences = await getUserData<PreferencesStore>(preferencesKey);
  const currentHiddenAccounts = preferences?.hiddenAccounts || [];

  const newHiddenAccounts = currentHiddenAccounts.includes(address)
    ? currentHiddenAccounts.filter((addr) => addr !== address)
    : [...currentHiddenAccounts, address];

  await setUserData<PreferencesStore>(preferencesKey, {
    ...preferences,
    displayCurrency: preferences?.displayCurrency || DEFAULT_CURRENCY,
    hiddenAccounts: newHiddenAccounts,
  });

  return !currentHiddenAccounts.includes(address);
};
