import { Stack, Typography } from '@mui/material';
import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import { Button } from '../button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
    },
    loading: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const States: Story = {
  render: () => (
    <Stack spacing={3} sx={{ minWidth: '400px' }}>
      <Typography variant="h6">Button States</Typography>
      <Stack spacing={2}>
        <Button sx={{ backgroundColor: 'white', color: 'black' }}>Normal Button</Button>
        <Button sx={{ backgroundColor: 'white', color: 'black' }} disabled>
          Disabled Button
        </Button>
        <Button sx={{ backgroundColor: 'white', color: 'black' }} loading>
          Loading Button
        </Button>
      </Stack>
    </Stack>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Stack spacing={3} sx={{ minWidth: '400px' }}>
      <Typography variant="h6">Interactive Examples</Typography>
      <Stack spacing={2}>
        <Button
          sx={{ backgroundColor: 'white', color: 'black' }}
          onClick={() => alert('Button clicked!')}
        >
          Click Me
        </Button>
        <Button
          sx={{ backgroundColor: 'success.main', color: 'white' }}
          onClick={() => alert('Success button clicked!')}
        >
          Success Action
        </Button>
        <Button
          sx={{ backgroundColor: 'warning.main', color: 'white' }}
          onClick={() => alert('Warning button clicked!')}
        >
          Warning Action
        </Button>
      </Stack>
    </Stack>
  ),
};

export const StandardStyling: Story = {
  render: () => (
    <Stack spacing={3} sx={{ minWidth: '400px' }}>
      <Typography variant="h6">Standard Button Styling (100% width, 16px 20px padding)</Typography>
      <Stack spacing={2}>
        <Button sx={{ backgroundColor: 'white', color: 'black' }}>Default Button</Button>
        <Button sx={{ backgroundColor: 'success.main', color: 'white' }}>Success Button</Button>
        <Button sx={{ backgroundColor: 'error.main', color: 'white' }}>Error Button</Button>
        <Button sx={{ backgroundColor: 'warning.main', color: 'white' }}>Warning Button</Button>
      </Stack>
    </Stack>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <Stack spacing={3} sx={{ minWidth: '400px' }}>
      <Typography variant="h6">Custom Styling Examples (overriding standard dimensions)</Typography>
      <Stack spacing={2}>
        <Button
          sx={{
            width: '200px',
            height: '60px',
            backgroundColor: 'error.main',
            color: 'white',
          }}
        >
          Custom Width & Height
        </Button>
        <Button
          sx={{
            width: '300px',
            padding: '12px 24px',
            backgroundColor: 'warning.main',
            color: 'white',
          }}
        >
          Custom Width & Padding
        </Button>
        <Button
          sx={{
            width: '100%',
            backgroundColor: 'primary.main',
            color: 'white',
          }}
        >
          Full Width Button
        </Button>
        <Button
          sx={{
            width: '250px',
            backgroundColor: 'info3.main',
            color: 'white',
          }}
        >
          Custom Width Only
        </Button>
      </Stack>
    </Stack>
  ),
};
