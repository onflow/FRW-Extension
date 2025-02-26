import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyIcon from '@mui/icons-material/Key';
import {
  Typography,
  List,
  ListItemText,
  ListItemIcon,
  ListItem,
  ListItemButton,
  Divider,
  Box,
} from '@mui/material';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { LLHeader } from '@/ui/FRWComponent/LLHeader';
import { usePasskey } from '@/ui/hooks/usePasskey';
import { useWallet } from '@/ui/utils';

import IconEnd from '../../../components/iconfont/IconAVector11Stroke';

const PasskeySettings = () => {
  const wallet = useWallet();
  const { isSupported, isEnabled, checkPasskeyStatus } = usePasskey();

  useEffect(() => {
    wallet.setDashIndex(3);
    checkPasskeyStatus();
  }, [wallet, checkPasskeyStatus]);

  return (
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Passkey_Authentication')} help={false} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}
      >
        {!isSupported ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Passkeys Not Supported
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your browser or device doesn't support passkeys. This feature requires a compatible
              browser and platform authenticator.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              To use passkeys, you need:
            </Typography>
            <List>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText primary="• A modern browser like Chrome, Safari, or Edge" />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText primary="• A device with biometric authentication (Touch ID, Face ID, or Windows Hello)" />
              </ListItem>
            </List>
          </Box>
        ) : (
          <>
            <List sx={{ paddingTop: '0px', paddingBottom: '0px' }}>
              <ListItem
                button
                component={Link}
                to={
                  isEnabled
                    ? '/dashboard/setting/passkey-management'
                    : '/dashboard/setting/passkey-setup'
                }
                disablePadding
              >
                <ListItemButton>
                  <ListItemIcon sx={{ minWidth: '40px' }}>
                    <KeyIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={isEnabled ? 'Manage Passkeys' : 'Set Up Passkey'}
                    secondary={
                      isEnabled
                        ? 'View, recreate, or remove your passkeys'
                        : "Sign in without passwords using your device's authentication"
                    }
                  />
                  <ListItemIcon aria-label="end" sx={{ minWidth: '25px' }}>
                    <IconEnd size={12} />
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
            </List>
            <Divider />

            {isEnabled && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Passkeys provide a more secure and convenient way to sign in to your wallet
                  without entering your password.
                </Typography>
                <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                  ✓ Passkey is set up and ready to use
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </div>
  );
};

export default PasskeySettings;
