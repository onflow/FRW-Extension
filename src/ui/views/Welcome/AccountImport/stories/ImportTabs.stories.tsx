import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { action } from 'storybook/actions';
import { fn } from 'storybook/test';

import { FLOW_BIP44_PATH } from '@/shared/utils/algo-constants';
import { Link as LinkMock } from '@/stories/react-router-dom.mock';
import { useWallet as useWalletMock } from '@/stories/wallet-context.mock';
import { IMPORT_STEPS } from '@/ui/reducers/import-profile-reducer';

import ImportTabs from '../ImportTabs';

const meta = {
  title: 'View/Welcome/AccountImport/ImportTabs',
  component: ImportTabs,
  decorators: [
    (Story) => {
      LinkMock.mockReset();
      LinkMock.mockImplementation((props: any) => <Box {...props} />);

      useWalletMock.mockReset();
      useWalletMock.mockImplementation(() => ({
        openapi: {
          checkImport: fn().mockResolvedValue({ status: 200 }),
        },
        getCurrentAccount: fn().mockResolvedValue(null),
        isBooted: fn().mockResolvedValue(false),
      }));
      return (
        <Box sx={{ width: '100%', maxWidth: '600px', margin: 'auto' }}>
          <Story />
        </Box>
      );
    },
  ],
  parameters: {
    layout: 'centered',
  },
  args: {
    state: {
      activeTab: IMPORT_STEPS.PICK_USERNAME,
      mnemonic: '',
      pk: '',
      username: '',
      accounts: [],
      errMessage: '',
      showError: false,
      showGoogleImport: false,
      accountAlreadyImported: false,
      googleAccounts: [],
      path: FLOW_BIP44_PATH,
      phrase: '',
    },
    dispatch: action('dispatch'),
  },
} satisfies Meta<typeof ImportTabs>;

export default meta;

type Story = StoryObj<typeof ImportTabs>;

export const Default: Story = {
  args: {
    state: {
      activeTab: IMPORT_STEPS.PICK_USERNAME,
      mnemonic: '',
      pk: '',
      username: '',
      accounts: [],
      errMessage: '',
      showError: false,
      showGoogleImport: false,
      accountAlreadyImported: false,
      googleAccounts: [],
      path: FLOW_BIP44_PATH,
      phrase: '',
    },
    dispatch: action('dispatch'),
  },
};
