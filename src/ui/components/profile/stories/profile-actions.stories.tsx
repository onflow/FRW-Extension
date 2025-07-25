import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import { consoleLog } from '@onflow/frw-shared/utils';

import ProfileActions from '../profile-actions';

const meta: Meta<typeof ProfileActions> = {
  title: 'Components/profile/ProfileActions',
  component: ProfileActions,
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
    onActionComplete: { action: 'action-complete' },
    showImportButton: {
      control: 'boolean',
      description: 'Whether to show the import profile button',
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProfileActions>;

export const Default: Story = {
  args: {
    showImportButton: true,
    onActionComplete: () => consoleLog('Profile action completed'),
  },
};
