import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { withRouter } from 'storybook-addon-remix-react-router';

import emojisJson from '@/shared/constant/emoji.json';
import { type FeatureFlagKey } from '@/shared/types/feature-types';
import { MAINNET_CHAIN_ID, type UserInfoResponse } from '@/shared/types/network-types';
import { type Emoji, type MainAccount, type WalletAccount } from '@/shared/types/wallet-types';
import { useFeatureFlag as importedMockUseFeatureFlag } from '@/ui/hooks/use-feature-flags.mock';
import { useNftCatalogCollections as importedMockUseNftCatalogCollections } from '@/ui/hooks/useNftHook.mock';
import {
  useProfiles as importedMockUseProfiles,
  USE_PROFILES_MOCK,
} from '@/ui/hooks/useProfileHook.mock';
const { emojis } = emojisJson as { emojis: Emoji[] };

import MenuDrawer from '../MenuDrawer';

// Mock wallet accounts - aligned with account-listing stories
const mockMainAccount: MainAccount = {
  name: emojis[2].name,
  icon: emojis[2].emoji,
  color: emojis[2].bgcolor,
  address: '0x0c666c888d8fb259',
  chain: MAINNET_CHAIN_ID,
  id: 1,
  balance: '550.66005012',
  nfts: 12,
  publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
  keyIndex: 0,
  weight: 1000,
  signAlgo: 0,
  signAlgoString: 'ECDSA',
  hashAlgo: 0,
  hashAlgoString: 'SHA256',
};

const mockMainAccount2: MainAccount = {
  name: emojis[3].name,
  icon: emojis[3].emoji,
  color: emojis[3].bgcolor,
  address: '0x0c555c888d8fb259',
  chain: MAINNET_CHAIN_ID,
  id: 2,
  balance: '0.00000077',
  nfts: 4,
  publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
  keyIndex: 0,
  weight: 1000,
  signAlgo: 0,
  signAlgoString: 'ECDSA',
  hashAlgo: 0,
  hashAlgoString: 'SHA256',
};

const mockEvmAccount: WalletAccount = {
  name: emojis[6].name,
  icon: emojis[6].emoji,
  color: emojis[6].bgcolor,
  address: '0x00000000000000000000000279356d1221d883F5',
  chain: MAINNET_CHAIN_ID,
  id: 3,
  balance: '550.66005012',
  nfts: 12,
};

const mockEvmAccount2: WalletAccount = {
  name: emojis[7].name,
  icon: emojis[7].emoji,
  color: emojis[7].bgcolor,
  address: '0x00000000000000000000000279356d1221d883F6',
  chain: MAINNET_CHAIN_ID,
  id: 4,
  balance: '201.66005012',
  nfts: 0,
};

const mockChildAccount1: WalletAccount = {
  name: 'Dapper Wallet',
  icon: 'https://accounts.meetdapper.com/static/img/dapper/dapper.png',
  color: emojis[6].bgcolor,
  address: '0x863ac53e3aa7b411',
  chain: MAINNET_CHAIN_ID,
  id: 5,
  balance: '550.66005012',
  nfts: 12,
};

const mockChildAccount2: WalletAccount = {
  name: 'Dapper Wallet 2',
  icon: 'https://accounts.meetdapper.com/static/img/dapper/dapper.png',
  color: emojis[6].bgcolor,
  address: '0x863ac53e33a7b411',
  chain: MAINNET_CHAIN_ID,
  id: 6,
  balance: '550.66005012',
  nfts: 12,
};

// Mock pending transaction (not a full account)
const mockPendingTransaction = {
  txId: 'pending-tx-123',
  id: 7,
  address: '',
  name: '',
  icon: 'pendingAccount',
  color: '#BABABA',
  chain: 747,
  balance: '',
};

const mockUserInfo: UserInfoResponse = {
  id: '12345',
  nickname: 'John Doe',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  username: 'johndoe',
  private: 0,
  created: '2024-01-01T00:00:00Z',
};

// Helper to create mock data for stories - same as account-listing
const createMockData = (config: {
  [address: string]: { evm?: WalletAccount; children?: WalletAccount[]; nfts?: number };
}) => {
  const evmAccounts: Record<string, WalletAccount | undefined> = {};
  const childAccounts: Record<string, WalletAccount[] | undefined> = {};
  const nfts: Record<string, number | undefined> = {};
  for (const addr in config) {
    if (Object.prototype.hasOwnProperty.call(config, addr)) {
      evmAccounts[addr] = config[addr].evm;
      childAccounts[addr] = config[addr].children;
      nfts[addr] = config[addr].nfts;
    }
  }
  return { evmAccounts, childAccounts, nfts };
};

