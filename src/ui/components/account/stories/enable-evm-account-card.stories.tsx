import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import { withRouter } from 'storybook-addon-remix-react-router';

import { EnableEvmAccountCard } from '../enable-evm-account-card';
const meta: Meta<typeof EnableEvmAccountCard> = {
  title: 'Components/account/EnableEvmAccountCard',
  tags: ['autodocs'],

  component: EnableEvmAccountCard,
  decorators: [withRouter],
};

export default meta;

type Story = StoryObj<typeof EnableEvmAccountCard>;

export const Default: Story = {
  args: {},
};
