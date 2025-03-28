import { type BalanceMap, type CoinItem } from '@/shared/types/coin-types';
import { createPersistStore } from 'background/utils';
import { storage } from 'background/webapi';

interface CoinListStore {
  expiry: number;
  coinItem: Record<string, any>;
  evm: Record<string, any>;
  currentCoin: string;
}

const now = new Date();

const COINLIST_TEMPLATE: CoinListStore = {
  expiry: now.getTime(),
  coinItem: {
    testnet: [],
    crescendo: [],
    mainnet: [],
  },
  evm: {
    testnet: [],
    crescendo: [],
    mainnet: [],
  },
  currentCoin: 'flow',
};
class CoinList {
  store!: CoinListStore;

  init = async () => {
    this.store = await createPersistStore<CoinListStore>({
      name: 'coinList',
      template: COINLIST_TEMPLATE,
    });
  };

  clear = async () => {
    if (!this.store) {
      await this.init();
    } else {
      Object.assign(this.store, COINLIST_TEMPLATE);
    }
  };

  getCoinByUnit = (unit: string) => {
    return this.store.coinItem[unit];
  };

  getExpiry = () => {
    return this.store.expiry;
  };

  setExpiry = (expiry: number) => {
    this.store.expiry = expiry;
  };

  addCoin = (data: CoinItem, network: string, listType = 'coinItem') => {
    if (this.store[listType][network] === undefined) {
      this.store[listType][network] = [];
    }
    this.store[listType][network][data.unit] = data;
  };

  addCoins = (coins: CoinItem[], network: string, listType = 'coinItem') => {
    const newNetworkData = [...coins];

    const updatedListType = { ...this.store[listType] };
    updatedListType[network] = newNetworkData;

    this.store[listType] = updatedListType;

    storage.set('coinList', this.store);
  };

  removeCoin = (unit: string, network: string, listType = 'coinItem') => {
    delete this.store[listType][network][unit];
  };

  updateCoin = (network: string, data: CoinItem, listType = 'coinItem') => {
    this.store[listType][network][data.unit] = data;
  };

  setCurrentCoin = (coinName: string) => {
    this.store.currentCoin = coinName;
  };
  getCurrentCoin = () => {
    return this.store.currentCoin;
  };
  listCoins = (network: string, listType = 'coinItem'): CoinItem[] => {
    if (!this.store[listType] || !this.store[listType][network]) {
      return [];
    }

    if (Array.isArray(this.store[listType][network])) {
      return this.store[listType][network];
    }

    const list = Object.values(this.store[listType][network]);
    return list.filter((item): item is CoinItem => !!item) || [];
  };

  /**
   * Updates only the balance of coins in the store
   * @param balanceMap Object mapping token IDs to balance strings
   * @param network The network to update balances for
   * @param listType The list type to update
   */
  updateBalances = (balanceMap: BalanceMap, network: string, listType = 'coinItem') => {
    // Check if the network exists in the store
    if (!this.store[listType] || !this.store[listType][network]) {
      console.log('No coins found for network:', network);
      return;
    }

    // Get the current coins array
    const currentCoins = [...this.store[listType][network]];

    // Update only the balances
    const updatedCoins = currentCoins.map((coin) => {
      // Create the token ID in the format used in balanceMap
      const tokenId = coin.id || `A.${coin.address?.slice(2)}.${coin.contractName}`;
      const tokenIdVault = `${tokenId}.Vault`;
      const isFlow = coin.symbol.toLowerCase() === 'flow';
      const balance = isFlow ? balanceMap['availableFlowToken'] : balanceMap[tokenIdVault] || '';
      // If this coin has a balance in the balanceMap, update it
      if (balance) {
        return {
          ...coin,
          balance: balance,
        };
      }

      // Otherwise return the coin unchanged
      return coin;
    });

    // Update the store with the new coins array
    const updatedListType = { ...this.store[listType] };
    updatedListType[network] = updatedCoins;
    this.store[listType] = updatedListType;

    // Persist to storage
    storage.set('coinList', this.store);

    console.log('Updated balances for', updatedCoins.length, 'coins on', network);
  };
}

export default new CoinList();
