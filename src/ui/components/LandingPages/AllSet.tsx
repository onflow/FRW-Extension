import { Button, Typography, CardMedia } from '@mui/material';
import { Box } from '@mui/system';
import React, { useCallback, useEffect } from 'react';

import { storage } from 'background/webapi';
import AllSetIcon from 'ui/assets/svg/allset.svg';
import { useWallet } from 'ui/utils';

interface AllSetProps {
  handleSwitchTab: () => void;
  variant?: 'register' | 'recover' | 'sync' | 'add';
}

const AllSet = ({ handleSwitchTab, variant = 'register' }: AllSetProps) => {
  const usewallet = useWallet();

  const loadScript = useCallback(async () => {
    if (variant === 'register') {
      await usewallet.getCadenceScripts();
    }
  }, [usewallet, variant]);

  useEffect(() => {
    if (variant === 'recover') {
      loadScript().then(() => {
        usewallet.trackAccountRecovered();
      });
    }
  }, [variant, loadScript, usewallet]);

  return (
    <>
      <Box className="registerBox">
        <CardMedia
          sx={{ margin: '0 auto', width: '172px', height: '172px', display: 'block' }}
          image={AllSetIcon}
        />
        <Typography variant="h4">
          {chrome.i18n.getMessage('You__are')}
          <Box display="inline" color="primary.main">
            {' ' + chrome.i18n.getMessage('all__set')}
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('You_can_start_experiencing_Lilico_now')}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />
        <Button
          onClick={handleSwitchTab}
          variant="contained"
          color="secondary"
          size="large"
          sx={{
            height: '56px',
            borderRadius: '12px',
            textTransform: 'capitalize',
            marginBottom: '8px',
            zIndex: 100,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
            {chrome.i18n.getMessage('Launch__My__Wallet')}
          </Typography>
        </Button>
      </Box>
    </>
  );
};

export default AllSet;
