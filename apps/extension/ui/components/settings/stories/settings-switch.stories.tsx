import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import SettingsSwitchCard from '@/ui/components/settings/settings-switch';

const meta: Meta<typeof SettingsSwitchCard> = {
  title: 'Components/Settings/SettingsSwitch',
  component: SettingsSwitchCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component: 'A switch component used in settings for toggling features on/off.',
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
    label: {
      control: 'text',
      description: 'Switch label text',
    },
    checked: {
      control: 'boolean',
      description: 'Whether the switch is checked',
    },
    onChange: {
      action: 'changed',
      description: 'Change handler function',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the switch is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SettingsSwitchCard>;

export const Default: Story = {
  args: {
    label: 'Enable Notifications',
    checked: false,
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Default settings switch in unchecked state.',
      },
    },
  },
};

export const Checked: Story = {
  args: {
    label: 'Enable Notifications',
    checked: true,
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings switch in checked state.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    label: 'Premium Feature',
    checked: false,
    onChange: () => {},
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled settings switch.',
      },
    },
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Premium Feature',
    checked: true,
    onChange: () => {},
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled settings switch in checked state.',
      },
    },
  },
};

export const LongText: Story = {
  args: {
    label: 'This is a very long text that should wrap properly in the settings switch component',
    checked: false,
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings switch with long text to test text wrapping.',
      },
    },
  },
};

export const MultipleSwitches: Story = {
  args: {
    label: 'Enable Notifications',
    checked: true,
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings switch in enabled state.',
      },
    },
  },
};
