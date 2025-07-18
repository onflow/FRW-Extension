import BN from 'bignumber.js';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type ExtendedTokenInfo,
  type TokenFilter,
} from '@onflow/flow-wallet-shared/types/coin-types';
import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import { useNetwork } from '@/ui/hooks/useNetworkHook';

import { useCurrency } from './preference-hooks';
import { setTokenFilter, useCoinList, useTokenFilter } from './use-coin-hooks';
import { useWallet } from './use-wallet';
import { useProfiles } from './useProfileHook';

export const useCoins = () => {
  const usewallet = useWallet();
  const { network } = useNetwork();
  const { currentWallet } = useProfiles();
  const currency = useCurrency();
  const initAttemptedRef = useRef(false);

  // Replace Zustand state with React state
  const [balance, setBalance] = useState<string>('0');
  const [totalFlow, setTotalFlow] = useState<string>('0');
  const [availableFlow, setAvailableFlow] = useState<string>('0');

  const handleStorageData = useCallback(
    async (data?: ExtendedTokenInfo[] | null) => {
      if (!data) return;

      // Create a map for faster lookups
      let sum = new BN(0);
      let flowBalance = new BN(0);

      // Single pass through the data
      for (const coin of data) {
        // Calculate sum and flow balance
        if (coin.total !== null) {
          sum = sum.plus(new BN(coin?.total || 0));
          if (coin.unit && coin.unit.toLowerCase() === 'flow') {
            flowBalance = new BN(coin.balance);
          }
        }
      }

      // Batch updates
      await Promise.all([
        setTotalFlow(flowBalance.toString()),
        setAvailableFlow(flowBalance.toString()),
        setBalance(sum.toString()),
      ]);
    },
    [setTotalFlow, setBalance]
  );

  const coins = useCoinList(network, currentWallet?.address, currency?.code);
  const coinsLoaded = coins !== undefined;

  const tokenFilter = useTokenFilter(network, currentWallet?.address) || {
    hideDust: false,
    hideUnverified: true,
    filteredIds: [],
  };

  const updateTokenFilter = (filter: TokenFilter) => {
    setTokenFilter(network, currentWallet?.address, filter);
  };

  useEffect(() => {
    // Check if currentWallet exists and has an address
    if (currentWallet?.address) {
      // If coinList is empty or undefined, initialize it
      if ((!coins || coins.length === 0) && !initAttemptedRef.current) {
        const initAndHandle = async () => {
          try {
            initAttemptedRef.current = true;
          } catch (error) {
            consoleError('Error initializing coin list:', error);
          }
        };

        initAndHandle();
      } else if (coins && coins.length > 0) {
        handleStorageData(coins);
      }
    }
  }, [usewallet, network, currentWallet, coins, handleStorageData]);

  useEffect(() => {
    initAttemptedRef.current = false;
  }, [currentWallet?.address, network]);

  return {
    handleStorageData,
    updateTokenFilter,
    coins,
    tokenFilter,
    balance,
    totalFlow,
    availableFlow,
    coinsLoaded,
  };
};
