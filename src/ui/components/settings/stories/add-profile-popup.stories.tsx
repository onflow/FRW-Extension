import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import { useWallet as useWalletMock } from '@/ui/hooks/use-wallet.mock';

import AddProfilePopup from '../add-profile-popup';

const mockUseWallet = {
  lockAdd: () => Promise.resolve(),
};

const meta: Meta<typeof AddProfilePopup> = {
  title: 'Components/Settings/AddProfilePopup',
  component: AddProfilePopup,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '400px',
          backgroundColor: '#1A1A1A',
          minHeight: '100vh',
          color: 'white',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AddProfilePopup>;

export const Default: Story = {
  render: () => {
    useWalletMock.mockReturnValue(mockUseWallet);
    return <AddProfilePopup isOpen={true} onClose={() => {}} />;
  },
};

export const Closed: Story = {
  render: () => {
    useWalletMock.mockReturnValue(mockUseWallet);
    return <AddProfilePopup isOpen={false} onClose={() => {}} />;
  },
};
