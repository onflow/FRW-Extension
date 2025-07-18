import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import { consoleLog } from '@onflow/flow-wallet-shared/utils/console-log';

import { EditIcon } from '@/ui/assets/icons/settings/Edit';

import { ProfileItemBase } from '../profile-item-base';

const mockUserInfo = {
  nickname: 'Test User',
  avatar: 'https://placekitten.com/200/200',
  username: 'testuser',
  private: 0,
  created: new Date().toISOString(),
  id: '1',
};

const meta: Meta<typeof ProfileItemBase> = {
  title: 'Components/profile/ProfileItemBase',
  component: ProfileItemBase,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ background: '#1A1A1A', padding: '1rem', color: 'white' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    profileId: { control: 'text' },
    selectedProfileId: { control: 'text' },
    onClick: { action: 'switched' },
    setLoadingId: { action: 'loadingSet' },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileItemBase>;

export const Selected: Story = {
  args: {
    profileId: '1',
    selectedProfileId: '1',
    onClick: async (id) => consoleLog('Switch to', id),
    setLoadingId: (id) => consoleLog('Set loading', id),
    userInfo: mockUserInfo,
  },
};

export const Unselected: Story = {
  args: {
    profileId: '2',
    selectedProfileId: '1',
    onClick: async (id) => consoleLog('Switch to', id),
    setLoadingId: (id) => consoleLog('Set loading', id),
    userInfo: mockUserInfo,
  },
};

export const ActiveProfile: Story = {
  args: {
    profileId: '1',
    selectedProfileId: '1',
    onClick: async (id) => consoleLog('Switch to', id),
    setLoadingId: (id) => consoleLog('Set loading', id),
    userInfo: mockUserInfo,
    activeProfileVariant: true,
  },
};

export const WithEditIcon: Story = {
  args: {
    profileId: '1',
    selectedProfileId: '1',
    onClick: async (id) => consoleLog('Switch to', id),
    setLoadingId: (id) => consoleLog('Set loading', id),
    userInfo: mockUserInfo,
    rightIcon: <EditIcon width={24} height={24} />,
  },
};
