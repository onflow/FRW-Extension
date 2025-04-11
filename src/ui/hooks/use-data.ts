import { useEffect, useState } from 'react';

import {
  addCachedDataListener,
  getCachedData,
  removeCachedDataListener,
} from '@/shared/utils/cache-data-access';
import storage, { type AreaName, type StorageChange } from '@/shared/utils/storage';

export const useCachedData = <T>(key: string | undefined | null): T | undefined => {
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!key) return;
      const data = await getCachedData(key);
      if (mounted) {
        setData(data as T);
      }
    };
    const handleDataChange = (k: string, data: unknown) => {
      if (k === key) {
        if (mounted) {
          setData(data as T);
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

  return data;
};

export const useUserData = <T>(key: string | undefined | null): T | undefined => {
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    // Handle undefined key
    const fetchData = async () => {
      if (!key) return;
      const data = await storage.get(key);
      console.log('useUserData - fetchData', key, data);
      if (mounted) {
        setData(data as T);
      }
    };

    const handleStorageChange = (
      changes: { [key: string]: StorageChange },
      namespace: AreaName
    ) => {
      if (!key) return;

      if (namespace === 'local' || namespace === 'sync') {
        if (changes[key]) {
          console.log('useUserData - handleStorageChange', key, changes[key]);
          if (mounted) {
            setData(changes[key].newValue as T);
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

  return data;
};
