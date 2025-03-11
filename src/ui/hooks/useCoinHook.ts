import BN from 'bignumber.js';
import { useCallback, useEffect, useState } from 'react';

import { withPrefix } from '@/shared/utils/address';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useCoinStore } from '@/ui/stores/coinStore';
import { useWallet, useWalletLoaded } from '@/ui/utils/WalletContext';

const DEFAULT_MIN_AMOUNT = '0.001';

export const useCoins = () => {
  const usewallet = useWallet();
  const walletLoaded = useWalletLoaded();
  const { mainAddress } = useProfiles();

  const [coinsLoaded, setCoinsLoaded] = useState(false);

  // Action selectors
  const setCoinData = useCoinStore((state) => state.setCoinData);
  const setBalance = useCoinStore((state) => state.setBalance);
  const setTotalFlow = useCoinStore((state) => state.setTotalFlow);
  const setAvailableFlow = useCoinStore((state) => state.setAvailableFlow);
  const clearCoins = useCoinStore((state) => state.clearCoins);

  // State selectors
  const coins = useCoinStore((state) => state.coins);
  const balance = useCoinStore((state) => state.balance);
  const totalFlow = useCoinStore((state) => state.totalFlow);
  const availableFlow = useCoinStore((state) => state.availableFlow);

  const handleStorageData = useCallback(
    async (storageData) => {
      if (!storageData) return;

      // Create a map for faster lookups
      const uniqueTokenMap = new Map();
      let sum = new BN(0);
      let flowBalance = new BN(0);

      // Single pass through the data
      for (const coin of storageData) {
        const lowerUnit = coin.unit.toLowerCase();

        // Handle unique tokens
        if (!uniqueTokenMap.has(lowerUnit)) {
          uniqueTokenMap.set(lowerUnit, coin);
        }

        // Calculate sum and flow balance
        if (coin.total !== null) {
          sum = sum.plus(new BN(coin.total));
          if (lowerUnit === 'flow') {
            flowBalance = new BN(coin.balance);
          }
        }
      }

      // Batch updates
      await Promise.all([
        setCoinData(Array.from(uniqueTokenMap.values())),
        setTotalFlow(flowBalance.toString()),
        setBalance(`$ ${sum.toFixed(2)}`),
      ]);
    },
    [setCoinData, setTotalFlow, setBalance]
  );

  const calculateAvailableBalance = useCallback(async () => {
    try {
      // Make sure the wallet is unlocked
      if (!(await usewallet.isUnlocked())) {
        console.log('calculateAvailableBalance - Wallet is locked');
        return;
      }
      if (!(await usewallet.getMainWallet())) {
        console.log('calculateAvailableBalance - No main wallet yet');
        return;
      }

      const address = withPrefix(mainAddress) || '';
      // TODO: need a controller for this
      const minAmount = new BN(
        (await usewallet.openapi.getAccountMinFlow(address)) || DEFAULT_MIN_AMOUNT
      );
      const total = new BN(totalFlow);
      const availableFlow = total.minus(minAmount).toString();
      setAvailableFlow(availableFlow);
    } catch (error) {
      console.error('Error calculating available balance:', error);
      setAvailableFlow('0');
    }
  }, [usewallet, totalFlow, mainAddress, setAvailableFlow]);

  const sortWallet = useCallback(
    (data) => {
      const sorted = data.sort((a, b) => {
        if (b.total === a.total) {
          return new BN(b.balance).minus(new BN(a.balance)).toNumber();
        } else {
          return new BN(b.total).minus(new BN(a.total)).toNumber();
        }
      });
      handleStorageData(sorted);
    },
    [handleStorageData]
  );

  const refreshCoinData = useCallback(async () => {
    if (!usewallet || !walletLoaded) return;

    // Make sure the wallet is unlocked
    if (!(await usewallet.isUnlocked())) {
      console.log('Wallet is locked');
      return;
    }
    if (!(await usewallet.getMainWallet())) {
      console.log('No main wallet yet');
      return;
    }

    try {
      const refreshedCoinlist = await usewallet.refreshCoinList(60000);
      if (Array.isArray(refreshedCoinlist) && refreshedCoinlist.length > 0) {
        sortWallet(refreshedCoinlist);
        setCoinsLoaded(true);
      }
    } catch (error) {
      console.error('Error refreshing coin data:', error);
    }
  }, [usewallet, sortWallet, walletLoaded]);

  useEffect(() => {
    if (usewallet && walletLoaded) {
      refreshCoinData();
    }
  }, [refreshCoinData, usewallet, walletLoaded]);

  useEffect(() => {
    if (walletLoaded) {
      calculateAvailableBalance();
    }
  }, [totalFlow, calculateAvailableBalance, walletLoaded]);

  return {
    refreshCoinData,
    handleStorageData,
    clearCoins,
    coins,
    balance,
    totalFlow,
    availableFlow,
    coinsLoaded,
  };
};
