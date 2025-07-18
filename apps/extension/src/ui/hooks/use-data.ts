import { useEffect, useState } from 'react';

import {
  addCachedDataListener,
  getCachedData,
  removeCachedDataListener,
} from '@/data-model/cache-data-access';
import storage, { type AreaName, type StorageChange } from '@/extension-shared/utils/storage';

type DataState = {
  key: string;
  data: unknown;
};
export const useCachedData = <T>(key: string | undefined | null): T | undefined => {
  const [dataState, setDataState] = useState<DataState | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!key) return;
      const data = await getCachedData(key);
      if (mounted) {
        setDataState({ key, data });
      }
    };
    const handleDataChange = (k: string, data: unknown) => {
      if (k === key) {
        if (mounted) {
          setDataState({ key, data });
        }
      }
    };
    // Handle undefined key
    if (!key) return;

    fetchData();
    addCachedDataListener(key, handleDataChange);

    return () => {
      mounted = false;
      removeCachedDataListener(key, handleDataChange);
    };
  }, [key]);
  if (key !== dataState?.key) {
    // This is to protect against a race condition where the key changes before the data is set
    return undefined;
  }
  return dataState?.data as T;
};

export const useUserData = <T>(key: string | undefined | null): T | undefined => {
  const [dataState, setDataState] = useState<DataState | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    // Handle undefined key
    const fetchData = async () => {
      if (!key) return;
      const data = await storage.get(key);
      if (mounted) {
        setDataState({ key, data });
      }
    };

    const handleStorageChange = (
      changes: { [key: string]: StorageChange },
      namespace: AreaName
    ) => {
      if (!key) return;

      if (namespace === 'local' || namespace === 'sync') {
        if (changes[key]) {
          if (mounted) {
            setDataState({ key, data: changes[key].newValue });
          }
        }
      }
    };
    if (!key) return;

    fetchData();
    storage.addStorageListener(handleStorageChange);

    return () => {
      mounted = false;
      storage.removeStorageListener(handleStorageChange);
    };
  }, [key]);

  if (key !== dataState?.key) {
    // This is to protect against a race condition where the key changes before the data is set
    return undefined;
  }
  return dataState?.data as T;
};
