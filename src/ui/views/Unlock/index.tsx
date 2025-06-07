// import { useTranslation } from 'react-i18next';
import { Input, Typography, Box, FormControl, CircularProgress } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { consoleError } from '@/shared/utils/console-log';
import { DEFAULT_PASSWORD } from '@/shared/utils/default';
import lilo from '@/ui/assets/image/lilo.png';
import { LLPrimaryButton } from '@/ui/components';
import CancelIcon from '@/ui/components/iconfont/IconClose';
import SlideRelative from '@/ui/components/SlideRelative';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useWallet, useWalletLoaded } from '@/ui/utils';
import { openInternalPageInTab } from '@/ui/utils/webapi';

import './style.css';

const useStyles = makeStyles(() => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    height: '64px',
    padding: '16px',
    magrinBottom: '64px',
    zIndex: '999',
    backgroundColor: '#282828',
    border: '2px solid #4C4C4C',
    borderRadius: '12px',
    boxSizing: 'border-box',
    '&.Mui-focused': {
      border: '2px solid #FAFAFA',
      boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
    },
  },
}));

const UsernameError: React.FC = () => (
  <Box display="flex" flexDirection="row" alignItems="center">
    <CancelIcon size={24} color={'#E54040'} style={{ margin: '8px' }} />
    <Typography variant="body1" color="text.secondary">
      {chrome.i18n.getMessage('Incorrect__Password')}
    </Typography>
  </Box>
);

const UnexpectedError: React.FC = () => (
  <Box display="flex" flexDirection="row" alignItems="center">
    <CancelIcon size={24} color={'#E54040'} style={{ margin: '8px' }} />
    <Typography variant="body1" color="text.secondary">
      {chrome.i18n.getMessage('Oops__unexpected__error')}
    </Typography>
  </Box>
);

const Unlock = () => {
  const wallet = useWallet();
  const walletIsLoaded = useWalletLoaded();
  const history = useHistory();
  const classes = useStyles();
  const inputEl = useRef<any>(null);
  // const { t } = useTranslation();
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [showUnexpectedError, setShowUnexpectedError] = useState(false);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [unlocking, setUnlocking] = useState<boolean>(false);

  useEffect(() => {
    if (!inputEl.current) return;
    inputEl.current.focus();
  }, []);

  const restPass = useCallback(async () => {
    await wallet.lockWallet();
    openInternalPageInTab('forgot');
  }, [wallet]);

  const handleUnlock = useCallback(async () => {
    // Check the password is correct
    try {
      await wallet.verifyPassword(password);
    } catch {
      // Password is incorrect
      setShowPasswordError(true);
      return;
    }
    // Unlock the wallet
    try {
      setUnlocking(true);
      await wallet.unlock(password);
      history.replace('/');
    } catch (err) {
      consoleError('failed to unlock wallet', err);
      setShowUnexpectedError(true);
    } finally {
      setUnlocking(false);
    }
  }, [wallet, history, password]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        handleUnlock();
      }
    },
    [handleUnlock]
  );

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        backgroundColor: '#282828',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* <Logo size={90} style={{marginTop:'120px'}}/> */}

      <Box className="logoContainer" sx={{ marginTop: '60px' }}>
        <img src={lilo} style={{ height: '100%', width: '100%' }} />
      </Box>

      {/* <img  style={{paddingTop:'108px' }} src={lilicoIcon} /> */}
      <Box sx={{ width: '100%', textAlign: 'center' }}>
        <Typography
          sx={{
            fontWeight: '700',
            fontSize: '26px',
            fontFamily: 'Inter',
            fontStyle: 'normal',
            pt: '30px',
            pb: '30px',
          }}
        >
          {chrome.i18n.getMessage('Welcome__Back__Unlock')}
        </Typography>
      </Box>

      <FormControl
        sx={{
          flexGrow: 1,
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <Input
          id="textfield"
          type="password"
          className={classes.inputBox}
          placeholder={chrome.i18n.getMessage('Enter__Your__Password')}
          autoFocus
          fullWidth
          disableUnderline
          value={password}
          onChange={(event) => {
            setShowPasswordError(false);
            setPassword(event.target.value);
          }}
          onKeyDown={handleKeyDown}
        />

        <SlideRelative direction="down" show={showPasswordError || showUnexpectedError}>
          <Box
            sx={{
              width: '95%',
              backgroundColor: 'error.light',
              mx: 'auto',
              borderRadius: '0 0 12px 12px',
            }}
          >
            <Box display="flex" flexDirection="row" sx={{ p: '4px' }}>
              {showPasswordError ? <UsernameError /> : <UnexpectedError />}
            </Box>
          </Box>
        </SlideRelative>
      </FormControl>

      <Box sx={{ width: '90%', marginBottom: '32px' }}>
        <LLPrimaryButton
          // className="w-full block"\
          color="success"
          type="submit"
          onClick={handleUnlock}
          fullWidth
          label={
            unlocking ? <CircularProgress size={18} /> : chrome.i18n.getMessage('Unlock_Wallet')
          }
          disabled={!walletIsLoaded || unlocking}

          // sx={{marginTop: '40px', height: '48px'}}
          // type="primary"
          // size="large"
        />
        <Typography
          onClick={restPass}
          sx={{
            fontSize: '14px',
            fontFamily: 'Inter',
            fontStyle: 'normal',
            color: 'neutral1.main',
            textAlign: 'center',
            marginTop: '16px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {chrome.i18n.getMessage('Forgot_password')}
        </Typography>
      </Box>
    </Box>
  );
};

export default Unlock;
