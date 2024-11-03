import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Box, ThemeProvider } from '@mui/system';
import { IconButton, Typography, Button, Snackbar, Alert } from '@mui/material';
import BackButtonIcon from '../../../components/iconfont/IconBackButton';
import IconGoogleDrive from '../../../components/iconfont/IconGoogleDrive';
import theme from '../../style/LLTheme';
import RegisterHeader from '../Register/RegisterHeader';
import AllSet from '../Register/AllSet';
import SeedPhrase from './importComponent/SeedPhrase';
import PickUsername from './PickUsername';
import SetPassword from './SetPassword';
import GoogleBackup from './GoogleBackup';
import RecoverPassword from './RecoverPassword';
import Particles from 'react-tsparticles';
import { LLPinAlert, LLSpinner } from 'ui/FRWComponent';
import {
  ComponentTransition,
  AnimationTypes,
} from 'react-component-transition';
import { useWallet, Options } from 'ui/utils';
import ImportPager from './ImportPager';

enum Direction {
  Right,
  Left,
}

const AddressImport = () => {
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
    if (activeIndex < 4) {
      onChange(activeIndex + 1);
    } else {
      window.close();
    }
  };
  const goPassword = () => {
    setDirection(Direction.Right);
    onChange(3);
  };
  // const goGoogle = () => {
  //   setDirection(Direction.Right);
  //   onChange(4);
  // };
  const goEnd = () => {
    setDirection(Direction.Right);
    onChange(4);
  };
  const goBack = () => {
    setDirection(Direction.Left);
    if (activeIndex >= 1) {
      onChange(activeIndex - 1);
    } else {
      history.goBack();
    }
  };

  const page = (index) => {
    switch (index) {
      case 0:
        return <ImportPager
          setMnemonic={setMnemonic}
          setPk={setPk}
          setAccounts={setAccounts}
          accounts={accounts}
          mnemonic={mnemonic}
          pk={pk}
          setUsername={setUsername}
          goPassword={goPassword}
          handleClick={goNext}
          setErrorMessage={setErrorMessage}
          setShowError={setShowError}
        />;
      case 1:
        return (
          <PickUsername
            handleClick={goNext}
            savedUsername={username}
            getUsername={getUsername}
          />
        );
      case 2:
        return (
          <SetPassword
            handleClick={goEnd}
            setExPassword={setPassword}
            mnemonic={mnemonic}
            pk={pk}
            username={username}
            accounts={accounts}
            goEnd={goEnd}
          />
        );
      case 3:
        return <RecoverPassword handleClick={goNext} mnemonic={mnemonic} pk={pk} username={username} goEnd={goEnd} />;
      // case 4:
        // return <GoogleBackup handleClick={goNext} mnemonic={mnemonic} username={username} password={password} />;
      case 4:
        return <AllSet handleClick={goNext} />;
      default:
        return <div />;
    }
  };

  useEffect(() => {
    console.log('wallet');
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
        {activeIndex == 4 && (
          <Particles
            //@ts-expect-error customized option
            options={Options}
          />
        )}
        <RegisterHeader />

        <LLPinAlert open={activeIndex == 4} />

        <Box sx={{ flexGrow: 0.7 }} />
        {/* height why not use auto */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: 720,
            marginTop: '80px',
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

            <Typography
              variant="body1"
              sx={{ color: '#5E5E5E', alignSelf: 'end', lineHeight: '37px', fontWeight: '700', fontSize: '16px' }}
            >
              {chrome.i18n.getMessage('STEP')} {activeIndex + 1}/5
            </Typography>
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
      </Box>
    </ThemeProvider>
  );
};

export default AddressImport;
