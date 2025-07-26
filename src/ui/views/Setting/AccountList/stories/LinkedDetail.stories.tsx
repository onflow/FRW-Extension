import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { withRouter } from 'storybook-addon-remix-react-router';

import type {
  MainAccount,
  NftCollection,
  NftCollectionAndIds,
  WalletAccount,
} from '@onflow/frw-shared/types';

import {
  useChildAccountAllowTypes,
  useChildAccountDescription,
  useCurrentId,
  useMainAccount,
  useUserInfo,
} from '@/ui/hooks/use-account-hooks.mock';
import { useChildAccountFt } from '@/ui/hooks/use-coin-hooks.mock';
import { useWallet } from '@/ui/hooks/use-wallet.mock';
import {
  useCadenceNftCollectionsAndIds,
  useFullCadenceNftCollectionList,
} from '@/ui/hooks/useNftHook.mock';
import { USE_PROFILES_MOCK, useProfiles } from '@/ui/hooks/useProfileHook.mock';

import LinkedDetail from '../LinkedDetail';

// Mock the useWallet hook
const mockUseWallet = {
  getActiveAccountType: () => Promise.resolve('main'),
  checkMnemonics: () => Promise.resolve(true),
  lockAdd: () => Promise.resolve(),
  setChildAccountDescription: () => Promise.resolve(),
};

// Mock child account data
const _mockChildAccount: WalletAccount = {
  address: '0x1234567890123456',
  chain: 1,
  id: 2,
  name: 'Linked Account',
  icon: '🔗',
  color: '#4CAF50',
  balance: '25.5',
  nfts: 3,
};

// Mock parent account data
const mockParentAccount: MainAccount = {
  address: '0x1234567890123456',
  chain: 1,
  id: 1,
  name: 'Parent Account',
  icon: '👤',
  color: '#000000',
  balance: '100.5',
  nfts: 5,
  publicKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
  keyIndex: 0,
  weight: 1000,
  signAlgo: 0,
  signAlgoString: 'ECDSA',
  hashAlgo: 0,
  hashAlgoString: 'SHA256',
};

// Mock NFT collections data
const mockNFTCollections: NftCollectionAndIds[] = [
  {
    collection: {
      id: 'TestCollection',
      contractName: 'TestCollection',
      address: '0x1234567890123456',
      name: 'Test NFT Collection',
      logo: 'https://example.com/logo.png',
      banner: 'https://example.com/banner.png',
      description: 'A test NFT collection',
      evmAddress: '0x12345678901234561234567890123456',
      path: {
        storagePath: '/storage/TestCollection',
        publicPath: '/public/TestCollection',
      },
      socials: {},
      flowIdentifier: 'A.1234567890123456.TestCollection',
    },
    ids: ['1', '2', '3'],
    count: 3,
  },
  {
    collection: {
      id: 'EmptyCollection',
      contractName: 'EmptyCollection',
      address: '0x1234567890123457',
      name: 'Empty NFT Collection',
      logo: 'https://example.com/empty-logo.png',
      banner: 'https://example.com/empty-banner.png',
      description: 'An empty NFT collection',
      evmAddress: '0x12345678901234571234567890123457',
      path: {
        storagePath: '/storage/EmptyCollection',
        publicPath: '/public/EmptyCollection',
      },
      socials: {},
      flowIdentifier: 'A.1234567890123457.EmptyCollection',
    },
    ids: [],
    count: 0,
  },
];

// Mock FT data
const mockFTData = [
  { id: 'FLOW', balance: '10.5' },
  { id: 'USDC', balance: '100.0' },
  { id: 'FUSD', balance: '50.25' },
];

// Mock collection list data
const mockCollectionList: NftCollection[] = [
  {
    id: 'TestCollection',
    address: '0x1234567890123456',
    contractName: 'TestCollection',
    name: 'Test NFT Collection',
    logo: 'https://example.com/logo.png',
    banner: 'https://example.com/banner.png',
    description: 'A test NFT collection',
    flowIdentifier: 'A.1234567890123456.TestCollection',
    evmAddress: '0x12345678901234561234567890123456',
    path: {
      storagePath: '/storage/TestCollection',
      publicPath: '/public/TestCollection',
    },
    socials: {},
  },
  {
    id: 'EmptyCollection',
    address: '0x1234567890123457',
    contractName: 'EmptyCollection',
    name: 'Empty NFT Collection',
    logo: 'https://example.com/empty-logo.png',
    banner: 'https://example.com/empty-banner.png',
    description: 'An empty NFT collection',
    flowIdentifier: 'A.1234567890123457.EmptyCollection',
    evmAddress: '0x12345678901234571234567890123457',
    path: {
      storagePath: '/storage/EmptyCollection',
      publicPath: '/public/EmptyCollection',
    },
    socials: {},
  },
];

const meta: Meta<typeof LinkedDetail> = {
  title: 'Views/Setting/AccountList/LinkedDetail',
  component: LinkedDetail,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component:
          'Linked account detail page showing child account information, accessible NFTs, and coins.',
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
type Story = StoryObj<typeof LinkedDetail>;

export const Default: Story = {
  render: () => {
    // Mock all the hooks
    useMainAccount.mockReturnValue({
      ...mockParentAccount,
    });
    useProfiles.mockReturnValue({
      ...USE_PROFILES_MOCK,
      currentWallet: mockParentAccount,
      network: 'mainnet',
    });
    useWallet.mockReturnValue(mockUseWallet);
    useChildAccountAllowTypes.mockReturnValue([
      'A.1234567890123456.TestCollection',
      'A.1234567890123457.EmptyCollection',
    ]);
    useFullCadenceNftCollectionList.mockReturnValue(mockCollectionList);
    useCadenceNftCollectionsAndIds.mockReturnValue(mockNFTCollections);
    useChildAccountFt.mockReturnValue(mockFTData);
    useChildAccountDescription.mockReturnValue('This is a test linked account');
    useCurrentId.mockReturnValue('1');
    useUserInfo.mockReturnValue({
      avatar: 'https://lilico.app/api/avatar/beam/120/avatar',
      nickname: 'Test User',
      username: 'testuser',
      private: 0,
      created: '2021-01-01',
      id: '1',
    });

    return <LinkedDetail />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Default linked account detail page with NFTs and coins.',
      },
    },
    reactRouter: {
      routePath: '/dashboard/setting/accountlist/linked/:key',
      routeParams: { key: '0x1234567890123456' },
      searchParams: {
        parentName: 'Parent Account',
        parentAddress: '0x1234567890123456789012345678901234567890',
      },
    },
  },
};
