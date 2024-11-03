import React, { useEffect, useState } from 'react';
import { Box, ThemeProvider } from '@mui/system';
import { makeStyles } from '@mui/styles';
import {
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  Snackbar,
  Alert,
  CssBaseline
} from '@mui/material';
import theme from '../../style/LLTheme';
import { Presets } from 'react-component-transition';
import { useWallet } from 'ui/utils';
import CancelIcon from '../../../components/iconfont/IconClose';
import CheckCircleIcon from '../../../components/iconfont/IconCheckmark';
import * as bip39 from 'bip39';
import { LLNotFound, LLSpinner } from 'ui/FRWComponent';
import { storage } from '@/background/webapi';
import SeedPhrase from './ImportComponent/SeedPhrase';
import PrivateKey from './ImportComponent/PrivateKey';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={0}>
          {children}
        </Box>
      )}
    </div>
  );
}

const useStyles = makeStyles((theme) => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  sxStyles: {
    fontFamily: 'Inter',
    fontSize: '18px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '24px',
    letterSpacing: '-0.252px',
    textTransform: 'capitalize'
  },
  inputBox: {
    height: '128px',
    padding: '16px',
    paddingTop: '0px',
    zIndex: '999',
    overflow: 'scroll',
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

const ImportRecoveryPhrase = ({ handleClick, confirmMnemonic, confirmPk, setUsername }) => {
  const classes = useStyles();
  const wallet = useWallet();

  const [mnemonicValid, setMnemonicValid] = useState(true);

  const [mnemonic, setMnemonic] = useState('');

  const [pk, setPk] = useState('');

  const [isSignLoading, setSignLoading] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showError, setShowError] = useState(false);

  const [helperText, setHelperText] = useState(<div />);
  const [selectedTab, setSelectedTab] = useState(0);

  const signIn = async () => {
    setSignLoading(true);
    if (mnemonic) {
      signMnemonic();
    } else {
      signPk();
    }
  };

  const signMnemonic= async () => {
    try {
      const result = await wallet.signInWithMnemonic(mnemonic);
      setSignLoading(false);
      confirmMnemonic(mnemonic);
      const userInfo = await wallet.getUserInfo(true);
      setUsername(userInfo.username)
      handleClick();
    } catch (error) {
      setSignLoading(false);
      if (error.message === 'NoUserFound') {
        setShowDialog(true)
      } else {
        setShowError(true);
      }
    }
  };

  

  const signPk= async () => {
    const privateKey = pk.replace(/^0x/, '');
    try {
      const result = await wallet.signInWithPrivatekey(privateKey);
      setSignLoading(false);
      confirmPk(privateKey);
      const userInfo = await wallet.getUserInfo(true);
      setUsername(userInfo.username)
      handleClick();
    } catch (error) {
      setSignLoading(false);
      if (error.message === 'NoUserFound') {
        setShowDialog(true)
      } else {
        setShowError(true);
      }
    }
  };

  const mnemonicError = (errorMsg) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CancelIcon size={24} color={'#E54040'} style={{ margin: '8px' }} />
      <Typography variant="body1" color="text.error">
        {errorMsg}
      </Typography>
    </Box>
  );

  const mnemonicCorrect = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CheckCircleIcon size={24} color={'#41CC5D'} style={{ margin: '8px' }} />
      <Typography variant="body1" color="success.main">
        {chrome.i18n.getMessage('Recovery__phrase__valid')}
      </Typography>
    </Box>
  );

  const privateCorrect = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CheckCircleIcon size={24} color={'#41CC5D'} style={{ margin: '8px' }} />
      <Typography variant="body1" color="success.main">
        {chrome.i18n.getMessage('Private__key_valid')}
      </Typography>
    </Box>
  );

  const mnemonicLoading = () => (
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

  const renderSnackBar = () => {
    return (
      <Snackbar
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={showError}
        onClose={() => setShowError(false)}
      >
        <Alert variant="filled" severity="error" onClose={() => { setShowError(false) }}>Something went wrong, please try again later</Alert>
      </Snackbar>
    );
  }

  useEffect(() => {
    setMnemonicValid(false);
    setHelperText(mnemonicLoading);
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      setLoading(false);
      const length = mnemonic.trim().split(/\s+/g).length;
      if (!(length == 12 || length == 24)) {
        setErrorMessage(chrome.i18n.getMessage('Recovery__phrases__word__count__must__be__12__or__24__words'));
        return;
      }

      const formatted = mnemonic.trim().split(/\s+/g).join(' ');
      if (!bip39.validateMnemonic(formatted)) {
        setErrorMessage(chrome.i18n.getMessage('Mnemonic__phrase__is__invalid'));
        return;
      }

      setMnemonicValid(true);
      setHelperText(mnemonicCorrect);
      storage.set('premnemonic', formatted);
      setMnemonic(formatted);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [mnemonic]);

  useEffect(() => {
    setMnemonicValid(false);
    setHelperText(mnemonicLoading);
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      setLoading(false);
      const hexRegex = /^(0x)?[0-9a-fA-F]{64}$/;
      const isvalid = hexRegex.test(pk);
      if (isvalid) {
        setMnemonicValid(true);
        setHelperText(privateCorrect);
        return;
      } else {
        setErrorMessage(chrome.i18n.getMessage('Private__is__invalid'));
        return;
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [pk]);

  const setErrorMessage = (message: string) => {
    setLoading(false);
    setMnemonicValid(false);
    setHelperText(mnemonicError(message));
  };

  const msgBgColor = () => {
    if (isLoading) {
      return 'neutral.light';
    }
    return mnemonicValid ? 'success.light' : 'error.light';
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!showDialog ?
        <Box
          className="registerBox"
        >
          <Typography variant="h4">
            {chrome.i18n.getMessage('Sign__in__with')}
            <Box display="inline" color="primary.main">
              {chrome.i18n.getMessage('Sign__in__Recovery__Phrase')}
            </Box>
          </Typography>


          <Tabs value={selectedTab} onChange={handleTabChange} aria-label="simple tabs example" sx={{ padding: '0' }}>
            <Tab className={classes.sxStyles} label={chrome.i18n.getMessage('Seed_Phrase')} />
            <Tab className={classes.sxStyles} label={chrome.i18n.getMessage('Private_Key')} />
          </Tabs>
          <TabPanel sx={{ padding: '0' }} value={selectedTab} index={0}>
            <SeedPhrase helperText={helperText} msgBgColor={msgBgColor} mnemonic={mnemonic} setmnemonic={setMnemonic} />
          </TabPanel>
          <TabPanel sx={{ padding: '0' }} value={selectedTab} index={1}>
            <PrivateKey helperText={helperText} msgBgColor={msgBgColor} pk={pk} setpk={setPk} />
          </TabPanel>

          <Button
            className="registerButton"
            onClick={signIn}
            variant="contained"
            color="secondary"
            size="large"
            sx={{
              height: '56px',
              width: '640px',
              borderRadius: '12px',
              textTransform: 'capitalize',
              gap: '12px',
              display: 'flex'
            }}
            disabled={
              isSignLoading ? true : !mnemonicValid
            }
          >
            {isSignLoading && <LLSpinner size={28} />}
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'bold' }}
              color="background.paper"
            >
              {chrome.i18n.getMessage('Next')}
            </Typography>
          </Button>

          {renderSnackBar()}
        </Box>
        :
        <LLNotFound setShowDialog={setShowDialog} />}
    </ThemeProvider>
  );
};

export default ImportRecoveryPhrase;
