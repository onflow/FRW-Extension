import { type Meta, type StoryObj } from '@storybook/react-webpack5';

import { emojis } from '@/background/utils/emoji.json';
import { MAINNET_CHAIN_ID } from '@/shared/types/network-types';
import { type WalletAccount } from '@/shared/types/wallet-types';

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
  title: 'Components/AccountCard',

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
  args: {
    network: 'mainnet',
    account: mainWalletAccount,
    showCard: true,
  },
};
export const SmallFlow: Story = {
  args: {
    network: 'mainnet',
    account: {
      ...mainWalletAccount,
      balance: '0.00000001',
    },
    showCard: true,
  },
};

export const LargeFlow: Story = {
  args: {
    network: 'mainnet',
    account: {
      ...mainWalletAccount,
      balance: '1000000000000000000',
    },
    showCard: true,
  },
};

export const Active: Story = {
  args: {
    network: 'mainnet',
    account: mainWalletAccount,
    active: true,
    showCard: true,
  },
};

export const EVM: Story = {
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    showCard: true,
  },
};

export const EVMNoCard: Story = {
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    showCard: false,
  },
};

export const EVMActive: Story = {
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    active: true,
    showCard: true,
  },
};

export const EVMSpinning: Story = {
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    spinning: true,
    showCard: true,
  },
};
export const EVMLink: Story = {
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    showLink: true,
    showCard: true,
  },
};

export const EVMLinkNoCard: Story = {
  args: {
    network: 'mainnet',
    account: evmWalletAccount,
    parentAccount: mainWalletAccount,
    showLink: true,
    showCard: false,
  },
};

export const Loading: Story = {
  args: {
    network: 'mainnet',
    active: true,
    showCard: true,
  },
};
