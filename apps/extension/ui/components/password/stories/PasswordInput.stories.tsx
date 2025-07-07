import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';

import { PasswordInput } from '@/ui/components/password/PasswordInput';

const meta: Meta<typeof PasswordInput> = {
  title: 'Components/password/PasswordInput',
  tags: ['autodocs'],
  component: PasswordInput,
  decorators: [
    (Story, { args }) => {
      const [password, setPassword] = useState(args.value || '');
      return (
        <Story
          args={{
            ...args,
            value: password,
            onChange: (value) => {
              setPassword(value);
            },
          }}
        />
      );
    },
  ],
};

type Story = StoryObj<typeof PasswordInput>;

export default meta;

export const Default: Story = {
  args: {},
};

export const WithError: Story = {
  args: {
    value: '123',
    errorText: 'Password is too short',
  },
};

export const WithHelperText: Story = {
  args: {
    value: '12345678',
    helperText: 'Password matches',
  },
};

export const WithIndicator: Story = {
  args: {
    value: '12345678',
    showIndicator: true,
  },
};

export const ReadOnly: Story = {
  args: {
    value: '12345678',
    showIndicator: false,
    readOnly: true,
  },
};
