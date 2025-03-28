import { useCallback, useEffect, useRef, useState } from 'react';

import storage, { type AreaName, type StorageChange } from '@/background/webapi/storage';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useTransferListStore } from '@/ui/stores/transferListStore';
import { useWallet, debug } from '@/ui/utils';

export const useTransferList = () => {
  const usewallet = useWallet();
  const mountedRef = useRef(true);
  const pendingCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const setTransactions = useTransferListStore((state) => state.setTransactions);
  const setMonitor = useTransferListStore((state) => state.setMonitor);
  const setFlowscanURL = useTransferListStore((state) => state.setFlowscanURL);
  const setViewSourceURL = useTransferListStore((state) => state.setViewSourceURL);
  const setLoading = useTransferListStore((state) => state.setLoading);
  const setShowButton = useTransferListStore((state) => state.setShowButton);
  const setCount = useTransferListStore((state) => state.setCount);

  const transactions = useTransferListStore((state) => state.transactions);
  const monitor = useTransferListStore((state) => state.monitor);
  const flowscanURL = useTransferListStore((state) => state.flowscanURL);
  const viewSourceURL = useTransferListStore((state) => state.viewSourceURL);
  const loading = useTransferListStore((state) => state.loading);
  const showButton = useTransferListStore((state) => state.showButton);
  const count = useTransferListStore((state) => state.count);
  const [occupied, setOccupied] = useState(false);
  const { currentWallet } = useProfiles();

  // Setup localStorage event listener
  useEffect(() => {
    // Function to check pending transactions
    const checkPendingTransactions = async () => {
      try {
        const pending = await usewallet.getPendingTx();
        debug('useTransferListHook', 'Checking pending transactions', { count: pending.length });

        if (mountedRef.current) {
          setOccupied(pending.length > 0);
        }
      } catch (error) {
        console.error('Error checking pending transactions:', error);
      }
    };

    // Initial check
    checkPendingTransactions();

    // Set up interval to periodically check for pending transactions
    pendingCheckIntervalRef.current = setInterval(checkPendingTransactions, 1000);

    // Listen for storage events (when localStorage changes in other tabs)
    const handleStorageChange = (
      changes: { [key: string]: StorageChange },
      namespace: AreaName
    ) => {
      if (namespace === 'local') {
        debug('useTransferListHook', 'Storage change detected', {
          changes,
          namespace,
        });
        if (changes['transaction'] || changes['transaction'] === null) {
          debug(
            'useTransferListHook',
            'Transaction storage changed, checking pending transactions'
          );
          checkPendingTransactions();
        }
      }
    };

    storage.addStorageListener(handleStorageChange);

    // Cleanup
    return () => {
      mountedRef.current = false;
      storage.removeStorageListener(handleStorageChange);
    };
  }, [usewallet]);

  const fetchTransactions = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      const monitor = await usewallet.getMonitor();
      setMonitor(monitor);
      try {
        const url = await usewallet.getFlowscanUrl();
        const viewSourceUrl = await usewallet.getViewSourceUrl();
        setFlowscanURL(url);
        setViewSourceURL(viewSourceUrl);
        const data = await usewallet.getTransactions(
          currentWallet.address!,
          15,
          0,
          60000,
          forceRefresh
        );

        setLoading(false);
        if (data.count > 0) {
          setCount(data.count.toString());
          setShowButton(data.count > 15);
        }
        setTransactions(data.list);
      } catch {
        setLoading(false);
      }
    },
    [
      usewallet,
      setMonitor,
      setFlowscanURL,
      setViewSourceURL,
      setTransactions,
      setCount,
      setShowButton,
      setLoading,
      currentWallet,
    ]
  );

  return {
    fetchTransactions,
    occupied,
    transactions,
    monitor,
    flowscanURL,
    viewSourceURL,
    loading,
    showButton,
    count,
  };
};
