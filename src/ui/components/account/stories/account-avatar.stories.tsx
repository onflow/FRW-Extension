import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import { emojis } from '@/background/utils/emoji.json';
import AccountAvatar from '@/ui/components/account/account-avatar';

const meta: Meta<typeof AccountAvatar> = {
  title: 'Components/AccountAvatar',
  tags: ['autodocs'],

  component: AccountAvatar,
  argTypes: {
    network: {
      control: 'select',
      options: ['mainnet', 'testnet', null],
    },
    emoji: {
      control: 'text',
    },
    color: {
      control: 'color',
    },
    parentEmoji: {
      control: 'text',
    },
    parentColor: {
      control: 'color',
    },
    active: {
      control: 'boolean',
    },
    spinning: {
      control: 'boolean',
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;

type Story = StoryObj<typeof AccountAvatar>;

export const Default: Story = {
  args: {
    network: 'mainnet',
    emoji: emojis[2].emoji,
    color: emojis[2].bgcolor,
    active: false,
    spinning: false,
  },
};

export const Active: Story = {
  args: {
    network: 'mainnet',
    emoji: emojis[2].emoji,
    color: emojis[2].bgcolor,
    active: true,
    spinning: false,
  },
};

export const Spinning: Story = {
  args: {
    network: 'mainnet',
    emoji: emojis[2].emoji,
    color: emojis[2].bgcolor,
    active: false,
    spinning: true,
  },
};

export const Testnet: Story = {
  args: {
    network: 'testnet',
    emoji: emojis[2].emoji,
    color: emojis[2].bgcolor,
    active: true,
    spinning: false,
  },
};

export const ChildAccount: Story = {
  args: {
    network: 'mainnet',
    emoji: emojis[2].emoji,
    color: emojis[2].bgcolor,
    parentEmoji: emojis[0].emoji,
    parentColor: emojis[0].bgcolor,
    active: false,
    spinning: false,
  },
};

export const ChildAccountActive: Story = {
  args: {
    network: 'mainnet',
    emoji: emojis[2].emoji,
    color: emojis[2].bgcolor,
    parentEmoji: emojis[0].emoji,
    parentColor: emojis[0].bgcolor,
    active: true,
    spinning: false,
  },
};

export const CustomColor: Story = {
  args: {
    network: 'mainnet',
    emoji: emojis[3].emoji,
    color: emojis[3].bgcolor,
    active: false,
    spinning: false,
  },
};

export const Loading: Story = {
  args: {},
};
