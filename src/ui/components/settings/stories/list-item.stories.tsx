import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import { AboutIcon } from '@/ui/assets/icons/settings/About';
import { CurrencyIcon } from '@/ui/assets/icons/settings/Currency';
import { SecurityIcon } from '@/ui/assets/icons/settings/Security';
import IconEnd from '@/ui/components/iconfont/IconAVector11Stroke';

// Mock SettingsListItem component for Storybook
const SettingsListItemMock: React.FC<{
  to: string;
  icon: React.ReactNode;
  text: string;
  endIcon?: React.ReactNode;
  onClick?: () => void;
}> = ({ icon, text, endIcon, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: '16px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      color: '#FFFFFF',
      fontFamily: 'Inter',
      fontSize: '14px',
      fontWeight: 600,
      lineHeight: '120%',
      letterSpacing: '-0.084px',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        minWidth: '25px',
        marginRight: '14px',
        color: '#59A1DB',
      }}
    >
      {icon}
    </div>
    <div
      style={{
        flex: 1,
      }}
    >
      {text}
    </div>
    {endIcon && (
      <div
        style={{
          minWidth: '15px',
          marginLeft: '8px',
          color: '#59A1DB',
        }}
      >
        {endIcon}
      </div>
    )}
  </div>
);

const meta: Meta<typeof SettingsListItemMock> = {
  title: 'Components/Settings/ListItem',
  component: SettingsListItemMock,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component:
          'A list item component used in the settings page with icon, text, and optional end icon.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '400px',
          backgroundColor: '#282828',
          borderRadius: '16px',
          padding: '8px',
          color: 'white',
        }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    to: {
      control: 'text',
      description: 'Navigation path',
    },
    icon: {
      control: false,
      description: 'Icon component to display',
    },
    text: {
      control: 'text',
      description: 'Text label for the list item',
    },
    endIcon: {
      control: false,
      description: 'Optional end icon component',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler function',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SettingsListItemMock>;

export const Default: Story = {
  args: {
    to: '/dashboard/setting/currency',
    icon: <CurrencyIcon width={24} height={24} />,
    text: 'Display Currency',
    endIcon: <IconEnd size={12} />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default list item with icon, text, and end icon.',
      },
    },
  },
};

export const WithoutEndIcon: Story = {
  args: {
    to: '/dashboard/setting/security',
    icon: <SecurityIcon width={24} height={24} />,
    text: 'Security',
  },
  parameters: {
    docs: {
      description: {
        story: 'List item without an end icon.',
      },
    },
  },
};

export const WithLongText: Story = {
  args: {
    to: '/dashboard/setting/about',
    icon: <AboutIcon width={24} height={24} />,
    text: 'This is a very long text that should wrap properly in the list item',
    endIcon: <IconEnd size={12} />,
  },
  parameters: {
    docs: {
      description: {
        story: 'List item with long text to test text wrapping.',
      },
    },
  },
};

export const WithClickHandler: Story = {
  args: {
    to: '#',
    icon: <CurrencyIcon width={24} height={24} />,
    text: 'Click Me',
    endIcon: <IconEnd size={12} />,
    onClick: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive list item with click handler.',
      },
    },
  },
};

export const MultipleItems: Story = {
  render: () => (
    <div>
      <SettingsListItemMock
        to="/dashboard/setting/currency"
        icon={<CurrencyIcon width={24} height={24} />}
        text="Display Currency"
        endIcon={<IconEnd size={12} />}
      />
      <SettingsListItemMock
        to="/dashboard/setting/security"
        icon={<SecurityIcon width={24} height={24} />}
        text="Security"
        endIcon={<IconEnd size={12} />}
      />
      <SettingsListItemMock
        to="/dashboard/setting/about"
        icon={<AboutIcon width={24} height={24} />}
        text="About"
        endIcon={<IconEnd size={12} />}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple list items to show how they look together.',
      },
    },
  },
};