const mockWalletList: MainAccount[] = [
  {
    ...mockMainAccount,
    evmAccount: mockEvmAccount,
    childAccounts: [mockChildAccount1, mockChildAccount2],
  },
  { ...mockMainAccount2, evmAccount: mockEvmAccount2, childAccounts: [] },
];

// Remove the pending account from the regular wallet list
const mockWalletListWithExtra: MainAccount[] = [mockMainAccount, mockMainAccount2];

const meta: Meta<typeof MenuDrawer> = {
  title: 'Views/Dashboard/MenuDrawer',
  component: MenuDrawer,
  decorators: [
    withRouter,
    (Story, context) => {
      // Reset mocks

      importedMockUseNftCatalogCollections.mockReset();
      importedMockUseProfiles.mockReset();
      importedMockUseFeatureFlag.mockReset();
      const { mockData, pendingTransactions, featureFlags } = context.parameters;

      // Set up feature flag mocks
      importedMockUseFeatureFlag.mockImplementation((featureFlag: FeatureFlagKey) => {
        return featureFlags?.[featureFlag] || false;
      });

      if (mockData) {
        importedMockUseNftCatalogCollections.mockImplementation(() => {
          return [];
        });
        importedMockUseProfiles.mockReturnValue({
          ...USE_PROFILES_MOCK,
          pendingAccountTransactions: pendingTransactions || [],
        });
      } else {
        importedMockUseProfiles.mockReturnValue({
          ...USE_PROFILES_MOCK,
          pendingAccountTransactions: [],
        });
      }

      return (
        <div style={{ height: '100vh', backgroundColor: '#000' }}>
          <Story />
        </div>
      );
    },
  ],
  argTypes: {
    drawer: {
      control: 'boolean',
      description: 'Controls whether the drawer is open',
    },
    network: {
      control: 'select',
      options: ['mainnet', 'testnet'],
    },
    modeOn: {
      control: 'boolean',
      description: 'Developer mode toggle',
    },
    mainAddressLoading: {
      control: 'boolean',
      description: 'Shows loading state for main address',
    },
    noAddress: {
      control: 'boolean',
      description: 'Indicates no wallet address is available',
    },
    toggleDrawer: { action: 'toggle drawer' },
    togglePop: { action: 'toggle popup' },
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof MenuDrawer>;

export const Default: Story = {
  args: {
    drawer: true,
    userInfo: mockUserInfo,
    walletList: mockWalletList,
    activeAccount: mockMainAccount,
    activeParentAccount: mockMainAccount,
    network: 'mainnet',
    modeOn: false,
    mainAddressLoading: false,
    noAddress: false,
    toggleDrawer: () => {},
    togglePop: () => {},
  },
  parameters: {
    mockData: createMockData({
      [mockMainAccount.address]: {
        evm: mockEvmAccount,
        children: [mockChildAccount1, mockChildAccount2],
      },
      [mockMainAccount2.address]: {
        evm: mockEvmAccount2,
        children: [],
      },
      [mockChildAccount1.address]: {
        nfts: 65000,
      },
      [mockChildAccount2.address]: {
        nfts: 12,
      },
    }),
  },
};

export const EmptyWallet: Story = {
  args: {
    drawer: true,
    userInfo: mockUserInfo,
    walletList: [mockMainAccount],
    activeAccount: mockMainAccount,
    activeParentAccount: mockMainAccount,
    network: 'mainnet',
    modeOn: false,
    mainAddressLoading: false,
    noAddress: true,
    toggleDrawer: () => {},
    togglePop: () => {},
  },
  parameters: {
    mockData: createMockData({}),
  },
};

export const Loading: Story = {
  args: {
    drawer: true,
    userInfo: undefined,
    walletList: [],
    activeAccount: undefined,
    activeParentAccount: mockMainAccount,
    network: 'mainnet',
    modeOn: false,
    mainAddressLoading: true,
    noAddress: false,
    toggleDrawer: () => {},
    togglePop: () => {},
  },
  parameters: {
    mockData: createMockData({}),
  },
};

export const Testnet: Story = {
  args: {
    drawer: true,
    userInfo: mockUserInfo,
    walletList: mockWalletList,
    activeAccount: mockMainAccount,
    activeParentAccount: mockMainAccount,
    network: 'testnet',
    modeOn: false,
    mainAddressLoading: false,
    noAddress: false,
    toggleDrawer: () => {},
    togglePop: () => {},
  },
  parameters: {
    mockData: createMockData({
      [mockMainAccount.address]: {
        evm: mockEvmAccount,
        children: [mockChildAccount1, mockChildAccount2],
      },
      [mockMainAccount2.address]: {
        evm: mockEvmAccount2,
        children: [],
      },
      [mockChildAccount1.address]: {
        nfts: 65000,
      },
      [mockChildAccount2.address]: {
        nfts: 12,
      },
    }),
  },
};

export const EvmAccountActive: Story = {
  args: {
    drawer: true,
    userInfo: mockUserInfo,
    walletList: mockWalletList,
    activeAccount: mockEvmAccount,
    activeParentAccount: mockMainAccount,
    network: 'mainnet',
    modeOn: false,
    mainAddressLoading: false,
    noAddress: false,
    toggleDrawer: () => {},
    togglePop: () => {},
  },
  parameters: {
    mockData: createMockData({
      [mockMainAccount.address]: {
        evm: mockEvmAccount,
        children: [mockChildAccount2],
      },
      [mockMainAccount2.address]: {
        evm: mockEvmAccount2,
        children: [],
      },
      [mockChildAccount1.address]: {
        nfts: 65000,
      },
      [mockChildAccount2.address]: {
        nfts: 12,
      },
    }),
  },
};

export const ChildAccountActive: Story = {
  args: {
    drawer: true,
    userInfo: mockUserInfo,
    walletList: mockWalletList,
    activeAccount: mockChildAccount1,
    activeParentAccount: mockMainAccount,
    network: 'mainnet',
    modeOn: false,
    mainAddressLoading: false,
    noAddress: false,
    toggleDrawer: () => {},
    togglePop: () => {},
  },
  parameters: {
    mockData: createMockData({
      [mockMainAccount.address]: {
        evm: mockEvmAccount,
        children: [mockChildAccount1, mockChildAccount2],
      },
      [mockMainAccount2.address]: {
        children: [],
      },
      [mockChildAccount1.address]: {
        nfts: 65000,
      },
      [mockChildAccount2.address]: {
        nfts: 12,
      },
    }),
  },
};

export const Closed: Story = {
  name: 'Drawer Closed',
  args: {
    drawer: false,
    userInfo: mockUserInfo,
    walletList: mockWalletList,
    activeAccount: mockMainAccount,
    activeParentAccount: mockMainAccount,
    network: 'mainnet',
    modeOn: false,
    mainAddressLoading: false,
    noAddress: false,
    toggleDrawer: () => {},
    togglePop: () => {},
  },
  parameters: {
    mockData: createMockData({
      [mockMainAccount.address]: {
        evm: mockEvmAccount,
        children: [mockChildAccount1, mockChildAccount2],
      },
      [mockMainAccount2.address]: {
        evm: mockEvmAccount2,
        children: [],
      },
      [mockChildAccount1.address]: {
        nfts: 65000,
      },
      [mockChildAccount2.address]: {
        nfts: 12,
      },
    }),
  },
};

export const FullAccountHierarchyWithPending: Story = {
  args: {
    drawer: true,
    userInfo: mockUserInfo,
    walletList: mockWalletList,
    activeAccount: mockMainAccount,
    activeParentAccount: mockMainAccount,
    network: 'mainnet',
    modeOn: false,
    mainAddressLoading: false,
    noAddress: false,
    toggleDrawer: () => {},
    togglePop: () => {},
  },
  parameters: {
    pendingTransactions: [mockPendingTransaction],
    mockData: createMockData({
      [mockMainAccount.address]: {
        evm: mockEvmAccount,
        children: [mockChildAccount1, mockChildAccount2],
      },
      [mockMainAccount2.address]: {
        evm: mockEvmAccount2,
        children: [],
      },
      [mockChildAccount1.address]: {
        nfts: 65000,
      },
      [mockChildAccount2.address]: {
        nfts: 12,
      },
    }),
  },
};

export const AddAccountFeatureFlagsAllTrue: Story = {
  args: {
    drawer: true,
    userInfo: mockUserInfo,
    walletList: mockWalletList,
    activeAccount: mockMainAccount,
    activeParentAccount: mockMainAccount,
    network: 'mainnet',
    modeOn: false,
    mainAddressLoading: false,
    noAddress: false,
    toggleDrawer: () => {},
    togglePop: () => {},
  },
  parameters: {
    featureFlags: {
      create_new_account: true,
      import_existing_account: true,
    },
    mockData: createMockData({
      [mockMainAccount.address]: {
        evm: mockEvmAccount,
        children: [mockChildAccount1, mockChildAccount2],
      },
      [mockMainAccount2.address]: {
        evm: mockEvmAccount2,
        children: [],
      },
      [mockChildAccount1.address]: {
        nfts: 65000,
      },
      [mockChildAccount2.address]: {
        nfts: 12,
      },
    }),
  },
};
