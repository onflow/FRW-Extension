import { type Meta, type StoryObj } from '@storybook/react-webpack5';

import { emojis } from '@/background/utils/emoji.json';
import { MAINNET_CHAIN_ID } from '@/shared/types/network-types';
import { type WalletAccount } from '@/shared/types/wallet-types';

import { AccountListing } from '../account-listing';
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
const mainWalletAccount2: WalletAccount = {
  name: emojis[3].name,
  icon: emojis[3].emoji,
  color: emojis[3].bgcolor,
  address: '0x0c555c888d8fb259',
  chain: MAINNET_CHAIN_ID,
  id: 1,
  balance: '0.77005012',
  nfts: 4,
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
const evmWalletAccount2: WalletAccount = {
  name: emojis[7].name,
  icon: emojis[7].emoji,
  color: emojis[7].bgcolor,
  address: '0x00000000000000000000000279356d1221d883F6', // Flow COA EVM address
  chain: MAINNET_CHAIN_ID,
  id: 1,
  balance: '201.66005012',
  nfts: 0,
};

const childWallet1: WalletAccount = {
  name: 'Dapper Wallet ',
  icon: 'https://accounts.meetdapper.com/static/img/dapper/dapper.png',
  color: emojis[6].bgcolor,
  address: '0x863ac53e3aa7b411', // Flow COA EVM address
  chain: MAINNET_CHAIN_ID,
  id: 1,
  balance: '550.66005012',
  nfts: 12,
};

const childWallet2: WalletAccount = {
  name: 'Dapper Wallet 2',
  icon: 'https://accounts.meetdapper.com/static/img/dapper/dapper.png',
  color: emojis[6].bgcolor,
  address: '0x863ac53e33a7b411', // Flow COA EVM address
  chain: MAINNET_CHAIN_ID,
  id: 1,
  balance: '550.66005012',
  nfts: 12,
};

const meta: Meta<typeof AccountListing> = {
  title: 'Components/AccountListing',

  component: AccountListing,
  argTypes: {
    accounts: {
      control: 'object',
      options: [
        mainWalletAccount,
        mainWalletAccount2,
        evmWalletAccount,
        childWallet1,
        childWallet2,
      ],
    },
    activeAddress: {
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<typeof AccountListing>;

export const Default: Story = {
  args: {
    network: 'mainnet',
    accounts: [
      {
        account: mainWalletAccount,
        linkedAccounts: [evmWalletAccount, childWallet1, childWallet2],
      },
      {
        account: mainWalletAccount2,
        linkedAccounts: [evmWalletAccount2],
      },
    ],
  },
};
export const SmallFlow: Story = {
  args: {
    network: 'mainnet',
    accounts: [
      {
        account: mainWalletAccount,
        linkedAccounts: [childWallet1, childWallet2],
      },
    ],
  },
};

export const LargeFlow: Story = {
  args: {
    network: 'mainnet',
    accounts: [
      {
        account: mainWalletAccount,
        linkedAccounts: [evmWalletAccount, childWallet1, childWallet2],
      },
      {
        account: mainWalletAccount2,
        linkedAccounts: [evmWalletAccount2],
      },
    ],
  },
};

export const Active: Story = {
  args: {
    network: 'mainnet',
    accounts: [
      {
        account: mainWalletAccount,
        linkedAccounts: [childWallet1, childWallet2],
      },
    ],
    activeAddress: mainWalletAccount.address,
  },
};

export const EVMActive: Story = {
  args: {
    network: 'mainnet',
    accounts: [
      {
        account: mainWalletAccount,
        linkedAccounts: [evmWalletAccount, childWallet2],
      },
    ],
    activeAddress: evmWalletAccount.address,
  },
};

export const Loading: Story = {
  args: {
    network: 'mainnet',
    accounts: [
      {
        account: mainWalletAccount,
        linkedAccounts: [childWallet1, childWallet2],
      },
    ],
    activeAddress: mainWalletAccount.address,
  },
};
