import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { withRouter } from 'storybook-addon-remix-react-router';

import Welcome from '../index';

const meta = {
  title: 'views/Welcome',
  component: Welcome,
  decorators: [
    withRouter,
    (Story) => (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Story />
      </Box>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  args: {},
} satisfies Meta<typeof Welcome>;

export default meta;

type Story = StoryObj<typeof Welcome>;

export const Default: Story = {
  args: {},
};
