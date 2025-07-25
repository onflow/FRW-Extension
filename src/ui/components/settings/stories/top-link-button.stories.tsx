import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { BrowserRouter } from 'react-router';

import { AccountListIcon } from '@/ui/assets/icons/settings/AccountList';
import { AddressIcon } from '@/ui/assets/icons/settings/Address';
import TopLinkButton from '@/ui/components/settings/top-link-button';

const meta: Meta<typeof TopLinkButton> = {
  title: 'Components/Settings/TopLinkButton',
  component: TopLinkButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component:
          'A top-level navigation button used in settings for Address and Account List navigation.',
      },
    },
  },
  decorators: [
    (Story) => {
      return (
        <BrowserRouter>
          <div
            style={{
              width: '400px',
              backgroundColor: '#282828',
              borderRadius: '16px',
              padding: '8px',
              color: 'white',
            }}
          >
            <style>
              {`
                /* Hover state for TopLinkButton */
                .MuiListItemButton-root:hover {
                  background-color: rgba(255, 255, 255, 0.08) !important;
                  transition: background-color 0.2s ease;
                }
              `}
            </style>
            <Story />
          </div>
        </BrowserRouter>
      );
    },
  ],
  argTypes: {
    icon: {
      control: false,
      description: 'Icon component to display',
    },
    text: {
      control: 'text',
      description: 'Text label for the button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TopLinkButton>;

export const Address: Story = {
  args: {
    icon: <AddressIcon width={28} height={28} />,
    text: 'Address',
  },
  parameters: {
    docs: {
      description: {
        story: 'Address navigation button with address book icon. Hover to see interactive state.',
      },
    },
  },
};

export const AccountList: Story = {
  args: {
    icon: <AccountListIcon width={28} height={28} />,
    text: 'Account List',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Account List navigation button with account list icon. Hover to see interactive state.',
      },
    },
  },
};

export const BothButtons: Story = {
  args: {
    icon: <AddressIcon width={28} height={28} />,
    text: 'Address',
  },
  parameters: {
    docs: {
      description: {
        story: 'Address navigation button with address book icon.',
      },
    },
  },
};

export const HoverStates: Story = {
  args: {
    icon: <AccountListIcon width={28} height={28} />,
    text: 'Account List',
  },
  parameters: {
    docs: {
      description: {
        story: 'Account List navigation button with account list icon.',
      },
    },
  },
};
