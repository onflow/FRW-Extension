import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
// eslint-disable-next-line import/order
import { withRouter } from 'storybook-addon-remix-react-router';
import { action } from 'storybook/actions';
import { fn } from 'storybook/test';

import { FLOW_BIP44_PATH } from '@onflow/flow-wallet-shared/constant/algo-constants';

import { useWallet as useWalletMock } from '@/ui/hooks/use-wallet.mock';

import ImportTabs from '../ImportTabs';

const meta = {
  title: 'components/import-components/ImportTabs',
  component: ImportTabs,
  decorators: [
    withRouter,
    (Story) => {
      useWalletMock.mockReset();
      useWalletMock.mockImplementation(() => ({
        openapi: {
          checkImport: fn().mockResolvedValue({ status: 200 }),
        },
        getCurrentAccount: fn().mockResolvedValue(null),
        isBooted: fn().mockResolvedValue(false),
      }));
      return (
        <Box sx={{ width: '100%', margin: 'auto' }}>
          <Story />
        </Box>
      );
    },
  ],
  parameters: {
    layout: 'centered',
  },
  args: {
    setMnemonic: fn(),
    setPk: fn(),
    setAccounts: fn(),
    goPassword: fn(),
    handleSwitchTab: fn(),
    setErrorMessage: fn(),
    setShowError: fn(),
    handleGoogleAccountsFound: fn(),
    setPath: fn(),
    setPhrase: fn(),
  },
} satisfies Meta<typeof ImportTabs>;

export default meta;

type Story = StoryObj<typeof ImportTabs>;

export const Default: Story = {
  args: {
    setMnemonic: action('setMnemonic'),
    setPk: action('setPk'),
    setAccounts: action('setAccounts'),

    goPassword: action('goPassword'),
    handleSwitchTab: action('handleSwitchTab'),
    setErrorMessage: action('setErrorMessage'),
    setShowError: action('setShowError'),
    handleGoogleAccountsFound: action('handleGoogleAccountsFound'),
    path: FLOW_BIP44_PATH,
    setPath: action('setPath'),
    phrase: '',
    setPhrase: action('setPhrase'),
  },
};
