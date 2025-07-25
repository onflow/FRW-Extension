import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { fn } from 'storybook/test';

import LandingComponents from '../LandingComponents';

const meta = {
  title: 'components/LandingPages/LandingComponents',
  component: LandingComponents,
  decorators: [
    (Story) => {
      return <Story />;
    },
  ],
};
export default meta;

type Story = StoryObj<typeof LandingComponents>;

export const Default: Story = {
  args: {
    activeIndex: 1,
    direction: 'left',
    showBackButton: true,
    onBack: fn(),
    children: <div style={{ width: '500px', height: '500px' }} />,
  },
};
