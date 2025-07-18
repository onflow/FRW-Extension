import { Box, Typography } from '@mui/material';
import React from 'react';

const stepBox = () => {
  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '40px' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '24px',
          minWidth: '152px',
          height: '152px',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#41CC5D' }}>
          {chrome.i18n.getMessage('Step_1')}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#FFFFFFCC' }}>
          {chrome.i18n.getMessage('Reset_Wallet')}
        </Typography>
      </Box>
      <Box sx={{ width: '40px', height: '1px', background: ' rgba(255, 255, 255, 0.12)' }}></Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '24px',
          height: '152px',
          minWidth: '152px',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#41CC5D' }}>
          {chrome.i18n.getMessage('Step_2')}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#FFFFFFCC' }}>
          {chrome.i18n.getMessage('Import_Recovery_Phrase_or_Private_Key')}
        </Typography>
      </Box>
      <Box sx={{ width: '40px', height: '1px', background: ' rgba(255, 255, 255, 0.12)' }}></Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '24px',
          minWidth: '152px',
          height: '152px',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#41CC5D' }}>
          {chrome.i18n.getMessage('Step_3')}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#FFFFFFCC' }}>
          {chrome.i18n.getMessage('Regain_Access_to_Your_Wallet')}
        </Typography>
      </Box>
    </Box>
  );
};

export default stepBox;
