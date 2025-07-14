import { useDeveloperMode, useUserWallets } from './use-account-hooks';

export const useNetwork = () => {
  const userWallets = useUserWallets();
  const developerMode = useDeveloperMode();
  const network = userWallets?.network;
  const emulatorModeOn = !!userWallets?.emulatorMode;

  return {
    network,
    developerMode,
    emulatorModeOn,
  };
};
