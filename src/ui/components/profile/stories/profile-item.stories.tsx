import { ThemeProvider } from '@mui/material/styles';
import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import * as vi from 'vitest';

import { consoleLog } from '@/shared/utils/console-log';

import { ProfileItem } from '../profile-item';

const mockUserInfo = {
  nickname: 'Test User',
  avatar: 'https://placekitten.com/200/200',
  username: 'testuser',
  private: 0,
  created: new Date().toISOString(),
  id: '1',
};

const meta: Meta<typeof ProfileItem> = {
  title: 'Components/profile/ProfileItem',
  component: ProfileItem,
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
    switchAccount: { action: 'switched' },
    setLoadingId: { action: 'loadingSet' },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileItem>;

export const Selected: Story = {
  args: {
    profileId: '1',
    selectedProfileId: '1',
    switchAccount: async (id) => consoleLog('Switch to', id),
    setLoadingId: (id) => consoleLog('Set loading', id),
    userInfo: mockUserInfo,
  },
};

export const Unselected: Story = {
  args: {
    profileId: '2',
    selectedProfileId: '1',
    switchAccount: async (id) => consoleLog('Switch to', id),
    setLoadingId: (id) => consoleLog('Set loading', id),
    userInfo: mockUserInfo,
  },
};
