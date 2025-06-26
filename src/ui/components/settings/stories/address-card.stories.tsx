import { Box } from '@mui/material';
import React from 'react';

import AddressCard from '../address-card';

export default {
  title: 'Settings/AddressCard',
  component: AddressCard,
};

export const Default = () => (
  <Box width={400}>
    <AddressCard address="0x0c666c888d8fb259" label="Address" />
  </Box>
);
