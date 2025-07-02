import { IconButton, Snackbar, Alert } from '@mui/material';
import { Box } from '@mui/system';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';

import BackButtonIcon from '@/ui/components/iconfont/IconBackButton';
import RegisterHeader from '@/ui/components/LandingPages/RegisterHeader';
import SlideLeftRight from '@/ui/components/SlideLeftRight';
import SlideRelative from '@/ui/components/SlideRelative';
import { storage } from 'background/webapi';
import { useWallet } from 'ui/utils';

import RecoverPage from './RecoverPage';
import ShowKey from './ShowKey';

enum Direction {
  Right,
  Left,
}

const Recover = () => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [activeIndex, onChange] = useState(0);
  const [errMessage] = useState(chrome.i18n.getMessage('No__backup__found'));
  const [showError, setShowError] = useState(false);
  const [direction, setDirection] = useState(Direction.Right);
  const [, setPassword] = useState(null);
  const [dataArray, setArray] = useState<any[]>([]);

  const loadView = useCallback(async () => {
    wallet
      .getCurrentAccount()
      .then((res) => {
        if (res) {
          navigate('/');
        }
      })
      .catch(() => {
        return;
      });
  }, [navigate, wallet]);
  const goNext = () => {
    setDirection(Direction.Right);
    if (activeIndex < 5) {
      onChange(activeIndex + 1);
    } else {
      window.close();
    }
  };

  const goBack = () => {
    setDirection(Direction.Left);
    if (activeIndex >= 1) {
      onChange(activeIndex - 1);
    } else {
      navigate(-1);
    }
  };

  const handleErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowError(false);
  };

  const page = (index) => {
    switch (index) {
      case 0:
        return <RecoverPage setArray={setArray} dataArray={dataArray} goNext={goNext} />;
      case 1:
        return <ShowKey handleSwitchTab={goNext} mnemonic={dataArray} />;
      default:
        return <div />;
    }
  };

  useEffect(() => {
    loadView();
  }, [loadView]);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default',
          width: '100%',
          height: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <RegisterHeader />

        <Box sx={{ flexGrow: 0.7 }} />
        {/* height why not use auto */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '720px',
            height: 'auto',
            transition: 'all .3s ease-in-out',
            borderRadius: '24px',
            boxShadow: '0px 24px 24px rgba(0,0,0,0.36)',
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: 'background.paper',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              // height: '56px',
              // backgroundColor: '#404040',
              padding: '24px 24px 0px 24px',
            }}
          >
            <IconButton onClick={goBack} size="small">
              <BackButtonIcon color="#5E5E5E" size={27} />
            </IconButton>

            <div style={{ flexGrow: 1 }}></div>
          </Box>

          <SlideLeftRight show={true} direction={direction === Direction.Left ? 'left' : 'right'}>
            {page(activeIndex)}
          </SlideLeftRight>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <Snackbar open={showError} autoHideDuration={6000} onClose={handleErrorClose}>
          <Alert
            onClose={handleErrorClose}
            variant="filled"
            severity="error"
            sx={{ width: '100%' }}
          >
            {errMessage}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default Recover;
