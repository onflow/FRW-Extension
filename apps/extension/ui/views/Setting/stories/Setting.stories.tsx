import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { withRouter } from 'storybook-addon-remix-react-router';

import { useUserInfo as useUserInfoMock } from '@/ui/hooks/use-account-hooks.mock';
import { useUserData } from '@/ui/hooks/use-data.mock';
import { useWallet as useWalletMock } from '@/ui/hooks/use-wallet.mock';
import { useNetwork } from '@/ui/hooks/useNetworkHook.mock';
import { USE_PROFILES_MOCK, useProfiles } from '@/ui/hooks/useProfileHook.mock';

import SettingTab from '../index';

// Mock the useWallet hook
const mockUseWallet = {
  getActiveAccountType: () => Promise.resolve('main'),
  checkMnemonics: () => Promise.resolve(true),
  lockAdd: () => Promise.resolve(),
};

const meta: Meta<typeof SettingTab> = {
  title: 'Views/Setting/SettingTab',
  component: SettingTab,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component: 'The main settings page for the Flow Wallet extension.',
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
type Story = StoryObj<typeof SettingTab>;

export const Default: Story = {
  render: () => {
    useUserInfoMock.mockReturnValue({
      avatar: 'https://lilico.app/api/avatar/beam/120/avatar',
      nickname: 'Test User',
      username: 'testuser',
      private: 0,
      created: '2021-01-01',
      id: '1',
    });
    useNetwork.mockReturnValue({
      network: 'mainnet',
      developerMode: false,
      emulatorModeOn: false,
    });
    useUserData.mockImplementation((key: string | null | undefined) => {
      if (key === 'currentId') return '1';
      if (key === 'userWallets') return { currentAddress: '0x12345678', network: 'mainnet' };
      if (key === 'keyringState') return { currentId: '1' };
      if (key === 'lilicoPayer') return '0x12345678';
      return undefined;
    });
    useProfiles.mockReturnValue({
      ...USE_PROFILES_MOCK,
      profileIds: [],
      userInfo: undefined,
    });
    useWalletMock.mockReturnValue(mockUseWallet);

    return <SettingTab />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Default settings page.',
      },
    },
  },
};

export const WithProfile: Story = {
  render: () => {
    useUserInfoMock.mockReturnValue({
      avatar: 'https://lilico.app/api/avatar/beam/120/avatar',
      nickname: 'Test User',
      username: 'testuser',
      private: 0,
      created: '2021-01-01',
      id: '1',
    });
    useNetwork.mockReturnValue({
      network: 'mainnet',
      developerMode: false,
      emulatorModeOn: false,
    });
    useUserData.mockImplementation((key: string | null | undefined) => {
      if (key === 'currentId') return '1';
      if (key === 'userWallets') return { currentAddress: '0x12345678', network: 'mainnet' };
      if (key === 'keyringState') return { currentId: '1' };
      if (key === 'lilicoPayer') return '0x12345678';
      return undefined;
    });
    useProfiles.mockReturnValue({
      ...USE_PROFILES_MOCK,
      profileIds: ['1', '2'],
      userInfo: {
        avatar: 'https://lilico.app/api/avatar/beam/120/avatar',
        nickname: 'Test User',
        username: 'testuser',
        private: 0,
        created: '2021-01-01',
        id: '1',
      },
    });
    useWalletMock.mockReturnValue(mockUseWallet);

    return <SettingTab />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings page with a user profile displayed at the top.',
      },
    },
  },
};
