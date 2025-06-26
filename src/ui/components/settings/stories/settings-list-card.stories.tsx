import { Box } from '@mui/material';
import React from 'react';

import SettingsListCard from '../settings-list-card';

export default {
  title: 'Settings/SettingsListCard',
  component: SettingsListCard,
};

export const Default = () => (
  <Box width={400}>
    <SettingsListCard
      items={[
        {
          iconColor: '#1A5CFF',
          iconText: 'A',
          title: 'NBA-Top-Shot',
          subtitle: '29 Collectible',
        },
        {
          iconColor: '#8e24aa',
          iconText: 'B',
          title: 'Flovatar Collection',
          subtitle: '12 Collectible',
        },
        {
          iconColor: '#333',
          iconText: 'C',
          title: 'DGD shop',
        },
      ]}
    />
  </Box>
);
