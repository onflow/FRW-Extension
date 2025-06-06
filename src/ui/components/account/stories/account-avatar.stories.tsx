import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import emojisJson from '@/background/utils/emoji.json';
const { emojis } = emojisJson;
import AccountAvatar from '@/ui/components/account/account-avatar';

const meta: Meta<typeof AccountAvatar> = {
  title: 'Components/AccountAvatar',
  tags: ['autodocs'],
  component: AccountAvatar,
  argTypes: {
    network: {
      control: 'select',
      options: ['mainnet', 'testnet', null],
      description: 'Network type that affects styling and colors',
    },
    emoji: {
      control: 'text',
      description: 'Emoji or image URL for the account avatar',
    },
    color: {
      control: 'color',
      description: 'Background color for the avatar',
    },
    parentEmoji: {
      control: 'text',
      description: 'Parent account emoji (for child accounts)',
    },
    parentColor: {
      control: 'color',
      description: 'Parent account background color',
    },
    active: {
      control: 'boolean',
      description: 'Shows active state with colored border',
    },
    spinning: {
      control: 'boolean',
      description: 'Shows loading spinner around avatar',
    },
    isPending: {
      control: 'boolean',
      description: 'Shows pending account state with Flow icon',
    },
    onClick: { action: 'avatar clicked' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'AccountAvatar displays account avatars with support for main accounts, child accounts, pending states, and loading indicators.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AccountAvatar>;

// Basic States
export const Default: Story = {
  name: 'Default State',
  args: {
    network: 'mainnet',
    emoji: emojis[2].emoji,
    color: emojis[2].bgcolor,
    active: false,
    spinning: false,
  },
};

export const Active: Story = {
  name: 'Active Account',
  args: {
    network: 'mainnet',
    emoji: emojis[2].emoji,
    color: emojis[2].bgcolor,
    active: true,
    spinning: false,
  },
};

export const Loading: Story = {
  name: 'Loading State',
  args: {
    // No props - shows skeleton loader
  },
};

export const Spinning: Story = {
  name: 'Processing Transaction',
  args: {
    network: 'mainnet',
    emoji: emojis[2].emoji,
    color: emojis[2].bgcolor,
    active: false,
    spinning: true,
  },
};

// Network Variations
export const MainnetActive: Story = {
  name: 'Mainnet Active',
  args: {
    network: 'mainnet',
    emoji: emojis[1].emoji,
    color: emojis[1].bgcolor,
    active: true,
    spinning: false,
  },
};

export const TestnetActive: Story = {
  name: 'Testnet Active',
  args: {
    network: 'testnet',
    emoji: emojis[3].emoji,
    color: emojis[3].bgcolor,
    active: true,
    spinning: false,
  },
};

// Child Account Variations
export const ChildAccount: Story = {
  name: 'Child Account',
  args: {
    network: 'mainnet',
    emoji: emojis[4].emoji,
    color: emojis[4].bgcolor,
    parentEmoji: emojis[0].emoji,
    parentColor: emojis[0].bgcolor,
    active: false,
    spinning: false,
  },
};

export const ChildAccountActive: Story = {
  name: 'Child Account Active',
  args: {
    network: 'mainnet',
    emoji: emojis[5].emoji,
    color: emojis[5].bgcolor,
    parentEmoji: emojis[1].emoji,
    parentColor: emojis[1].bgcolor,
    active: true,
    spinning: false,
  },
};

export const ChildAccountSpinning: Story = {
  name: 'Child Account Processing',
  args: {
    network: 'mainnet',
    emoji: emojis[6].emoji,
    color: emojis[6].bgcolor,
    parentEmoji: emojis[2].emoji,
    parentColor: emojis[2].bgcolor,
    active: false,
    spinning: true,
  },
};

// Pending Account States
export const PendingAccount: Story = {
  name: 'Pending Account Creation',
  args: {
    network: 'mainnet',
    emoji: 'pendingAccount',
    color: '#BABABA',
    active: false,
    spinning: true,
    isPending: true,
  },
};

export const PendingAccountActive: Story = {
  name: 'Pending Account Active',
  args: {
    network: 'mainnet',
    emoji: 'pendingAccount',
    color: '#BABABA',
    active: true,
    spinning: true,
    isPending: true,
  },
};

// External Account (with image URL)
export const ExternalAccount: Story = {
  name: 'External Account (Dapper)',
  args: {
    network: 'mainnet',
    emoji: 'https://accounts.meetdapper.com/static/img/dapper/dapper.png',
    color: emojis[7].bgcolor,
    active: false,
    spinning: false,
  },
};

export const ExternalAccountActive: Story = {
  name: 'External Account Active',
  args: {
    network: 'mainnet',
    emoji: 'https://accounts.meetdapper.com/static/img/dapper/dapper.png',
    color: emojis[7].bgcolor,
    active: true,
    spinning: false,
  },
};

// Color Variations
export const ColorVariations: Story = {
  name: 'Different Colors',
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '16px' }}>
      {emojis.slice(0, 8).map((emoji, index) => (
        <AccountAvatar
          key={index}
          network="mainnet"
          emoji={emoji.emoji}
          color={emoji.bgcolor}
          active={index % 3 === 0}
          spinning={index % 4 === 0}
        />
      ))}
    </div>
  ),
};

// Interactive Demo
export const InteractiveDemo: Story = {
  name: 'Interactive Demo',
  args: {
    network: 'mainnet',
    emoji: emojis[2].emoji,
    color: emojis[2].bgcolor,
    active: true,
    spinning: false,
    onClick: () => {},
  },
};

// Account Hierarchy Demo
export const AccountHierarchy: Story = {
  name: 'Account Hierarchy',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#fff', fontSize: '14px', minWidth: '120px' }}>Main Account:</span>
        <AccountAvatar
          network="mainnet"
          emoji={emojis[0].emoji}
          color={emojis[0].bgcolor}
          active={true}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#fff', fontSize: '14px', minWidth: '120px' }}>EVM Account:</span>
        <AccountAvatar
          network="mainnet"
          emoji={emojis[1].emoji}
          color={emojis[1].bgcolor}
          parentEmoji={emojis[0].emoji}
          parentColor={emojis[0].bgcolor}
          active={false}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#fff', fontSize: '14px', minWidth: '120px' }}>Child Account:</span>
        <AccountAvatar
          network="mainnet"
          emoji="https://accounts.meetdapper.com/static/img/dapper/dapper.png"
          color={emojis[2].bgcolor}
          parentEmoji={emojis[0].emoji}
          parentColor={emojis[0].bgcolor}
          active={false}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#fff', fontSize: '14px', minWidth: '120px' }}>Pending:</span>
        <AccountAvatar
          network="mainnet"
          emoji="pendingAccount"
          color="#BABABA"
          active={false}
          spinning={true}
          isPending={true}
        />
      </div>
    </div>
  ),
};

// Edge Cases
export const EdgeCases: Story = {
  name: 'Edge Cases',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#fff', fontSize: '14px', minWidth: '120px' }}>No Network:</span>
        <AccountAvatar emoji={emojis[0].emoji} color={emojis[0].bgcolor} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#fff', fontSize: '14px', minWidth: '120px' }}>Missing Props:</span>
        <AccountAvatar />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#fff', fontSize: '14px', minWidth: '120px' }}>Custom Color:</span>
        <AccountAvatar network="mainnet" emoji="🚀" color="#FF6B9D" active={true} />
      </div>
    </div>
  ),
};
