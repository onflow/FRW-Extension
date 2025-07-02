import { useEffect, useState } from 'react';

import storage, { type StorageChange, type AreaName } from '@/shared/utils/storage';
import { getUserWalletsData, userWalletsKey } from '@/shared/utils/user-data-keys';

export const useNetwork = () => {
  const [network, setNetwork] = useState<string>('mainnet');
  const [developerMode, setDeveloperMode] = useState<boolean>(false);
  const [emulatorModeOn, setEmulatorModeOn] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    // Set up storage change listener
    const handleStorageChange = (
      changes: { [key: string]: StorageChange },
      namespace: AreaName
    ) => {
      if (namespace === 'local') {
        // Changes is to local storage
        // Check network change
        if (changes[userWalletsKey] && changes[userWalletsKey].newValue) {
          const userWallets = changes[userWalletsKey].newValue;
          if (userWallets.network) {
            setNetwork(userWallets.network);
          }
          if (userWallets.emulatorMode !== undefined) {
            setEmulatorModeOn(userWallets.emulatorMode);
          }
        }
        // Check developer mode change
        if (changes['developerMode'] !== undefined) {
          setDeveloperMode(changes['developerMode'].newValue);
        }
      }
    };

    // Initial load from storage
    const loadInitialData = async () => {
      const developerModeValue = await storage.get('developerMode');
      const emulatorModeValue = await storage.get('emulatorMode');
      const userWalletsStorage = await getUserWalletsData();
      if (mounted) {
        if (developerModeValue !== undefined) {
          setDeveloperMode(developerModeValue);
        }
        if (emulatorModeValue !== undefined) {
          setEmulatorModeOn(emulatorModeValue);
        }
        if (userWalletsStorage && userWalletsStorage.network) {
          setNetwork(userWalletsStorage.network);
        }
      }
    };

    loadInitialData();
    storage.addStorageListener(handleStorageChange);

    return () => {
      mounted = false;
      storage.removeStorageListener(handleStorageChange);
    };
  }, []);

  return {
    network,
    developerMode,
    emulatorModeOn,
  };
};
