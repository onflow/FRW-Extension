import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { flowToken } from '@/ui/components/TokenLists/stories/token-item-data';
import TokenDropdownSelect from '@/ui/views/SendTo/Components/token-dropdown-select';

const meta: Meta<typeof TokenDropdownSelect> = {
  title: 'Components/TokenDropdownSelect',
  component: TokenDropdownSelect,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#121212',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    token: flowToken,
    onClick: () => {
      // Token dropdown clicked
    },
  },
};

export const UnverifiedToken: Story = {
  args: {
    token: {
      ...flowToken,
      isVerified: false,
      symbol: 'UNVERIFIED',
    },
    onClick: () => {
      // Unverified token dropdown clicked
    },
  },
};
