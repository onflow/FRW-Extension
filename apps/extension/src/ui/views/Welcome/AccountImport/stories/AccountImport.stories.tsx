import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { fn } from 'storybook/test';
import { withRouter } from 'storybook-addon-remix-react-router';

import { useWallet as useWalletMock } from '@/ui/utils/WalletContext.mock';

import AccountImport from '../index';

const meta = {
  title: 'views/Welcome/AccountImport',
  component: AccountImport,
  decorators: [
    withRouter,
    (Story) => {
      useWalletMock.mockReset();
      useWalletMock.mockResolvedValue({
        openapi: {
          checkImport: fn().mockResolvedValue({ status: 200 }),
        },
        getCurrentAccount: fn().mockResolvedValue(null),
        importProfileUsingPrivateKey: fn(),
        importProfileUsingMnemonic: fn(),
        isBooted: fn().mockResolvedValue(false),
      });
      return (
        <Box
          sx={{
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          <Story />
        </Box>
      );
    },
  ],
  parameters: {
    layout: 'centered',
  },
  args: {},
} satisfies Meta<typeof AccountImport>;

export default meta;

type Story = StoryObj<typeof AccountImport>;

export const Default: Story = {
  args: {},
};
