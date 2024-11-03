import React, { useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, ThemeProvider } from '@mui/system';
import {
  Button,
  Typography,
  FormControl,
  Input,
  InputAdornment,
  CssBaseline,
} from '@mui/material';
import CancelIcon from '../../../../components/iconfont/IconClose';
import CheckCircleIcon from '../../../../components/iconfont/IconCheckmark';
import theme from '../../../style/LLTheme';
import EmailIcon from '../../../assets/alternate-email.svg';
import { Presets } from 'react-component-transition';
import { useWallet } from 'ui/utils';
import { CircularProgress, IconButton } from '@mui/material';


const useStyles = makeStyles((theme) => ({
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

const PickUsername = ({ handleClick, savedUsername, getUsername }) => {
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
        {errorMsg.startsWith('This username is reserved') && <span><a href='mailto: hi@lilico.app'>hi@lilico.app</a>{chrome.i18n.getMessage('for__any__inquiry')}</span>}
      </Typography>
    </Box>
  );
  const usernameCorrect = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CheckCircleIcon size={24} color="#41CC5D" style={{ margin: '8px', }} />
      <Typography variant="body1" color="success.main">
        {chrome.i18n.getMessage('Sounds_good')}
      </Typography>
    </Box>
  );
  const usernameLoading = () => (
    <Typography
      variant="body1"
      color="text.secondary"
      sx={{ display: 'flex', alignItems: 'center' }}
    >
      <CircularProgress
        color="primary"
        size={22}
        style={{ fontSize: '22px', margin: '8px' }}
      />
      {chrome.i18n.getMessage('Checking')}
    </Typography>
  );

  const [username, setUsername] = useState(savedUsername || '');
  const [helperText, setHelperText] = useState(<div />);

  const regex = /^[A-Za-z0-9]{3,15}$/;

  const setErrorMessage = (message: string) => {
    setLoading(false);
    setUsernameValid(false);
    setHelperText(usernameError(message));
  };

  useEffect(() => {
    setUsernameValid(false);
    setHelperText(usernameLoading);
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {

      if (username.length < 3) {
        setErrorMessage(chrome.i18n.getMessage('Too__short'));
        return;
      }

      if (username.length > 15) {
        setErrorMessage(chrome.i18n.getMessage('Too__long'));
        return;
      }

      if (!regex.test(username)) {
        setErrorMessage(
          chrome.i18n.getMessage('Your__username__can__only__contain__letters__and__numbers')
        );
        return;
      }
      wallet.openapi
        .checkUsername(username.toLowerCase())
        .then((response) => {
          setLoading(false);
          if (response.data.username != username.toLowerCase()) {
            setLoading(false);
            return;
          }
          if (response.data.unique) {
            setUsernameValid(true);
            setHelperText(usernameCorrect);
          } else {
            if (response.message == 'Username is reserved') {
              setErrorMessage(chrome.i18n.getMessage('This__username__is__reserved__Please__contact'))
            } else {
              setErrorMessage(chrome.i18n.getMessage('This__name__is__taken'));
            }
          }
        })
        .catch((error) => {
          setErrorMessage(chrome.i18n.getMessage('Oops__unexpected__error'));
        });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [username]);

  const msgBgColor = () => {
    if (isLoading) {
      return 'neutral.light';
    }
    return usernameValid ? 'success.light' : 'error.light';
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="registerBox"
      >
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
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
              }}
              startAdornment={
                <InputAdornment position="start">
                  <img src={EmailIcon} />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    sx={{ color: '#e3e3e3', padding: '0px' }}
                    onClick={() => {
                      setUsername('');
                    }}
                  >
                    <CancelIcon size={24} color={'#E3E3E3'} />
                  </IconButton>
                </InputAdornment>
              }
            />
            <Presets.TransitionSlideUp>
              {username && (
                <Box
                  sx={{
                    width: '95%',
                    backgroundColor: msgBgColor(),
                    mx: 'auto',
                    borderRadius: '0 0 12px 12px',
                  }}
                >
                  <Box sx={{ p: '4px' }}>{helperText}</Box>
                </Box>
              )}
            </Presets.TransitionSlideUp>
          </FormControl>
        </Box>

        <Button
          onClick={() => {
            handleClick();
            getUsername(username);
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
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 'bold' }}
            color="background.paper"
          >
            {chrome.i18n.getMessage('Next')}
          </Typography>
        </Button>
      </Box>
    </ThemeProvider>
  );
};

export default PickUsername;
