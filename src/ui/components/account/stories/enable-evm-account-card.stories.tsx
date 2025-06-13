import { type Meta, type StoryObj } from '@storybook/react-webpack5';

import emojisJson from '@/background/utils/emoji.json';
const { emojis } = emojisJson;
import { MAINNET_CHAIN_ID } from '@/shared/types/network-types';
import { type WalletAccount } from '@/shared/types/wallet-types';

import { EnableEvmAccountCard } from '../enable-evm-account-card';

const meta: Meta<typeof EnableEvmAccountCard> = {
  title: 'Components/account/EnableEvmAccountCard',
  tags: ['autodocs'],

  component: EnableEvmAccountCard,
};

export default meta;

type Story = StoryObj<typeof EnableEvmAccountCard>;

export const Default: Story = {
  args: {},
};
