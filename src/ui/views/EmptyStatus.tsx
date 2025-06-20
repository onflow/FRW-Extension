import { Typography, Box } from '@mui/material';
import React from 'react';

import empty_status from '@/ui/assets/image/empty_status.svg';

function EmptyStatus() {
  return (
    <Box
      sx={{
        height: '249px',
        justifyContent: 'center',
        alignContent: 'center',
        textAlign: 'center',
      }}
    >
      <img src={empty_status} height="167px" style={{ margin: '0 auto auto auto' }} />
      <Typography
        sx={{
          fontSize: '16px',
          lineHeight: '24px',
          fontWeight: 600,
          marginTop: '8px',
          marginBottom: '4px',
          width: '100%',
          color: '#8C8C8C',
        }}
      >
        {chrome.i18n.getMessage('We__did__not__find__anything__here')}
      </Typography>
      <Typography
        sx={{
          fontSize: '14px',
          lineHeight: '20px',
          width: '100%',
          color: '#8C8C8C',
        }}
      >
        {chrome.i18n.getMessage('Looking__forward__to__your__new__discovery')}
      </Typography>
    </Box>
  );
}

export default EmptyStatus;
