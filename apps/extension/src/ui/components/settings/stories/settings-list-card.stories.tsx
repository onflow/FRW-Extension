import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import SettingsListCard from '@/ui/components/settings/settings-list-card';

const meta: Meta<typeof SettingsListCard> = {
  title: 'Components/Settings/SettingsListCard',
  component: SettingsListCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component:
          'A card component for displaying a list of settings items with icons and descriptions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '400px',
          backgroundColor: '#181818',
          borderRadius: '16px',
          padding: '16px',
          color: 'white',
        }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of settings items to display',
    },
    showDivider: {
      control: 'boolean',
      description: 'Whether to show dividers between items',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SettingsListCard>;

export const Default: Story = {
  args: {
    items: [
      {
        iconColor: '#1A5CFF',
        iconText: 'A',
        title: 'NBA-Top-Shot',
        subtitle: '29 Collectible',
      },
      {
        iconColor: '#8e24aa',
        iconText: 'B',
        title: 'Flovatar Collection',
        subtitle: '12 Collectible',
      },
      {
        iconColor: '#333',
        iconText: 'C',
        title: 'DGD shop',
      },
    ],
    showDivider: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default settings list card with multiple items and dividers.',
      },
    },
  },
};

export const WithoutDividers: Story = {
  args: {
    items: [
      {
        iconColor: '#1A5CFF',
        iconText: 'A',
        title: 'NBA-Top-Shot',
        subtitle: '29 Collectible',
      },
      {
        iconColor: '#8e24aa',
        iconText: 'B',
        title: 'Flovatar Collection',
        subtitle: '12 Collectible',
      },
      {
        iconColor: '#333',
        iconText: 'C',
        title: 'DGD shop',
      },
    ],
    showDivider: false,
  },
};

export const WithImages: Story = {
  args: {
    items: [
      {
        iconColor: '#1A5CFF',
        iconUrl: 'https://via.placeholder.com/36x36/1A5CFF/FFFFFF?text=A',
        title: 'NBA-Top-Shot',
        subtitle: '29 Collectible',
      },
      {
        iconColor: '#8e24aa',
        iconUrl: 'https://via.placeholder.com/36x36/8e24aa/FFFFFF?text=B',
        title: 'Flovatar Collection',
        subtitle: '12 Collectible',
      },
      {
        iconColor: '#333',
        iconUrl: 'https://via.placeholder.com/36x36/333333/FFFFFF?text=C',
        title: 'DGD shop',
      },
    ],
    showDivider: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings list card with image icons instead of text.',
      },
    },
  },
};

export const LongText: Story = {
  args: {
    items: [
      {
        iconColor: '#1A5CFF',
        iconText: 'A',
        title: 'This is a very long title that should wrap properly in the settings list card',
        subtitle: 'This is a very long subtitle that should also wrap properly',
      },
      {
        iconColor: '#8e24aa',
        iconText: 'B',
        title: 'Another Long Title',
        subtitle: 'Another long subtitle for testing text wrapping',
      },
    ],
    showDivider: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings list card with long text to test text wrapping.',
      },
    },
  },
};

export const SingleItem: Story = {
  args: {
    items: [
      {
        iconColor: '#1A5CFF',
        iconText: 'A',
        title: 'Single Item',
        subtitle: 'Only one item in the list',
      },
    ],
    showDivider: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings list card with only one item.',
      },
    },
  },
};

export const WithClickHandlers: Story = {
  args: {
    items: [
      {
        iconColor: '#1A5CFF',
        iconText: 'A',
        title: 'Clickable Item 1',
        subtitle: 'Click me!',
        onClick: () => alert('Item 1 clicked!'),
      },
      {
        iconColor: '#8e24aa',
        iconText: 'B',
        title: 'Clickable Item 2',
        subtitle: 'Click me too!',
        onClick: () => alert('Item 2 clicked!'),
      },
      {
        iconColor: '#333',
        iconText: 'C',
        title: 'Non-clickable Item',
        subtitle: 'No click handler',
      },
    ],
    showDivider: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings list card with some items having click handlers.',
      },
    },
  },
};
