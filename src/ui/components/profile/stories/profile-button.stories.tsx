import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import { consoleLog } from '@onflow/frw-shared/utils';

import userCircleCheck from '@/ui/assets/svg/user-circle-check.svg';
import userCirclePlus from '@/ui/assets/svg/user-circle-plus.svg';

import { ProfileButton } from '../profile-button';

const meta: Meta<typeof ProfileButton> = {
  title: 'Components/profile/ProfileButton',
  component: ProfileButton,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ background: '#1A1A1A', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    icon: {
      control: 'select',
      options: [userCircleCheck, userCirclePlus],
    },
    text: {
      control: 'text',
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileButton>;

export const CreateProfile: Story = {
  args: {
    icon: userCirclePlus,
    text: 'Create a new profile',
    onClick: async () => consoleLog('Create profile clicked'),
  },
};

export const ImportProfile: Story = {
  args: {
    icon: userCircleCheck,
    text: 'Import an existing profile',
    onClick: async () => consoleLog('Import profile clicked'),
  },
};
