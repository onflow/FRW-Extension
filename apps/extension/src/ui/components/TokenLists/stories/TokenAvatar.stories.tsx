import { type Meta, type StoryObj } from '@storybook/react-webpack5';

import TokenAvatar from '@/ui/components/TokenLists/TokenAvatar';

import { flowToken, ducatToken } from './token-item-data';

const meta: Meta<typeof TokenAvatar> = {
  title: 'Components/TokenLists/TokenAvatar',
  component: TokenAvatar,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof TokenAvatar>;

export const Default: Story = {
  args: {
    symbol: flowToken.symbol,
    src: flowToken.logoURI,
  },
};
export const MediumSize: Story = {
  args: {
    symbol: flowToken.symbol,
    src: flowToken.logoURI,
    width: 24,
    height: 24,
  },
};
export const SmallSize: Story = {
  args: {
    symbol: flowToken.symbol,
    src: flowToken.logoURI,
    width: 18,
    height: 18,
  },
};

export const Loading: Story = {
  args: {
    symbol: undefined,
  },
};

export const NoLogo: Story = {
  args: {
    symbol: ducatToken.symbol,
    src: ducatToken.logoURI,
  },
};

export const NoLogoMediumSize: Story = {
  args: {
    symbol: ducatToken.symbol,
    src: ducatToken.logoURI,
    width: 24,
    height: 24,
  },
};

export const NoLogoSmallSize: Story = {
  args: {
    symbol: ducatToken.symbol,
    src: ducatToken.logoURI,
    width: 18,
    height: 18,
  },
};
