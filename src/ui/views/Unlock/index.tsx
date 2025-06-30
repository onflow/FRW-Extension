import { Typography, Box, FormControl, CircularProgress } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { consoleError } from '@/shared/utils/console-log';
import { DEFAULT_PASSWORD } from '@/shared/utils/default';
import lilo from '@/ui/assets/image/lilo.png';
import { LLPrimaryButton } from '@/ui/components/LLPrimaryButton';
import { PasswordInput } from '@/ui/components/password/PasswordInput';
import { useWallet, useWalletLoaded } from '@/ui/utils';
import { openInternalPageInTab } from '@/ui/utils/webapi';

import './style.css';

const Unlock = () => {
  const wallet = useWallet();
  const walletIsLoaded = useWalletLoaded();
  const history = useHistory();

  const inputEl = useRef<any>(null);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [showUnexpectedError, setShowUnexpectedError] = useState(false);

  const [isPasswordVisible, setPasswordVisible] = useState(false);
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
        <PasswordInput
          value={password}
          onChange={(value) => {
            setShowPasswordError(false);
            setPassword(value);
          }}
          errorText={
            showPasswordError
              ? chrome.i18n.getMessage('Incorrect__Password')
              : showUnexpectedError
                ? chrome.i18n.getMessage('Oops__unexpected__error')
                : undefined
          }
          showPassword={isPasswordVisible}
          setShowPassword={setPasswordVisible}
          autoFocus={true}
          placeholder={chrome.i18n.getMessage('Enter__Your__Password')}
          onKeyDown={handleKeyDown}
        />
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
