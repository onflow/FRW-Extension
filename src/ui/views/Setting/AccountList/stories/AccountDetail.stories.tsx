import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { withRouter } from 'storybook-addon-remix-react-router';

import type { Emoji, MainAccount, StorageInfo } from '@onflow/frw-shared/types';

import { toggleAccountHidden, useAccountHidden } from '@/ui/hooks/preference-hooks.mock';
import { useMainAccount } from '@/ui/hooks/use-account-hooks.mock';
import { useFeatureFlag } from '@/ui/hooks/use-feature-flags.mock';
import { useWallet } from '@/ui/hooks/use-wallet.mock';
import { useNetwork } from '@/ui/hooks/useNetworkHook.mock';

import AccountDetail from '../AccountDetail';

// Mock the useWallet hook
const mockUseWallet = {
  getActiveAccountType: () => Promise.resolve('main'),
  checkMnemonics: () => Promise.resolve(true),
  lockAdd: () => Promise.resolve(),
  getPayerAddressAndKeyId: () => Promise.resolve(),
  openapi: {
    getStorageInfo: () =>
      Promise.resolve({
        available: 1000000,
        used: 500000,
        capacity: 1000000,
      } as StorageInfo),
  },
};

// Mock account data
const mockMainAccount: MainAccount = {
  address: '0x1234567890123456', // Flow address (16 characters)
  chain: 1,
  id: 1,
  name: 'Test Account',
  icon: '🥥',
  color: '#FF6B35',
  balance: '100.5',
  nfts: 5,
  publicKey: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  keyIndex: 0,
  weight: 1000,
  signAlgo: 1,
  signAlgoString: 'ECDSA_P256',
  hashAlgo: 1,
  hashAlgoString: 'SHA3_256',
  evmAccount: {
    address: '0x1234567890123456789012345678901234567890', // EVM address (40 characters)
    chain: 1,
    id: 2,
    name: 'EVM Account',
    icon: '🚀',
    color: '#4CAF50',
    balance: '50.25',
    nfts: 2,
  },
  childAccounts: [],
};

const mockEVMAccount: MainAccount = {
  address: '0x1234567890123456789012345678901234567890', // EVM address (40 characters)
  chain: 1,
  id: 1,
  name: 'EVM Test Account',
  icon: '🚀',
  color: '#4CAF50',
  balance: '50.25',
  nfts: 2,
  publicKey: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  keyIndex: 0,
  weight: 1000,
  signAlgo: 1,
  signAlgoString: 'ECDSA_P256',
  hashAlgo: 1,
  hashAlgoString: 'SHA3_256',
  evmAccount: {
    address: '0x1234567890123456789012345678901234567890', // EVM address (40 characters)
    chain: 1,
    id: 2,
    name: 'EVM Account',
    icon: '🚀',
    color: '#4CAF50',
    balance: '50.25',
    nfts: 2,
  },
  childAccounts: [],
};

const _mockEmoji: Emoji = {
  emoji: '🥥',
  name: 'Coconut',
  bgcolor: '#FFE4C4',
};

const meta: Meta<typeof AccountDetail> = {
  title: 'Views/Setting/AccountList/AccountDetail',
  component: AccountDetail,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component: 'Account detail page showing account information, settings, and storage usage.',
      },
    },
  },
  decorators: [
    withRouter,
    (Story) => (
      <React.StrictMode>
        <div
          style={{
            width: '400px',
            backgroundColor: '#1A1A1A',
            minHeight: '100vh',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Story />
        </div>
      </React.StrictMode>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AccountDetail>;

export const Default: Story = {
  render: () => {
    // Mock all the hooks
    useMainAccount.mockReturnValue(mockMainAccount);
    useNetwork.mockReturnValue({
      network: 'mainnet',
      developerMode: false,
      emulatorModeOn: false,
    });
    useWallet.mockReturnValue(mockUseWallet);
    useFeatureFlag.mockReturnValue(true);
    useAccountHidden.mockReturnValue(false);
    toggleAccountHidden.mockImplementation(() => Promise.resolve(false));

    return <AccountDetail />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Default account detail page with Flow account.',
      },
    },
    reactRouter: {
      routePath: '/dashboard/setting/accountlist/:address',
      routeParams: { address: '0x1234567890123456' },
    },
  },
};

export const EVMAccount: Story = {
  render: () => {
    // Mock for EVM account
    useMainAccount.mockReturnValue(mockEVMAccount);
    useNetwork.mockReturnValue({
      network: 'mainnet',
      developerMode: false,
      emulatorModeOn: false,
    });
    useWallet.mockReturnValue(mockUseWallet);
    useFeatureFlag.mockReturnValue(true);
    useAccountHidden.mockReturnValue(false);
    toggleAccountHidden.mockImplementation(() => Promise.resolve(false));

    return <AccountDetail />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Account detail page for EVM account.',
      },
    },
    reactRouter: {
      routePath: '/dashboard/setting/accountlist/:address',
      routeParams: { address: '0x1234567890123456789012345678901234567890' },
    },
  },
};

export const WithoutKeyphrase: Story = {
  render: () => {
    const mockWalletWithoutKeyphrase = {
      ...mockUseWallet,
      checkMnemonics: () => Promise.resolve(false),
    };

    useMainAccount.mockReturnValue(mockMainAccount);
    useNetwork.mockReturnValue({
      network: 'mainnet',
      developerMode: false,
      emulatorModeOn: false,
    });
    useWallet.mockReturnValue(mockWalletWithoutKeyphrase);
    useFeatureFlag.mockReturnValue(true);
    useAccountHidden.mockReturnValue(false);
    toggleAccountHidden.mockImplementation(() => Promise.resolve(false));

    return <AccountDetail />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Account detail page without recovery phrase option.',
      },
    },
    reactRouter: {
      routePath: '/dashboard/setting/accountlist/:address',
      routeParams: { address: '0x1234567890123456' },
    },
  },
};
