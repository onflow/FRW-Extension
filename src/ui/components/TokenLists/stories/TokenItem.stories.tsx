import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';

import { type TokenFilter } from '@onflow/frw-shared/types';

import TokenItem from '@/ui/components/TokenLists/TokenItem';

import { flowToken, usdcToken, ducatToken } from './token-item-data';

const meta: Meta<typeof TokenItem> = {
  title: 'Components/TokenLists/TokenItem',
  tags: ['autodocs'],
  component: TokenItem,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    token: flowToken,
  },
};

export const USDC: Story = {
  args: {
    token: usdcToken,
  },
};

export const DUCATNoLogo: Story = {
  args: {
    token: ducatToken,
  },
};

export const Enabled: Story = {
  args: {
    token: flowToken,
    enabled: true,
  },
};

export const Loading: Story = {
  args: {
    token: flowToken,
    enabled: true,
    isLoading: true,
  },
};

export const ShowSwitch: Story = {
  args: {
    token: flowToken,
    isLoading: false,
    showSwitch: true,
    updateTokenFilter: () => {},
  },
  decorators: [
    (Story, context) => {
      const [tokenFilter, setTokenFilter] = useState<TokenFilter>({
        filteredIds: [],
        hideDust: false,
        hideUnverified: false,
      });

      const args = context.args;

      return <TokenItem {...args} tokenFilter={tokenFilter} updateTokenFilter={setTokenFilter} />;
    },
  ],
};
