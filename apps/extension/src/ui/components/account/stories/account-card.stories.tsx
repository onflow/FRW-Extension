import { type Meta, type StoryObj } from '@storybook/react-webpack5';

import emojisJson from '@onflow/flow-wallet-shared/constant/emoji.json';
import { MAINNET_CHAIN_ID } from '@onflow/flow-wallet-shared/types/network-types';
import { type WalletAccount } from '@onflow/flow-wallet-shared/types/wallet-types';
const { emojis } = emojisJson;

import { useAccountBalance } from '../../../hooks/use-account-hooks.mock';
import { useNftCatalogCollections } from '../../../hooks/useNftHook.mock';
import { AccountCard } from '../account-card';

const mainWalletAccount: WalletAccount = {
  name: emojis[2].name,
  icon: emojis[2].emoji,
  color: emojis[2].bgcolor,
  address: '0x0c666c888d8fb259',
  chain: MAINNET_CHAIN_ID,
  id: 1,
  balance: '550.66005012',
  nfts: 12,
};

const evmWalletAccount: WalletAccount = {
  name: emojis[6].name,
  icon: emojis[6].emoji,
  color: emojis[6].bgcolor,
  address: '0x00000000000000000000000279356d1221d883F5', // Flow COA EVM address
  chain: MAINNET_CHAIN_ID,
  id: 1,
  balance: '550.66005012',
  nfts: 12,
};

const meta: Meta<typeof AccountCard> = {
  title: 'Components/account/AccountCard',
  tags: ['autodocs'],

  component: AccountCard,
  argTypes: {
    network: {
      control: 'select',
      options: ['mainnet', 'testnet'],
    },
    account: {
      control: 'object',
      options: [mainWalletAccount, undefined],
    },
    active: {
      control: 'boolean',
    },
    spinning: {
      control: 'boolean',
    },
    showLink: {
      control: 'boolean',
    },
  },
};

export default meta;

type Story = StoryObj<typeof AccountCard>;

export const Default: Story = {
  beforeEach: () => {
    useAccountBalance.mockReturnValue(mainWalletAccount.balance);
    useNftCatalogCollections.mockReturnValue([]);
  },
  args: {
    network: 'mainnet',
    account: mainWalletAccount,
    showCard: true,
  },
};
export const SmallFlow: Story = {
  beforeEach: () => {
    useAccountBalance.mockReturnValue('0.00000001');
    useNftCatalogCollections.mockReturnValue([
      {
        count: 12,
        collection: {
          name: 'Test Collection',
          id: 'test',
          contract_name: 'test',
          address: 'test',
          logo: 'test',
          description: 'test',
          banner: 'test',
          path: {
            storage_path: 'test',
            public_path: 'test',
            private_path: 'test',
          },
          nftTypeId: 'test',
          socials: {
            twitter: { url: 'test' },
            discord: { url: 'test' },
          },
        },
        ids: ['test'],
      },
    ]);
  },
  args: {
    network: 'mainnet',
    account: {
      ...mainWalletAccount,
    },
    showCard: true,
  },
};

export const LargeFlow: Story = {
  beforeEach: () => {
    useAccountBalance.mockReturnValue('1000000000000000000');
  },
  args: {
    network: 'mainnet',
    account: {
      ...mainWalletAccount,
    },
    showCard: true,
  },
};

export const Active: Story = {
  beforeEach: () => {
    useAccountBalance.mockReturnValue(mainWalletAccount.balance);
  },
  args: {
    network: 'mainnet',
    account: mainWalletAccount,
    active: true,
    showCard: true,
  },
};

export const EVM: Story = {
  beforeEach: () => {
    useAccountBalance.mockReturnValue(evmWalletAccount.balance);
  },
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    showCard: true,
  },
};

export const EVMNoCard: Story = {
  beforeEach: () => {
    useAccountBalance.mockReturnValue(evmWalletAccount.balance);
  },
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    showCard: false,
  },
};

export const EVMActive: Story = {
  beforeEach: () => {
    useAccountBalance.mockReturnValue(evmWalletAccount.balance);
  },
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    active: true,
    showCard: true,
  },
};

export const EVMSpinning: Story = {
  beforeEach: () => {
    useAccountBalance.mockReturnValue(evmWalletAccount.balance);
  },
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    spinning: true,
    showCard: true,
  },
};
export const EVMLink: Story = {
  beforeEach: () => {
    useAccountBalance.mockReturnValue(evmWalletAccount.balance);
  },
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    showLink: true,
    showCard: true,
  },
};

export const EVMLinkNoCard: Story = {
  beforeEach: () => {
    useAccountBalance.mockReturnValue(evmWalletAccount.balance);
  },
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    showLink: true,
    showCard: false,
  },
};

export const Loading: Story = {
  beforeEach: () => {
    useAccountBalance.mockReturnValue(undefined);
  },
  args: {
    network: 'mainnet',
    active: true,
    showCard: true,
  },
};
