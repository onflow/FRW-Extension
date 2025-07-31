import { type Meta, type StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';

import SearchInput from '../search-input';

const meta: Meta<typeof SearchInput> = {
  title: 'Components/SearchInput',
  component: SearchInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    autoFocus: { control: 'boolean' },
    showClearButton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive story with state management
const SearchInputWithState = (args: any) => {
  const [value, setValue] = useState(args.value || '');
  return (
    <div style={{ width: '300px' }}>
      <SearchInput {...args} value={value} onChange={setValue} />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <SearchInputWithState {...args} />,
  args: {
    placeholder: 'Search tokens...',
    value: '',
    autoFocus: false,
    showClearButton: true,
  },
};

export const WithInitialValue: Story = {
  render: (args) => <SearchInputWithState {...args} />,
  args: {
    placeholder: 'Search tokens...',
    value: 'FLOW',
    autoFocus: false,
    showClearButton: true,
  },
};

export const CustomStyling: Story = {
  render: (args) => <SearchInputWithState {...args} />,
  args: {
    placeholder: 'Search tokens...',
    value: '',
    autoFocus: false,
    showClearButton: true,
    sx: {
      backgroundColor: '#1A1A1A',
      '&:hover': {
        backgroundColor: '#2A2A2A',
      },
    },
  },
};

export const AutoFocus: Story = {
  render: (args) => <SearchInputWithState {...args} />,
  args: {
    placeholder: 'Search tokens...',
    value: '',
    autoFocus: true,
    showClearButton: true,
  },
};
