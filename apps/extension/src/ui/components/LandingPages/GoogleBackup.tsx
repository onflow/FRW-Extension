import InfoIcon from '@mui/icons-material/Info';
import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';
import React, { useState } from 'react';

import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import { LLSpinner } from '@/ui/components';
import IconGoogleDrive from '@/ui/components/iconfont/IconGoogleDrive';
import SlideRelative from '@/ui/components/SlideRelative';
import { useWallet } from '@/ui/hooks/use-wallet';

interface GoogleBackupProps {
  handleSwitchTab: () => void;
  mnemonic: string;
  username: string;
  password: string;
}

const GoogleBackup: React.FC<GoogleBackupProps> = ({
  handleSwitchTab,
  mnemonic,
  username,
  password,
}) => {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [backupErr, setBackupErr] = useState(false);

  const handleBackup = async () => {
    try {
      setLoading(true);
      setBackupErr(false);

      await wallet.uploadMnemonicToGoogleDrive(mnemonic, username, password);
      // No error thrown
      handleSwitchTab();
    } catch (e) {
      consoleError(e);
      setBackupErr(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="registerBox">
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
          borderRadius: '12px',
          mt: '32px',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#333333',
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
            <span style={{ fontWeight: 'bold' }}>{chrome.i18n.getMessage('Google__Drive')}</span>
            {chrome.i18n.getMessage('to_back_up_your_wallet')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <SlideRelative direction="down" show={backupErr}>
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
          <InfoIcon fontSize="medium" color="primary" style={{ margin: '0px 12px auto 12px' }} />
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '12px' }}>
            {chrome.i18n.getMessage('Backup_failed_you_may_still_conduct_backup_inside_extension')}
          </Typography>
        </Box>
      </SlideRelative>

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
          gap: '12px',
        }}
      >
        {loading ? (
          <>
            <LLSpinner size={28} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
              {chrome.i18n.getMessage('Creating_back_up')}
            </Typography>
          </>
        ) : (
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
            {chrome.i18n.getMessage('Connect_and_Back_up')}
          </Typography>
        )}
      </Button>

      <Button
        onClick={handleSwitchTab}
        sx={{
          cursor: 'pointer',
          textAlign: 'center',
          backgroundColor: '#333333',
          height: '56px',
          borderRadius: '12px',
          textTransform: 'capitalize',
        }}
      >
        <Typography variant="subtitle1" color="#E6E6E6" sx={{ fontWeight: 'bold' }}>
          {chrome.i18n.getMessage('Maybe_Next_Time')}
        </Typography>
      </Button>
    </Box>
  );
};

export default GoogleBackup;
