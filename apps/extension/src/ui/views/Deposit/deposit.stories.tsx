import { Box } from '@mui/material';
import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { fn } from 'storybook/test';
import { withRouter } from 'storybook-addon-remix-react-router';

import { type ActiveAccountType } from '@/shared/types/wallet-types';
import { useNetwork as importedMockUseNetwork } from '@/ui/hooks/useNetworkHook.mock';
import {
  useProfiles as importedMockUseProfiles,
  USE_PROFILES_MOCK,
} from '@/ui/hooks/useProfileHook.mock';

import Deposit from './index';

export default {
  title: 'views/Deposit',
  component: Deposit,
  decorators: [
    withRouter,
    (Story, context) => {
      importedMockUseNetwork.mockReset();
      importedMockUseProfiles.mockReset();
      const { address, network, activeAccountType } = context.args as {
        address: string;
        network: string;
        activeAccountType: string;
      };
      if (address && network && activeAccountType) {
        importedMockUseNetwork.mockImplementation(() => {
          return {
            network: network,
            developerMode: false,
            emulatorModeOn: false,
          };
        });
        importedMockUseProfiles.mockReturnValue({
          ...USE_PROFILES_MOCK,
          currentWallet: {
            ...USE_PROFILES_MOCK.currentWallet,
            address: address,
          },
          activeAccountType: activeAccountType as ActiveAccountType,
          network: network,
        });
      }
      return (
        <Box
          sx={{ backgroundColor: 'black', paddingBottom: '16px', width: '100%', height: '100%' }}
        >
          <Story />
        </Box>
      );
    },
  ],
} as Meta<typeof Deposit>;

export const DepositStoryFlow: StoryObj<typeof Deposit> = {
  args: {
    address: '0x1234567890',
    network: 'mainnet',
    activeAccountType: 'flow',
  },
};

export const DepositStoryEvm: StoryObj<typeof Deposit> = {
  args: {
    address: '0x0000000000000000000000000000000012345678',
    network: 'mainnet',
    activeAccountType: 'evm',
  },
};

export const DepositStoryFlowTestnet: StoryObj<typeof Deposit> = {
  args: {
    address: '0x1234567890',
    network: 'testnet',
    activeAccountType: 'flow',
  },
};

export const DepositStoryEvmTestnet: StoryObj<typeof Deposit> = {
  args: {
    address: '0x0000000000000000000000000000000012345678',
    network: 'testnet',
    activeAccountType: 'evm',
  },
};
