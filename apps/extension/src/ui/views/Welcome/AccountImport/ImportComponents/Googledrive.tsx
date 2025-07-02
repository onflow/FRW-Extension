import { Box, Button, Typography } from '@mui/material';
import React, { useState } from 'react';

import { consoleError } from '@/shared/utils/console-log';
import { LLSpinner } from '@/ui/components';
import BrowserWarning from '@/ui/components/BrowserWarning';
import IconGoogleDrive from '@/ui/components/iconfont/IconGoogleDrive';
import { useWallet } from '@/ui/utils/WalletContext';

const Googledrive = ({ setErrorMessage, setShowError, handleGoogleAccountsFound }) => {
  const wallets = useWallet();

  const [loading, setLoading] = useState(false);

  const getGoogle = async () => {
    setLoading(true);

    try {
      const accounts = await wallets.loadBackupAccounts();

      localStorage.setItem('backupAccounts', JSON.stringify(accounts));

      if (accounts.length > 0) {
        handleGoogleAccountsFound(accounts);
      } else {
        setShowError(true);
        setErrorMessage(chrome.i18n.getMessage('No__backup__found'));
      }
    } catch (e) {
      consoleError(e);
      setShowError(true);
      setErrorMessage(chrome.i18n.getMessage('Something__is__wrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: '0' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#2C2C2C',
          borderRadius: '16px',
          py: '40px',
        }}
      >
        <IconGoogleDrive
          style={{
            backgroundColor: '#fff',
            width: '73px',
            height: '73px',
            padding: '8px',
            borderRadius: '73px',
          }}
        />
        <Typography
          variant="body1"
          color="text.primary"
          sx={{ fontSize: '18px', paddingTop: '18px', fontWeight: '700' }}
        >
          {chrome.i18n.getMessage('Restore__Backup__from__Google__Drive')}
        </Typography>
        <Button
          className="registerButton"
          variant="contained"
          color="success"
          size="large"
          sx={{
            px: '24px',
            py: '12px',
            marginBottom: '15px',
            borderRadius: '12px',
            textTransform: 'none',
            boxShadow: '0px 24px 24px rgba(0,0,0,0.36)',
            mt: '36px',
            width: '404px',
          }}
          onClick={getGoogle}
          startIcon={loading && <LLSpinner size={20} />}
        >
          <Typography variant="body1" sx={{ color: '#222', fontSize: '20px', fontWeight: '600' }}>
            {chrome.i18n.getMessage('Connect')}
          </Typography>
        </Button>
        <BrowserWarning />
      </Box>
    </Box>
  );
};

export default Googledrive;
