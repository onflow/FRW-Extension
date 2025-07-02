import {
  type SupportedCurrenciesStore,
  supportedCurrenciesKey,
} from '@/shared/utils/cache-data-keys';
import { preferencesKey, type PreferencesStore } from '@/shared/utils/user-data-keys';

import { useCachedData, useUserData } from './use-data';

export const useCurrency = () => {
  const preferences = useUserData<PreferencesStore>(preferencesKey);
  return preferences?.displayCurrency;
};

export const useSupportedCurrencies = () => {
  return useCachedData<SupportedCurrenciesStore>(supportedCurrenciesKey());
};
