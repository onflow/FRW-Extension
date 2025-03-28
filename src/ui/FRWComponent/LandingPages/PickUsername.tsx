import {
  CircularProgress,
  IconButton,
  Button,
  Typography,
  FormControl,
  Input,
  InputAdornment,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/system';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import EmailIcon from '@/ui/assets/alternate-email.svg';
import SlideRelative from '@/ui/FRWComponent/SlideRelative';
import { useWallet } from 'ui/utils';

import CheckCircleIcon from '../../../components/iconfont/IconCheckmark';
import CancelIcon from '../../../components/iconfont/IconClose';

const useStyles = makeStyles((_theme) => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    height: '64px',
    padding: '16px',
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

const PickUsername = ({
  handleSwitchTab,
  username,
  setUsername,
}: {
  handleSwitchTab: () => void;
  username: string;
  setUsername: (username: string) => void;
}) => {
  const classes = useStyles();
  const wallet = useWallet();
  const [isLoading, setLoading] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);

  const usernameError = (errorMsg) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CancelIcon size={24} color="#E54040" style={{ margin: '8px' }} />
      <Typography variant="body1" color="error.main">
        {errorMsg}
        {errorMsg.startsWith('This username is reserved') && (
          <span>
            <a href="mailto: hi@lilico.app">hi@lilico.app</a>
            {chrome.i18n.getMessage('for__any__inquiry')}
          </span>
        )}
      </Typography>
    </Box>
  );
  const usernameCorrect = useMemo(
    () => (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <CheckCircleIcon size={24} color="#41CC5D" style={{ margin: '8px' }} />
        <Typography variant="body1" color="success.main">
          {chrome.i18n.getMessage('Sounds_good')}
        </Typography>
      </Box>
    ),
    []
  );
  const usernameLoading = useMemo(
    () => (
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <CircularProgress color="primary" size={22} style={{ fontSize: '22px', margin: '8px' }} />
        {chrome.i18n.getMessage('Checking')}
      </Typography>
    ),
    []
  );

  const [errorMessage, setErrorMessage] = useState('');

  const isMounted = useRef(true);

  const validateUsername = useCallback(
    (newUsername: string) => {
      const runCheckUsername = async () => {
        if (isMounted.current) {
          setLoading(true);
        }
        try {
          const response = await wallet.openapi.checkUsername(newUsername.toLowerCase());
          if (response.data.username !== newUsername.toLowerCase()) {
            return;
          }
          if (isMounted.current) {
            if (response.data.unique) {
              setUsernameValid(true);
              setErrorMessage('');
            } else {
              setUsernameValid(false);
              if (response.message === 'Username is reserved') {
                setErrorMessage(
                  chrome.i18n.getMessage('This__username__is__reserved__Please__contact')
                );
              } else {
                setErrorMessage(chrome.i18n.getMessage('This__name__is__taken'));
              }
            }
          }
        } catch (error) {
          console.error('error', error);
          if (isMounted.current) {
            setErrorMessage(chrome.i18n.getMessage('Oops__unexpected__error'));
          }
        } finally {
          if (isMounted.current) {
            setLoading(false);
          }
        }
      };

      if (newUsername.length < 3) {
        setErrorMessage(chrome.i18n.getMessage('Too__short'));
        setUsernameValid(false);
        return;
      }

      if (newUsername.length > 15) {
        setErrorMessage(chrome.i18n.getMessage('Too__long'));
        setUsernameValid(false);
        return;
      }

      const regex = /^[A-Za-z0-9]{3,15}$/;
      if (!regex.test(newUsername)) {
        setErrorMessage(
          chrome.i18n.getMessage('Your__username__can__only__contain__letters__and__numbers')
        );
        setUsernameValid(false);
        return;
      }
      if (isMounted.current) {
        // Async check username
        runCheckUsername();
      }
    },
    [wallet.openapi]
  );

  const handleUsernameChange = useDebouncedCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newUsername = event.target.value;
      // Set the username
      setUsername(newUsername);

      // Validate username
      validateUsername(newUsername);
    },
    500
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleClearUsername = useCallback(() => {
    setUsername('');
  }, [setUsername]);

  const msgBgColor = isLoading ? 'neutral.light' : usernameValid ? 'success.light' : 'error.light';
  return (
    <>
      <Box className="registerBox">
        <Typography variant="h4">
          {chrome.i18n.getMessage('Pick__Your')}
          <Box display="inline" color="primary.main">
            {chrome.i18n.getMessage('Username')}
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Your__username__will__be__used__to__send__and__receive')}
        </Typography>

        <Box sx={{ flexGrow: 1, width: 640, maxWidth: '100%', my: '40px' }}>
          <FormControl sx={{ width: '100%' }}>
            <Input
              id="textfield"
              autoComplete="nickname"
              className={classes.inputBox}
              placeholder={chrome.i18n.getMessage('Username')}
              autoFocus
              fullWidth
              disableUnderline
              // Making uncontrolled component
              defaultValue={username}
              onChange={handleUsernameChange}
              startAdornment={
                <InputAdornment position="start">
                  <img src={EmailIcon} />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    sx={{ color: '#e3e3e3', padding: '0px' }}
                    onClick={handleClearUsername}
                  >
                    <CancelIcon size={24} color={'#E3E3E3'} />
                  </IconButton>
                </InputAdornment>
              }
            />
            <SlideRelative direction="down" show={!!username}>
              <Box
                sx={{
                  width: '95%',
                  backgroundColor: msgBgColor,
                  mx: 'auto',
                  borderRadius: '0 0 12px 12px',
                }}
              >
                <Box sx={{ p: '4px' }}>
                  {!errorMessage && isLoading && usernameLoading}
                  {!errorMessage && !isLoading && usernameCorrect}
                  {errorMessage && usernameError(errorMessage)}
                </Box>
              </Box>
            </SlideRelative>
          </FormControl>
        </Box>

        <Button
          onClick={() => {
            handleSwitchTab();
          }}
          disabled={!usernameValid}
          variant="contained"
          color="secondary"
          size="large"
          sx={{
            height: '56px',
            borderRadius: '12px',
            textTransform: 'capitalize',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
            {chrome.i18n.getMessage('Next')}
          </Typography>
        </Button>
      </Box>
    </>
  );
};

export default PickUsername;
