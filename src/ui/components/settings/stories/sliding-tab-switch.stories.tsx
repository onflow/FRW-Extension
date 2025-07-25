import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';

import SlidingTabSwitch from '@/ui/components/settings/sliding-tab-switch';

const meta: Meta<typeof SlidingTabSwitch> = {
  title: 'Components/Settings/SlidingTabSwitch',
  component: SlidingTabSwitch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component: 'A sliding tab switch component for toggling between two options.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '400px',
          backgroundColor: '#181818',
          borderRadius: '16px',
          padding: '16px',
          color: 'white',
        }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    value: {
      control: 'text',
      description: 'Current selected value',
    },
    onChange: {
      action: 'changed',
      description: 'Change handler function',
    },
    leftLabel: {
      control: 'text',
      description: 'Label for the left option',
    },
    rightLabel: {
      control: 'text',
      description: 'Label for the right option',
    },
    leftValue: {
      control: 'text',
      description: 'Value for the left option',
    },
    rightValue: {
      control: 'text',
      description: 'Value for the right option',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SlidingTabSwitch>;

export const Default: Story = {
  args: {
    value: 'one',
    onChange: () => {},
    leftLabel: 'Collections',
    rightLabel: 'Coins',
    leftValue: 'one',
    rightValue: 'two',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default sliding tab switch with collections and coins options.',
      },
    },
  },
};

export const LeftSelected: Story = {
  args: {
    value: 'one',
    onChange: () => {},
    leftLabel: 'Collections',
    rightLabel: 'Coins',
    leftValue: 'one',
    rightValue: 'two',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sliding tab switch with left option selected.',
      },
    },
  },
};

export const RightSelected: Story = {
  args: {
    value: 'two',
    onChange: () => {},
    leftLabel: 'Collections',
    rightLabel: 'Coins',
    leftValue: 'one',
    rightValue: 'two',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sliding tab switch with right option selected.',
      },
    },
  },
};

export const CustomLabels: Story = {
  args: {
    value: 'on',
    onChange: () => {},
    leftLabel: 'ON',
    rightLabel: 'OFF',
    leftValue: 'on',
    rightValue: 'off',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sliding tab switch with custom ON/OFF labels.',
      },
    },
  },
};

export const LongLabels: Story = {
  args: {
    value: 'option1',
    onChange: () => {},
    leftLabel: 'Very Long Left Label',
    rightLabel: 'Very Long Right Label',
    leftValue: 'option1',
    rightValue: 'option2',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sliding tab switch with long labels to test text wrapping.',
      },
    },
  },
};

export const MultipleSwitches: Story = {
  args: {
    value: 'grid',
    onChange: () => {},
    leftLabel: 'Grid',
    rightLabel: 'List',
    leftValue: 'grid',
    rightValue: 'list',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sliding tab switch with grid/list options.',
      },
    },
  },
};
