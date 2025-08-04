import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { BrowserRouter } from 'react-router';

import { type ExtendedTokenInfo } from '@onflow/frw-shared/types';

import { WalletProvider } from '@/ui/utils/WalletContext';

import TokenSelector from '../TokenSelector';

// Simple mock wallet
const mockWallet = {
  checkAddress: () => Promise.resolve(true),
  isBooted: () => Promise.resolve(true),
  getParentAddress: () => Promise.resolve('0xabcdef1234567890abcdef1234567890abcdef12'),
  getUserInfo: () => Promise.resolve({ id: 'mock-user-id', nickname: 'Mock User' }),
  getActiveAccountType: () => Promise.resolve('main'),
  checkMnemonics: () => Promise.resolve(true),
  lockAdd: () => Promise.resolve(),
};

const meta: Meta<typeof TokenSelector> = {
  title: 'Views/SendTo/TokenSelector',
  component: TokenSelector,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#121212',
        },
      ],
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px', height: '600px', backgroundColor: '#121212' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockCurrentToken: ExtendedTokenInfo = {
  address: 'A.1654653399040a61.FlowToken',
  name: 'Flow Token',
  contractName: 'FlowToken',
  decimals: 8,
  symbol: 'FLOW',
  path: {
    vault: '/storage/flowTokenVault',
    receiver: '/public/flowTokenReceiver',
    balance: '/storage/flowTokenBalance',
  },
  logoURI: 'https://example.com/flow-logo.png',
  tags: ['verified'],
  // CoinItem properties
  id: 'A.1654653399040a61.FlowToken',
  coin: 'flow',
  unit: 'flow',
  balance: '100.5',
  price: '1.5',
  change24h: 0.05,
  total: '150.75',
  icon: 'https://example.com/flow-logo.png',
  // ExtendedTokenInfo properties
  priceInUSD: '1.5',
  balanceInUSD: '150.75',
  priceInFLOW: '1.0',
  balanceInFLOW: '100.5',
};

const mockHandlers = {
  onClose: () => {},
  onTokenSelect: () => {},
};

export const Default: Story = {
  render: () => {
    return (
      <BrowserRouter>
        <WalletProvider wallet={mockWallet as any}>
          <TokenSelector open={true} currentToken={mockCurrentToken} {...mockHandlers} />
        </WalletProvider>
      </BrowserRouter>
    );
  },
};
