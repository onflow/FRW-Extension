import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, ThemeProvider } from '@mui/system';
import { IconButton, Typography, Button, Snackbar, Alert } from '@mui/material';
import { storage } from 'background/webapi';
import Particles from 'react-tsparticles';
import { LLPinAlert, LLSpinner } from 'ui/FRWComponent';
import ResetPage from './ResetPage';
import theme from '../../../style/LLTheme';
import RegisterHeader from '../../Register/RegisterHeader';
import BackButtonIcon from '../../../../components/iconfont/IconBackButton';
import {
  ComponentTransition,
  AnimationTypes,
} from 'react-component-transition';
import { useWallet, Options } from 'ui/utils';

enum Direction {
  Right,
  Left,
}

const Reset = () => {
  const history = useHistory();
  const wallet = useWallet();
  const [activeIndex, onChange] = useState(0);
  const [mnemonic, setMnemonic] = useState('');
  const [pk, setPk] = useState(null);
  const [username, setUsername] = useState('');
  const [errMessage, setErrorMessage] = useState(chrome.i18n.getMessage('No__backup__found'));
  const [showError, setShowError] = useState(false);
  const [direction, setDirection] = useState(Direction.Right);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState(null);
  const [accounts, setAccounts] = useState<any>([]);
  const [isImport, setImport] = useState<any>(false);

  const getUsername = (username: string) => {
    setUsername(username.toLowerCase());
  };

  const loadTempPassword = async () => {
    const temp = await storage.get('tempPassword');
    if (temp) {
      setPassword(temp);
    }
  };

  const loadView = async () => {
    // console.log(wallet);
    wallet.getCurrentAccount().then((res) => {
      if (res) {
        history.push('/');
      }
    }).catch(() => {
      return;
    });
  };
  const goNext = () => {
    setDirection(Direction.Right);
    if (activeIndex < 5) {
      onChange(activeIndex + 1);
    } else {
      window.close();
    }
  };
  const goPassword = () => {
    setDirection(Direction.Right);
    onChange(3);
  };
  const goGoogle = () => {
    setDirection(Direction.Right);
    onChange(4);
  };
  const goEnd = () => {
    setDirection(Direction.Right);
    onChange(5);
  };

  const goBack = () => {
    setDirection(Direction.Left);
    if (activeIndex >= 1) {
      onChange(activeIndex - 1);
    } else {
      history.goBack();
    }
  };

  useEffect(() => {
    loadTempPassword();
  }, []);

  const handleErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowError(false);
  };

  const page = (index) => {
    switch (index) {
      case 0:
        return <ResetPage
          resetPop={false}
          handleCloseIconClicked={() => goNext()}
          handleCancelBtnClicked={() => goNext()}
          handleAddBtnClicked={() => {
            goNext();
          }}
        />;
      default:
        return <div />;
    }
  };

  useEffect(() => {
    loadView();
  }, []);


  return (
    <ThemeProvider theme={theme}>
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

          <ComponentTransition
            enterAnimation={
              direction === Direction.Left
                ? AnimationTypes.slideLeft.enter
                : AnimationTypes.slideRight.enter
            }
            exitAnimation={
              direction === Direction.Left
                ? AnimationTypes.slideRight.exit
                : AnimationTypes.slideLeft.exit
            }
            animateContainer={true}
            style={{
              width: '100%',
              height: '100%',
            }}
          >
            {page(activeIndex)}
          </ComponentTransition>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <Snackbar open={showError} autoHideDuration={6000} onClose={handleErrorClose}>
          <Alert onClose={handleErrorClose} variant="filled" severity="error" sx={{ width: '100%' }}>
            {errMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default Reset;
