import { consoleLog } from '@onflow/flow-wallet-shared/utils/console-log';

import { useDeveloperMode, useUserWallets } from './use-account-hooks';

export const useNetwork = () => {
  const userWallets = useUserWallets();
  const developerMode = useDeveloperMode();
  consoleLog('useNetwork', userWallets, developerMode);
  const network = userWallets?.network;
  const emulatorModeOn = !!userWallets?.emulatorMode;

  return {
    network,
    developerMode,
    emulatorModeOn,
  };
};
