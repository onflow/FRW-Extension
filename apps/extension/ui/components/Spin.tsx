import { Box, Typography } from '@mui/material';
import React from 'react';

import { LLSpinner } from './LLSpinner';

export default ({ children, spinning = true }) => {
  return (
    <Box
      sx={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {spinning && (
        <>
          <LLSpinner size={50} />
          <Typography variant="body1" color="text.main">
            {chrome.i18n.getMessage('please_restart_your_browser')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {chrome.i18n.getMessage('if_you_keep_seeing_this_spinner')}
          </Typography>
        </>
      )}
      {children}
    </Box>
  );
};
