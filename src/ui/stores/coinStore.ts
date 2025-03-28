import { create } from 'zustand';

import type { CoinItem } from '@/shared/types/coin-types';

interface CoinStore {
  coins: CoinItem[];
  balance: string;
  availableFlow: string;
  totalFlow: string;
  setCoinData: (coins: CoinItem[]) => void;
  setBalance: (balance: string) => void;
  setTotalFlow: (totalFlow: string) => void;
  clearCoins: () => void;
  setAvailableFlow: (availableFlow: string) => void;
}

export const useCoinStore = create<CoinStore>((set) => ({
  coins: [],
  balance: '$ 0.00',
  availableFlow: '0',
  totalFlow: '0',
  setCoinData: (coins) => set({ coins }),
  setBalance: (balance) => set({ balance }),
  setTotalFlow: (totalFlow: string) => set({ totalFlow }),
  setAvailableFlow: (availableFlow: string) => set({ availableFlow }),
  clearCoins: () => set({ coins: [], balance: '$ 0.00' }),
}));
