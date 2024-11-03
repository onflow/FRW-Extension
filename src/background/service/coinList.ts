import { createPersistStore } from 'background/utils';
import { storage } from 'background/webapi';
export interface CoinItem {
  coin: string;
  unit: string;
  balance: number;
  price: number;
  change24h: number | null;
  total: number;
  icon: string;
  custom?: boolean;
}

interface CoinListStore {
  expiry: number;
  coinItem: Record<string, any>;
  evm: Record<string, any>;
  currentCoin: string;
}

const now = new Date()

class CoinList {
  store!: CoinListStore;

  init = async () => {
    this.store = await createPersistStore<CoinListStore>({
      name: 'coinList',
      template: {
        expiry: now.getTime(),
        coinItem: {
          testnet: {},
          crescendo: {},
          mainnet: {},
        },
        evm: {
          testnet: {},
          crescendo: {},
          mainnet: {},
        },
        currentCoin: 'flow'
      },
    });
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
      this.store[listType][network] = {}
    }
    this.store[listType][network][data.unit] = data;
  };

  addCoins = (coins: CoinItem[], network: string, listType = 'coinItem') => {
    if (coins.length === 0) {
      this.store[listType][network] = {};
      return;
    }
    this.store[listType][network] = {};
  
    coins.forEach((coin) => {
      this.store[listType][network][coin.unit] = coin;
    });
  };

  removeCoin = (unit: string, network: string, listType = 'coinItem') => {
    delete this.store[listType][network][unit];
  };

  updateCoin = (network: string, data: CoinItem, listType = 'coinItem') => {
    this.store[listType][network][data.unit] = data;
  };

  clear = () => {
    this.store = {
      expiry: now.getTime(),
      coinItem: {},
      evm: {},
      currentCoin: 'flow'
    }
    storage.remove('coinList')
  };
  setCurrentCoin = (coinName: string) => {
    this.store.currentCoin = coinName;
  };
  getCurrentCoin = () => {
    return this.store.currentCoin;
  };
  listCoins = (network: string , listType = 'coinItem'): CoinItem[] => {
    if (!this.store[listType] || !this.store[listType][network]) {
      return [];
    }
    const list = Object.values(this.store[listType][network]);
    return list.filter((item): item is CoinItem => !!item) || [];
  };
}

export default new CoinList();
