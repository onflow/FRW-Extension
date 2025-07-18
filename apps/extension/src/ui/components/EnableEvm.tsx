import { Box, CardMedia, Typography } from '@mui/material';
import React from 'react';

import enableBg from '@/ui/assets/image/enableBg.png';

export const EnableEvm = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <CardMedia component="img" sx={{ width: '196px', height: '196px' }} image={enableBg} />

      <Typography
        variant="h3"
        sx={{
          fontWeight: 'bold',
          color: '#E6E6E6',
          textAlign: 'center',
          fontFamily: 'Inter',
          fontSize: '20px',
          mt: '20px',
          width: '168px',
        }}
      >
        {chrome.i18n.getMessage('enable_the_path_to_evm_on_flow')}
      </Typography>
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 'normal', color: '#bababa', textAlign: 'center', fontSize: '14px' }}
      >
        {chrome.i18n.getMessage('manage_multi_assets_seamlessly')}
      </Typography>
    </Box>
  );
};
