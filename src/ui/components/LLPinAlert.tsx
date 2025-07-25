import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { Snackbar, SnackbarContent, Box, Typography } from '@mui/material';
import React from 'react';

import lilicoIcon from '../../../_raw/images/icon-128.png';

export const LLPinAlert = ({ open }) => {
  return (
    <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'right' }} open={open}>
      <SnackbarContent
        sx={{
          borderRadius: '12px',
          opacity: '1',
          backdropFilter: 'blur(5px)',
          backgroundColor: 'success.light',
        }}
        message={
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <img src={lilicoIcon} style={{ height: '48px', width: '48px' }} />

            <Box>
              <Typography
                sx={{
                  fontWeight: '600',
                  fontSize: '16px',
                  fontFamily: 'Inter',
                  fontStyle: 'normal',
                  paddingRight: '3px',
                }}
              >
                {chrome.i18n.getMessage('Put__your__wallet__within__reach')}
                <br />
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Typography sx={{ fontWeight: '400', fontSize: '14px', fontFamily: 'Inter' }}>
                  {chrome.i18n.getMessage('Click__Extension')}
                </Typography>
                <ExtensionRoundedIcon style={{ fontSize: '16px' }} color="secondary" />
                <Typography sx={{ fontWeight: '400', fontSize: '14px', fontFamily: 'Inter' }}>
                  {chrome.i18n.getMessage('and__Pin')}
                </Typography>
                <PushPinOutlinedIcon style={{ fontSize: '16px' }} color="secondary" />
                <Typography sx={{ fontWeight: '400', fontSize: '14px', fontFamily: 'Inter' }}>
                  {chrome.i18n.getMessage('Flow_Core')}
                </Typography>
              </Box>
            </Box>
          </Box>
        }
      />
    </Snackbar>
  );
};
