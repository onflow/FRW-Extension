import { Typography, Button, Fade, Input, FormControl } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { LLHeader } from '@/ui/components';
import CancelIcon from '@/ui/components/iconfont/IconClose';
import SettingsPassword from '@/ui/components/SettingsPassword';
import SlideRelative from '@/ui/components/SlideRelative';
import { useWallet } from 'ui/utils';

const PrivateKeyPassword = () => {
  return (
    <SettingsPassword verifiedUrl="/dashboard/nested/keydetail">
      <Fade in={true}>
        <Box
          sx={{
            backgroundColor: 'rgba(247, 87, 68, 0.1)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            my: '18px',
            padding: '16px',
          }}
        >
          <Typography
            sx={{
              alignSelf: 'center',
              fontSize: '12px',
              fontStyle: 'normal',
              fontWeight: '600',
              lineHeight: '16px',
              color: '#E54040',
              paddingBottom: '16px',
              paddingTop: '0px',
            }}
          >
            {chrome.i18n.getMessage('Do__not__share__your__private__key')}
          </Typography>
          <Typography
            sx={{
              alignSelf: 'center',
              fontSize: '12px',
              fontStyle: 'normal',
              fontWeight: '400',
              lineHeight: '16px',
              color: '#E54040',
              textAlign: 'center',
            }}
          >
            {chrome.i18n.getMessage('If__someone__has__your__private__key')}
          </Typography>
        </Box>
      </Fade>
    </SettingsPassword>
  );
};

export default PrivateKeyPassword;
