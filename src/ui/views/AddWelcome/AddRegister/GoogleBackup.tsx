import React, { useState } from 'react';
import { Box, ThemeProvider } from '@mui/system';
import {
  Button,
  Typography,
  CssBaseline
} from '@mui/material';
import theme from '../../../style/LLTheme';
import { useWallet } from 'ui/utils';
import IconGoogleDrive from '../../../../components/iconfont/IconGoogleDrive';
import { LLSpinner } from 'ui/FRWComponent';
import InfoIcon from '@mui/icons-material/Info';
import { Presets } from 'react-component-transition';

const GoogleBackup = ({ handleClick, mnemonic, username, password }) => {
  const wallets = useWallet();
  const [loading, setLoading] = useState(false);
  const [backupErr, setBackupErr] = useState(false);

  const handleBackup = () => {
    try {
      setLoading(true);
      setBackupErr(false);
      wallets.uploadMnemonicToGoogleDrive(mnemonic, username, password).then(() => {
        setLoading(false);
        handleClick();
      }).catch(() => {
        setLoading(false);
        setBackupErr(true);
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="registerBox"
      >
        <Typography variant="h4">
          {chrome.i18n.getMessage('Create')}
          <Box display="inline" color="primary.main">
            {chrome.i18n.getMessage('Back_up')}
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Back_up_your_wallet_to_Google_Drive_for_easy_access')}
        </Typography>

        <Box
          sx={{
            // border: '2px solid #5E5E5E',
            borderRadius: '12px',
            mt: '32px',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#333333'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              height: '32px',
              width: '108px',
              backgroundColor: 'success.main',
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: '32px',
              borderBottomLeftRadius: '12px',
            }}
          >
            {chrome.i18n.getMessage('Recommend')}
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              my: '24px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconGoogleDrive size={36} style={{ marginBottom: '12px' }} />
            <Typography variant="body1" sx={{ color: '#fff' }}>
              {chrome.i18n.getMessage('Connect__To')}
              <Typography
                display="inline"
                sx={{ fontWeight: 'bold' }}
                variant="body1"
              >
                {chrome.i18n.getMessage('Google__Drive')}
              </Typography>
              {chrome.i18n.getMessage('to_back_up_your_wallet')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        {backupErr &&
          <Presets.TransitionSlideUp>
            <Box
              sx={{
                width: '95%',
                backgroundColor: 'error.light',
                mx: 'auto',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                py: '8px',
                marginBottom: '-8px',
              }}
            >
              {/* <CardMedia style={{ color:'#E54040', width:'24px',height:'24px', margin: '0 12px 0' }} image={empty} />   */}
              <InfoIcon fontSize='medium' color='primary' style={{ margin: '0px 12px auto 12px' }} />
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '12px' }}>
                {chrome.i18n.getMessage('Backup_failed_you_may_still_conduct_backup_inside_extension')}
              </Typography>
            </Box>
          </Presets.TransitionSlideUp>
        }
        <Button
          onClick={handleBackup}
          disabled={loading}
          variant="contained"
          color="secondary"
          size="large"
          sx={{
            height: '56px',
            borderRadius: '12px',
            textTransform: 'capitalize',
            display: 'flex',
            gap: '12px'
          }}
        >
          {loading ? (
            <>
              <LLSpinner size={28} />
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold' }}
                color="background.paper"
              >
                {chrome.i18n.getMessage('Creating_back_up')}
              </Typography>
            </>
          ) : (
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'bold' }}
              color="background.paper"
            >
              {chrome.i18n.getMessage('Connect_and_Back_up')}
            </Typography>
          )}
        </Button>

        <Button
          onClick={() => {
            handleClick();
          }}

          sx={{

            cursor: 'pointer',
            textAlign: 'center',
            backgroundColor: '#333333',
            height: '56px',
            borderRadius: '12px',
            textTransform: 'capitalize',

          }}

        >
          <Typography
            variant="subtitle1"
            color="#E6E6E6"
            sx={{ fontWeight: 'bold' }}
          >
            {chrome.i18n.getMessage('Maybe_Next_Time')}
          </Typography>
        </Button>
      </Box>
    </ThemeProvider>
  );
};

export default GoogleBackup;
