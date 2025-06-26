import { Box } from '@mui/material';
import React, { useState } from 'react';

import SlidingTabSwitch from '../sliding-tab-switch';

export default {
  title: 'Settings/SlidingTabSwitch',
  component: SlidingTabSwitch,
};

export const Default = () => {
  const [value, setValue] = useState('one');
  return (
    <Box width={400}>
      <SlidingTabSwitch
        value={value}
        onChange={setValue}
        leftLabel="Collections"
        rightLabel="Coins"
        leftValue="one"
        rightValue="two"
      />
    </Box>
  );
};
