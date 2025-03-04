import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { storage } from '@/background/webapi';

import { useProfiles } from '../hooks/useProfileHook';

interface NetworkState {
  currentNetwork: string;
  developerMode: boolean;
  emulatorModeOn: boolean;
  setNetwork: (network: string) => void;
  setDeveloperMode: (mode: boolean) => void;
  setEmulatorModeOn: (mode: boolean) => void;
}

export const useNetworkStore = create<NetworkState>()(
  subscribeWithSelector((set) => {
    // Initialize store on creation
    const init = async () => {
      const developerMode = await storage.get('developerMode');
      if (developerMode) {
        set({ developerMode });
      }
    };
    init();

    return {
      currentNetwork: 'mainnet',
      developerMode: false,
      emulatorModeOn: false,
      setNetwork: (network) => set({ currentNetwork: network }),
      setDeveloperMode: (mode) => set({ developerMode: mode }),
      setEmulatorModeOn: (mode) => set({ emulatorModeOn: mode }),
    };
  })
);

// Subscribe to network changes
useNetworkStore.subscribe(
  (state) => state.currentNetwork,
  async () => {
    // Trigger profile updates when network changes
    const { fetchProfileData, freshUserWallet, fetchUserWallet } = useProfiles();

    await fetchProfileData();
    await freshUserWallet();
    await fetchUserWallet();
  }
);
