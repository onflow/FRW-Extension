import CloseIcon from '@mui/icons-material/Close';
import { Typography, Box, IconButton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect, useCallback } from 'react';

import { LLPrimaryButton } from 'ui/FRWComponent';
import { useWallet } from 'ui/utils';

import lilicoIcon from '../../../_raw/images/icon-256.png';

interface DeleteBackupProps {
  deleteBackupPop: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleNextBtnClicked: () => void;
}

const useStyles = makeStyles(() => ({
  flownsWrapper: {
    position: 'fixed',
    right: 0,
    bottom: 0,
    top: 0,
    left: 0,
    zIndex: 1200,
    height: '100%',
  },
  flownsBackground: {
    position: 'fixed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    right: 0,
    bottom: '55px',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: -1,
  },
}));

export const LLFlownsPop = (props: DeleteBackupProps) => {
  const classes = useStyles();
  const wallet = useWallet();
  const [expand, setExpand] = useState(false);
  const [username, setUsername] = useState('');

  const onCancelBtnClicked = () => {
    wallet.setPopStat(false);
    props.handleCancelBtnClicked();
  };

  const onNextBtnClicked = () => {
    wallet.setPopStat(false);
    window.open('https://core.flow.com/', '_blank');
  };

  const onPopupBtnClicked = () => {
    setExpand(true);
  };

  const getUsername = useCallback(async () => {
    const userInfo = await wallet.getUserInfo(false);
    setUsername(userInfo.username);
  }, [wallet]);

  useEffect(() => {
    getUsername();
  }, [getUsername]);

  const renderContent = () => (
    <Box
      px="18px"
      sx={{
        height: 'auto',
        position: 'fixed',
        bottom: '71px',
      }}
    >
      <IconButton
        sx={{
          backgroundColor: '#FFFFFF66',
          borderRadius: '20px',
          padding: '5px',
          position: 'absolute',
          right: '32px',
          top: '16px',
          zIndex: '5',
        }}
        onClick={onCancelBtnClicked}
      >
        <CloseIcon sx={{ color: '#2E2E2E', cursor: 'pointer', width: '12px', height: '12px' }} />
      </IconButton>
      <Box
        sx={{
          width: '100%',
          height: 'auto',
          display: 'flex',
          background: 'linear-gradient(186.58deg, #353535 -0.69%, #080C0F 149.5%)',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '12px',
          alignItems: 'flex-start',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: '-58px',
            right: '-65px',
            opacity: '0.32',
            zIndex: '1',
          }}
        >
          <img src={lilicoIcon} />
        </Box>
        <Box
          sx={{
            justifyContent: 'space-between',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 37px 24px 24px',
            alignItems: 'flex-start',
            position: 'relative',
            zIndex: '2',
          }}
        >
          <Box sx={{ width: '100%' }}>
            <Typography
              variant="body2"
              align="left"
              paddingTop="9px"
              color="#41CC5D"
              fontSize="12px"
              fontWeight="600"
            >
              Big News!
            </Typography>
            <Typography
              variant="body2"
              align="left"
              paddingTop="12px"
              paddingBottom="12px"
              color="#FFFFFF"
              fontSize="18px"
              fontWeight="700"
            >
              Lilico Wallet Officially Renamed to Flow Wallet
            </Typography>
            <Typography
              variant="body2"
              align="left"
              paddingBottom="32px"
              color="rgba(255, 255, 255, 0.80)"
              fontSize="12px"
              paddingRight="32px"
            >
              From now on, Lilico Wallet is rebranding as Flow Wallet under new management.
            </Typography>
          </Box>
          <LLPrimaryButton
            label={'Learn More'}
            onClick={onNextBtnClicked}
            sx={{
              borderRadius: '14px',
              padding: '8px 24px',
              width: 'auto',
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'none !important',
              backgroundColor: '#41CC5D',
              color: '#000',
            }}
          />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box className={classes.flownsWrapper}>
      <Box className={classes.flownsBackground}></Box>
      {renderContent()}
    </Box>
  );
};
