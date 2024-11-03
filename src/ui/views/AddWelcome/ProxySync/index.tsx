import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, ThemeProvider } from '@mui/system';
import { IconButton, Typography, Button, Snackbar, Alert } from '@mui/material';
import BackButtonIcon from '../../../../components/iconfont/IconBackButton';
import IconGoogleDrive from '../../../../components/iconfont/IconGoogleDrive';
import theme from '../../../style/LLTheme';
import RegisterHeader from '../AddRegister/RegisterHeader';
import AllSet from '../AddRegister/AllSet';
import SetPassword from './SetPassword';
import ProxyQr from './ProxyQr';
import Particles from 'react-tsparticles';
import { LLPinAlert, LLSpinner } from 'ui/FRWComponent';
import {
  ComponentTransition,
  AnimationTypes,
} from 'react-component-transition';
import { useWallet, Options } from 'ui/utils';

enum Direction {
  Right,
  Left,
}

const ProxySync = () => {
  const history = useHistory();
  const wallet = useWallet();
  const [activeIndex, onChange] = useState(0);
  const [publickey, setPubkey] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [username, setUsername] = useState('');
  const [errMessage, setErrorMessage] = useState(chrome.i18n.getMessage('No__backup__found'));
  const [showError, setShowError] = useState(false);
  const [direction, setDirection] = useState(Direction.Right);
  const [loading, setLoading] = useState(false);
  const [accountKey, setAccountKey] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  const getUsername = (username: string) => {
    setUsername(username.toLowerCase());
  };

  const loadView = async () => {
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
    if (activeIndex < 2) {
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
      history.goBack();
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
        return <ProxyQr
          handleClick={goNext}
          savedUsername={username}
          confirmMnemonic={setMnemonic}
          confirmPk={setPubkey}
          setUsername={getUsername}
          setAccountKey={setAccountKey}
          setDeviceInfo={setDeviceInfo}
        />;
      case 1:
        return <SetPassword handleClick={goNext} mnemonic={mnemonic} publickey={publickey} username={username} setUsername={getUsername} accountKey={accountKey} deviceInfo={deviceInfo} />;
      case 2:
        return <AllSet handleClick={goNext} />;
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
        {activeIndex == 2 && (
          <Particles
            //@ts-expect-error customized option
            options={Options}
          />
        )}
        <RegisterHeader />

        <LLPinAlert open={activeIndex == 2} />

        <Box sx={{ flexGrow: 0.7 }} />
        {/* height why not use auto */}
        <Box
          sx={{
            height: '460px',
            backgroundColor: 'transparent'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              px: '60px',
              height: 'auto',
              width: 'auto',
              position: 'relative',
              borderRadius: '24px'
            }}
          >


            {(activeIndex !== 4 && activeIndex !== 5) &&
              <IconButton onClick={goBack} size="small" sx={{ marginLeft: '-95px' }}>
                <BackButtonIcon color="#5E5E5E" size={27} />
              </IconButton>
            }

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
        </Box>

        <Box sx={{ flexGrow: 1 }} />
      </Box>
    </ThemeProvider>
  );
};

export default ProxySync;
