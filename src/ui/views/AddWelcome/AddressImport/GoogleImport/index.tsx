import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Box, ThemeProvider } from '@mui/system';
import { IconButton, Typography } from '@mui/material';
import BackButtonIcon from '../../../../../components/iconfont/IconBackButton';
import theme from '../../../../style/LLTheme';
import RegisterHeader from '../../../Register/RegisterHeader';
import AllSet from '../../../Register/AllSet';
import DecryptWallet from './DecryptWallet';
import RecoveryPhrase from './RecoveryPhrase';
import GoogleAccounts from './GoogleAccounts';
import RecoveryPassword from './RecoverPassword';
import Particles from 'react-tsparticles';
import {
  ComponentTransition,
  AnimationTypes,
} from 'react-component-transition';
import { LLPinAlert } from '@/ui/FRWComponent';
import { Options } from 'ui/utils';
import { storage } from 'background/webapi';

enum Direction {
  Right,
  Left,
}

interface AccountsState {
  accounts: string[]
}

const GoogleImport = () => {
  const location = useLocation<AccountsState>();
  const history = useHistory();
  const [activeIndex, onChange] = useState(0);
  const [mnemonic, setMnemonic] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [direction, setDirection] = useState(Direction.Right);

  const goNext = () => {
    setDirection(Direction.Right);
    if (activeIndex < 4) {
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

  const loadTempPassword = async () => {
    const temp = await storage.get('tempPassword');
    if (temp) {
      setPassword(temp);
    }
  };

  const getGoogleAccounts = async () => {
    // const backupFile = await storage.get('googleBackup');
    // await setBackup(backupFile);
    const users = location.state.accounts;
    const backupAccounts = localStorage.getItem('backupAccounts');
    if (backupAccounts) {
      const accountList = JSON.parse(backupAccounts);
      setAccounts(accountList)
    } else {
      setAccounts(users)
    }
  };

  useEffect(() => {
    getGoogleAccounts();
    loadTempPassword();
  }, []);

  const page = (index) => {
    switch (index) {
      case 0:
        return <GoogleAccounts handleClick={goNext} accounts={accounts} setUsername={setUsername}/>
      case 1:
        return <DecryptWallet handleClick={goNext} setMnemonic={setMnemonic} username={username} />;
      case 2:
        return <RecoveryPhrase handleClick={goNext} mnemonic={mnemonic} />;
      case 3:
        return <RecoveryPassword handleClick={goNext} mnemonic={mnemonic} username={username} lastPassword={password}/>
      case 4:
        return <AllSet handleClick={goNext} />;
      default:
        return <div />;
    }
  };

  const heights = [500, 500, 600, 600, 500]

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default',
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {activeIndex == 4 && (
          <Particles
            // @ts-expect-error customized options
            options={Options}
          />
        )}
        <LLPinAlert open={activeIndex == 4} />
        <RegisterHeader />
        <Box sx={{ flexGrow: 0.7 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: 720,
            marginTop:'80px',
            height: 'auto',
            transition: 'all .3s ease-in-out',
            borderRadius: '24px',
            boxShadow: '0px 24px 24px rgba(0,0,0,0.36)',
            overflow: 'hidden',
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
              sx={{ color: '#5E5E5E', alignSelf: 'end',lineHeight:'37px', fontWeight: '700',fontSize:'16px' }}
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

export default GoogleImport;
