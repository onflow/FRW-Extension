// Mock for preference-hooks that doesn't use Chrome APIs
import { DEFAULT_CURRENCY } from '@/shared/types/wallet-types';

export const useCurrency = () => {
  return DEFAULT_CURRENCY;
};

export const useSupportedCurrencies = () => {
  return {
    currencies: [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    ],
  };
};

export const useHiddenAddresses = () => {
  return [];
};

export const useAddressHidden = (address: string) => {
  return false;
};

export const toggleAddressHidden = async (address: string) => {
  return false;
};
