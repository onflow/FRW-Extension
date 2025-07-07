import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { withRouter } from 'storybook-addon-remix-react-router';
// eslint-disable-next-line import/order
import { fn } from 'storybook/test';

import { useWallet as useWalletMock } from '@/ui/hooks/use-wallet.mock';

import RecoverProfile from '../index';

const meta = {
  title: 'views/Welcome/RecoverProfile',
  component: RecoverProfile,
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
} satisfies Meta<typeof RecoverProfile>;

export default meta;

type Story = StoryObj<typeof RecoverProfile>;

export const Default: Story = {
  args: {},
};
