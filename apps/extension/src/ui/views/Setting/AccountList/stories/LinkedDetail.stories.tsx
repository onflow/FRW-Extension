import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { withRouter } from 'storybook-addon-remix-react-router';

import type { NFTCollections } from '@onflow/flow-wallet-shared/types/nft-types';
import type { WalletAccount } from '@onflow/flow-wallet-shared/types/wallet-types';

import {
  useChildAccountAllowTypes,
  useChildAccountDescription,
  useCurrentId,
  useMainAccount,
  useUserInfo,
} from '@/ui/hooks/use-account-hooks.mock';
import { useChildAccountFt } from '@/ui/hooks/use-coin-hooks.mock';
import { useWallet } from '@/ui/hooks/use-wallet.mock';
import { useNftCatalogCollections, useNftCollectionList } from '@/ui/hooks/useNftHook.mock';
import { useProfiles } from '@/ui/hooks/useProfileHook.mock';

import LinkedDetail from '../LinkedDetail';

// Mock the useWallet hook
const mockUseWallet = {
  getActiveAccountType: () => Promise.resolve('main'),
  checkMnemonics: () => Promise.resolve(true),
  lockAdd: () => Promise.resolve(),
  setChildAccountDescription: () => Promise.resolve(),
};

// Mock child account data
const mockChildAccount: WalletAccount = {
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
const mockParentAccount = {
  address: '0x1234567890123456789012345678901234567890',
  chain: 1,
  id: 1,
  name: 'Parent Account',
  icon: '👤',
  color: '#000000',
  balance: '100.5',
  nfts: 5,
};

// Mock NFT collections data
const mockNFTCollections: NFTCollections[] = [
  {
    collection: {
      id: 'TestCollection',
      contract_name: 'TestCollection',
      address: '0x1234567890123456',
      name: 'Test NFT Collection',
      logo: 'https://example.com/logo.png',
      banner: 'https://example.com/banner.png',
      description: 'A test NFT collection',
      path: {
        storage_path: '/storage/TestCollection',
        public_path: '/public/TestCollection',
        private_path: 'deprecated/private_path',
      },
      socials: {},
      nftTypeId: 'A.1234567890123456.TestCollection',
    },
    ids: ['1', '2', '3'],
    count: 3,
  },
  {
    collection: {
      id: 'EmptyCollection',
      contract_name: 'EmptyCollection',
      address: '0x1234567890123457',
      name: 'Empty NFT Collection',
      logo: 'https://example.com/empty-logo.png',
      banner: 'https://example.com/empty-banner.png',
      description: 'An empty NFT collection',
      path: {
        storage_path: '/storage/EmptyCollection',
        public_path: '/public/EmptyCollection',
        private_path: 'deprecated/private_path',
      },
      socials: {},
      nftTypeId: 'A.1234567890123457.EmptyCollection',
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
const mockCollectionList = [
  {
    id: 'TestCollection',
    address: '0x1234567890123456',
    contract_name: 'TestCollection',
    name: 'Test NFT Collection',
    logo: 'https://example.com/logo.png',
    banner: 'https://example.com/banner.png',
    description: 'A test NFT collection',
    flowIdentifier: 'A.1234567890123456.TestCollection',
  },
  {
    id: 'EmptyCollection',
    address: '0x1234567890123457',
    contract_name: 'EmptyCollection',
    name: 'Empty NFT Collection',
    logo: 'https://example.com/empty-logo.png',
    banner: 'https://example.com/empty-banner.png',
    description: 'An empty NFT collection',
    flowIdentifier: 'A.1234567890123457.EmptyCollection',
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
    (useMainAccount as any).mockReturnValue({
      ...mockParentAccount,
      childAccounts: [mockChildAccount],
    });
    (useProfiles as any).mockReturnValue({
      currentWallet: mockParentAccount,
      network: 'mainnet',
    });
    (useWallet as any).mockReturnValue(mockUseWallet);
    (useChildAccountAllowTypes as any).mockReturnValue([
      'A.1234567890123456.TestCollection',
      'A.1234567890123457.EmptyCollection',
    ]);
    (useNftCollectionList as any).mockReturnValue(mockCollectionList);
    (useNftCatalogCollections as any).mockReturnValue(mockNFTCollections);
    (useChildAccountFt as any).mockReturnValue(mockFTData);
    (useChildAccountDescription as any).mockReturnValue('This is a test linked account');
    (useCurrentId as any).mockReturnValue('1');
    (useUserInfo as any).mockReturnValue({
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
