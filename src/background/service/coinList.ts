import openapiService from '@/background/service/openapi';
import { type BalanceMap, type CoinItem, type ExtendedTokenInfo } from '@/shared/types/coin-types';
import { coinListKey, coinListRefreshRegex } from '@/shared/utils/cache-data-keys';
import { createPersistStore } from 'background/utils';
import { storage } from 'background/webapi';

import { walletController } from '../controller';
import { fclConfirmNetwork } from '../fclConfig';
import {
  clearCachedData,
  getValidData,
  registerRefreshListener,
  setCachedData,
} from '../utils/data-cache';
interface CoinListStore {
  expiry: number;
  coinItem: Record<string, any>;
  evm: Record<string, any>;
  currentCoin: string;
}

const now = new Date();

class CoinList {
  init = async () => {
    registerRefreshListener(coinListRefreshRegex, this.loadCoinList);
  };

  clear = async () => {};
  /*
  getCoinByUnit = (unit: string) => {
    return this.store.coinItem[unit];
  };

  addCoin = (data: ExtendedTokenInfo, network: string, listType = 'coinItem') => {
    if (this.store[listType][network] === undefined) {
      this.store[listType][network] = [];
    }
    this.store[listType][network][data.unit] = data;
  };

  addCoins = (coins: ExtendedTokenInfo[], network: string, listType = 'coinItem') => {
    const newNetworkData = [...coins];

    const updatedListType = { ...this.store[listType] };
    updatedListType[network] = newNetworkData;

    this.store[listType] = updatedListType;

    storage.set('coinList', this.store);
  };

  removeCoin = (unit: string, network: string, listType = 'coinItem') => {
    delete this.store[listType][network][unit];
  };

  updateCoin = (network: string, data: ExtendedTokenInfo, listType = 'coinItem') => {
    this.store[listType][network][data.unit] = data;
  };

  setCurrentCoin = (coinName: string) => {
    this.store.currentCoin = coinName;
  };
  getCurrentCoin = () => {
    return this.store.currentCoin;
  };
  listCoins = (network: string, listType = 'coinItem'): ExtendedTokenInfo[] => {
    if (!this.store[listType] || !this.store[listType][network]) {
      return [];
    }

    if (Array.isArray(this.store[listType][network])) {
      return this.store[listType][network];
    }

    const list = Object.values(this.store[listType][network]);
    return list.filter((item): item is ExtendedTokenInfo => !!item) || [];
  };

  /**
   * Updates only the balance of coins in the store
   * @param balanceMap Object mapping token IDs to balance strings
   * @param network The network to update balances for
   * @param listType The list type to update
   * /
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
 */
  initCoinList = async (network: string, address: string) => {
    const coinList = await this.loadCoinList(network, address, 'usd');
    if (!coinList || coinList.length === 0) {
      return null;
    }
    return coinList;
  };

  /**
   * Refreshes coin list with updated balances and prices
   * @param _expiry Expiry time in milliseconds
   * @returns Array of coin items
   */
  loadCoinList = async (
    network: string,
    address: string,
    currency: string
  ): Promise<ExtendedTokenInfo[]> => {
    // Get network and address
    if (!address || !network) {
      throw new Error('Address or network is not set');
    }
    const cachedData = await getValidData<ExtendedTokenInfo[]>(
      coinListKey(network, address, currency)
    );
    if (cachedData) {
      return cachedData;
    }

    if (!(await fclConfirmNetwork(network))) {
      // Do nothing if the network is switched
      // Don't update the cache
      return [];
    }

    const userTokenResult = await openapiService.getUserTokens(address, network);
    await setCachedData(coinListKey(network, address, currency), userTokenResult);

    return userTokenResult;
  };
}

export default new CoinList();
