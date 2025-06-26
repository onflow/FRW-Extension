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

export const useHiddenAddresses = () => {
  const preferences = useUserData<PreferencesStore>(preferencesKey);
  return preferences?.hiddenAddresses || [];
};

export const useAddressHidden = (address: string) => {
  const hiddenAddresses = useHiddenAddresses();
  return hiddenAddresses.includes(address);
};

export const toggleAddressHidden = async (address: string) => {
  const preferences = await getUserData<PreferencesStore>(preferencesKey);
  const currentHiddenAddresses = preferences?.hiddenAddresses || [];

  const newHiddenAddresses = currentHiddenAddresses.includes(address)
    ? currentHiddenAddresses.filter((addr) => addr !== address)
    : [...currentHiddenAddresses, address];

  await setUserData<PreferencesStore>(preferencesKey, {
    ...preferences,
    displayCurrency: preferences?.displayCurrency || DEFAULT_CURRENCY,
    hiddenAddresses: newHiddenAddresses,
  });

  return !currentHiddenAddresses.includes(address);
};
