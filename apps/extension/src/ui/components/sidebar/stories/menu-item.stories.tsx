import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

// Import some example icons
import { consoleLog } from '@onflow/flow-wallet-shared/utils/console-log';

import lock from '@/ui/assets/svg/sidebar-lock.svg';
import plus from '@/ui/assets/svg/sidebar-plus.svg';
import userCircleGear from '@/ui/assets/svg/user-circle-gear.svg';

import { MenuItem } from '../menu-item';

const meta: Meta<typeof MenuItem> = {
  title: 'Components/sidebar/MenuItem',
  component: MenuItem,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ background: '#0A0A0B', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    icon: {
      control: 'select',
      options: [userCircleGear, lock, plus],
    },
    text: {
      control: 'text',
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;

type Story = StoryObj<typeof MenuItem>;

export const Settings: Story = {
  args: {
    icon: userCircleGear,
    text: 'Settings',
    onClick: () => consoleLog('Settings clicked'),
  },
};

export const Lock: Story = {
  args: {
    icon: lock,
    text: 'Lock Wallet',
    onClick: () => consoleLog('Lock clicked'),
  },
};

export const AddAccount: Story = {
  args: {
    icon: plus,
    text: 'Add Account',
    onClick: () => consoleLog('Add clicked'),
  },
};
