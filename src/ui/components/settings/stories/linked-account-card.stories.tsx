import { Box } from '@mui/material';
import React from 'react';

import { LinkedAccountCard } from '../linked-account-card';

export default {
  title: 'Settings/LinkedAccountCard',
  component: LinkedAccountCard,
};

export const Default = () => (
  <Box width={400}>
    <LinkedAccountCard
      account={{
        name: 'Panda',
        icon: '🐼',
        color: '#fff',
        address: '0x0c666c888d8fb259',
        chain: 1,
        id: 1,
      }}
      parentName="Main Account"
      onEditClick={() => alert('Edit clicked')}
      showCard={true}
    />
  </Box>
);
