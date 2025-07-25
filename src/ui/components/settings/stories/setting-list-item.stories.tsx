import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { BrowserRouter } from 'react-router';

import { CurrencyIcon } from '@/ui/assets/icons/settings/Currency';
import IconEnd from '@/ui/components/iconfont/IconAVector11Stroke';

import SettingsListItem from '../setting-list-item';

const meta: Meta<typeof SettingsListItem> = {
  title: 'Components/settings/SettingsListItem',
  component: SettingsListItem,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div style={{ background: '#1A1A1A', padding: '1rem', color: 'white', maxWidth: 400 }}>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SettingsListItem>;

export const WithIcon: Story = {
  args: {
    icon: <CurrencyIcon width={24} height={24} />,
    text: 'Display Currency',
    endIcon: <IconEnd size={12} />,
    onClick: () => alert('Clicked!'),
  },
};

export const NoIcon: Story = {
  args: {
    text: 'Display Currency',
    endIcon: <IconEnd size={12} />,
    onClick: () => alert('Clicked!'),
  },
};
