import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import AddAccountPopup from '../AddAccountPopup';

const meta: Meta<typeof AddAccountPopup> = {
  title: 'Views/Dashboard/AddAccountPopup',
  tags: ['autodocs'],
  component: AddAccountPopup,
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', backgroundColor: '#000', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    isConfirmationOpen: {
      control: 'boolean',
      description: 'Controls whether the popup is open',
    },
    importExistingAccount: {
      control: 'boolean',
      description: 'Shows/hides the import existing account option',
    },
    handleCloseIconClicked: { action: 'close icon clicked' },
    handleCancelBtnClicked: { action: 'cancel button clicked' },
    handleAddBtnClicked: { action: 'add button clicked' },
    addAccount: { action: 'add account' },
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof AddAccountPopup>;

export const Default: Story = {
  args: {
    isConfirmationOpen: true,
    importExistingAccount: false,
    handleCloseIconClicked: () => {},
    handleCancelBtnClicked: () => {},
    handleAddBtnClicked: () => {},
    addAccount: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const WithImportOption: Story = {
  args: {
    isConfirmationOpen: true,
    importExistingAccount: true,
    handleCloseIconClicked: () => {},
    handleCancelBtnClicked: () => {},
    handleAddBtnClicked: () => {},
    addAccount: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const CreateNewAccountOnly: Story = {
  args: {
    isConfirmationOpen: true,
    importExistingAccount: false,
    handleCloseIconClicked: () => {},
    handleCancelBtnClicked: () => {},
    handleAddBtnClicked: () => {},
    addAccount: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const Closed: Story = {
  args: {
    isConfirmationOpen: false,
    importExistingAccount: true,
    handleCloseIconClicked: () => {},
    handleCancelBtnClicked: () => {},
    handleAddBtnClicked: () => {},
    addAccount: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const Interactive: Story = {
  args: {
    isConfirmationOpen: true,
    importExistingAccount: true,
    handleCloseIconClicked: () => () => {},
    handleCancelBtnClicked: () => () => {},
    handleAddBtnClicked: () => () => {},
    addAccount: async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
  },
};
