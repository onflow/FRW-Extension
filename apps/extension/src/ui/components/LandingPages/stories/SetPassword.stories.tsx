import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';

import SetPassword from '@/ui/components/LandingPages/SetPassword';

const meta: Meta<typeof SetPassword> = {
  title: 'Components/LandingPages/SetPassword',
  tags: ['autodocs'],
  component: SetPassword,
  args: {
    onSubmit: fn(),
    isLogin: false,
  },
};

export default meta;

type Story = StoryObj<typeof SetPassword>;

export const RegisterSetPassword: Story = {
  args: {
    onSubmit: fn(),
    isLogin: false,
  },
};

export const LoginSetPassword: Story = {
  args: {
    onSubmit: fn(),
    isLogin: true,
  },
};
