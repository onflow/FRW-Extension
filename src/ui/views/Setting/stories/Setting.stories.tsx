import AndroidIcon from '@mui/icons-material/Android';
import AppleIcon from '@mui/icons-material/Apple';
import { ThemeProvider } from '@mui/material/styles';
import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import { consoleLog } from '@/shared/utils/console-log';
import { AboutIcon } from '@/ui/assets/icons/settings/About';
import { AccountListIcon } from '@/ui/assets/icons/settings/AccountList';
import { AddProfileIcon } from '@/ui/assets/icons/settings/AddProfile';
import { AddressIcon } from '@/ui/assets/icons/settings/Address';
import { BackupIcon } from '@/ui/assets/icons/settings/Backup';
import { CurrencyIcon } from '@/ui/assets/icons/settings/Currency';
import { DevmodeIcon } from '@/ui/assets/icons/settings/Devmode';
import { EditIcon } from '@/ui/assets/icons/settings/Edit';
import { MobileIcon } from '@/ui/assets/icons/settings/Mobile';
import { SecurityIcon } from '@/ui/assets/icons/settings/Security';

// Create a simplified Setting component for Storybook
const SettingTabStory: React.FC<{
  hasProfile?: boolean;
  hasMultipleProfiles?: boolean;
  hasKeyphrase?: boolean;
  isChildAccount?: boolean;
}> = ({
  hasProfile = false,
  hasMultipleProfiles = false,
  hasKeyphrase = false,
  isChildAccount = false,
}) => {
  const mockUserInfo = {
    nickname: 'Test User',
    avatar: 'https://lilico.app/api/avatar/beam/120/avatar',
  };

  return (
    <div
      style={{
        background: '#1A1A1A',
        minHeight: '100vh',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Simple header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => consoleLog('Back button clicked')}
          style={{
            background: 'none',
            border: 'none',
            color: '#59A1DB',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ← Back
        </button>
        <h1
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#FFFFFF',
          }}
        >
          Settings
        </h1>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* Profile section */}
      {hasProfile && (
        <div
          style={{
            margin: '8px auto 16px auto',
            padding: '16px',
            backgroundColor: '#282828',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            maxWidth: '90%',
          }}
        >
          <img
            src={mockUserInfo.avatar}
            alt={mockUserInfo.nickname}
            style={{ width: '40px', height: '40px', borderRadius: '8px' }}
          />
          <span
            style={{
              color: '#FFFFFF',
              marginLeft: '16px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {mockUserInfo.nickname}
          </span>
          <button
            onClick={() => consoleLog('Edit profile clicked')}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#59A1DB',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EditIcon width={24} height={24} />
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div
        style={{
          backgroundColor: '#282828',
          borderRadius: '16px',
          margin: '8px auto 16px auto',
          padding: '16px',
          maxWidth: '90%',
        }}
      >
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => consoleLog('Address Book clicked')}
            style={{
              flex: 1,
              padding: '16px',
              backgroundColor: '#333',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AddressIcon width={28} height={28} />
            </div>
            Address Book
          </button>
          <button
            onClick={() => consoleLog('Account List clicked')}
            style={{
              flex: 1,
              padding: '16px',
              backgroundColor: '#333',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AccountListIcon width={28} height={28} />
            </div>
            Account List
          </button>
        </div>
      </div>

      {/* Settings list */}
      <div
        style={{
          backgroundColor: '#282828',
          borderRadius: '16px',
          margin: '8px auto 16px auto',
          padding: '16px',
          maxWidth: '90%',
        }}
      >
        <button
          onClick={() => consoleLog('Display Currency clicked')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CurrencyIcon width={24} height={24} />
            <span>Display Currency</span>
          </div>
          <span>→</span>
        </button>

        {!isChildAccount && <hr style={{ border: '1px solid #333', margin: '8px 0' }} />}

        {hasKeyphrase && (
          <>
            <button
              onClick={() => consoleLog('Backup clicked')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BackupIcon width={24} height={24} />
                <span>Backup</span>
              </div>
              <span>→</span>
            </button>
            <hr style={{ border: '1px solid #333', margin: '8px 0' }} />
          </>
        )}

        <button
          onClick={() => consoleLog('Security clicked')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SecurityIcon width={24} height={24} />
            <span>Security</span>
          </div>
          <span>→</span>
        </button>
      </div>

      {/* Additional options */}
      <div
        style={{
          backgroundColor: '#282828',
          borderRadius: '16px',
          margin: '8px auto 16px auto',
          padding: '16px',
          maxWidth: '90%',
        }}
      >
        <button
          onClick={() => consoleLog('Mobile App clicked')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MobileIcon width={24} height={24} />
            <span>Try Our Mobile APP</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span
              onClick={(e) => {
                e.stopPropagation();
                consoleLog('iOS App Store clicked');
              }}
            >
              <AppleIcon />
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                consoleLog('Google Play clicked');
              }}
            >
              <AndroidIcon />
            </span>
          </div>
        </button>

        <hr style={{ border: '1px solid #333', margin: '8px 0' }} />

        <button
          onClick={() => consoleLog('Developer Mode clicked')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DevmodeIcon width={24} height={24} />
            <span>Developer Mode</span>
          </div>
          <span>→</span>
        </button>

        <hr style={{ border: '1px solid #333', margin: '8px 0' }} />

        <button
          onClick={() => consoleLog('About clicked')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AboutIcon width={24} height={24} />
            <span>About</span>
          </div>
          <span>→</span>
        </button>
      </div>

      {/* Add Profile */}
      <div
        style={{
          backgroundColor: '#282828',
          borderRadius: '16px',
          margin: '8px auto 16px auto',
          padding: '16px',
          maxWidth: '90%',
        }}
      >
        <button
          onClick={() => consoleLog('Add Profile clicked')}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AddProfileIcon width={24} height={24} />
            <span>Add Profile</span>
          </div>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

const meta: Meta<typeof SettingTabStory> = {
  title: 'Views/Setting/SettingTab',
  component: SettingTabStory,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component:
          'The main settings page for the Flow Wallet extension. Displays user profile, navigation to various settings sections, and app store links.',
      },
    },
  },
  argTypes: {
    hasProfile: {
      control: 'boolean',
      description: 'Show user profile section',
    },
    hasMultipleProfiles: {
      control: 'boolean',
      description: 'Enable profile switching',
    },
    hasKeyphrase: {
      control: 'boolean',
      description: 'Show backup option',
    },
    isChildAccount: {
      control: 'boolean',
      description: 'Hide certain options for child accounts',
    },
  },
};

export default meta;

type Story = StoryObj<typeof SettingTabStory>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default settings page with no profile and no keyphrase backup.',
      },
    },
  },
};

export const WithProfile: Story = {
  args: {
    hasProfile: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings page with a user profile displayed at the top.',
      },
    },
  },
};

export const WithMultipleProfiles: Story = {
  args: {
    hasProfile: true,
    hasMultipleProfiles: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings page with multiple profiles available.',
      },
    },
  },
};

export const WithKeyphraseBackup: Story = {
  args: {
    hasProfile: true,
    hasKeyphrase: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings page with keyphrase backup option available.',
      },
    },
  },
};

export const ChildAccount: Story = {
  args: {
    hasProfile: true,
    hasKeyphrase: true,
    isChildAccount: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Settings page when a child account is active (hides some options).',
      },
    },
  },
};

export const CompleteSetup: Story = {
  args: {
    hasProfile: true,
    hasMultipleProfiles: true,
    hasKeyphrase: true,
    isChildAccount: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Settings page with all features enabled: multiple profiles, keyphrase backup, and child account.',
      },
    },
  },
};
