import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DevicesIcon from '@mui/icons-material/Devices';
import KeyIcon from '@mui/icons-material/Key';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { useWallet } from '@/ui/utils';
import { usePasskey } from '@/ui/utils/usePasskey';

import { SuccessDialog } from '../../FRWComponent/Dialog';
import { LLHeader } from '../../FRWComponent/LLHeader';
import WarningSnackbar from '../../FRWComponent/WarningSnackbar';
const useStyles = makeStyles(() => ({
  container: {
    padding: '12px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  title: {
    fontWeight: 600,
    marginBottom: '4px',
    fontSize: '18px',
    color: '#fff',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '12px',
    fontSize: '13px',
  },
  card: {
    borderRadius: '12px',
    marginBottom: '12px',
    backgroundColor: '#2C2C2C',
    color: '#fff',
  },
  cardContent: {
    padding: '12px !important',
  },
  benefitsList: {
    marginBottom: '12px',
    padding: '0',
  },
  benefitItem: {
    marginBottom: '2px',
    padding: '2px 0',
  },
  setupButton: {
    padding: '8px',
    borderRadius: '12px',
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  passkeyIcon: {
    width: '32px',
    height: '32px',
    backgroundColor: '#3A3A3A',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '10px',
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  statusSwitch: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '8px',
  },
  passwordField: {
    marginTop: '8px',
    marginBottom: '8px',
    width: '100%',
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#282828',
      color: '#fff',
      '& fieldset': {
        borderColor: '#4C4C4C',
      },
      '&:hover fieldset': {
        borderColor: '#6C6C6C',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1976d2',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '14px',
    },
    '& .MuiFormHelperText-root': {
      color: '#f44336',
      marginTop: '2px',
      fontSize: '12px',
    },
  },
  benefitPrimary: {
    color: '#fff !important',
    fontSize: '14px !important',
  },
  benefitSecondary: {
    color: 'rgba(255, 255, 255, 0.7) !important',
    fontSize: '12px !important',
  },
  listItemIcon: {
    minWidth: '36px',
  },
}));

const PasskeySetup: React.FC = () => {
  const classes = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [passkeyEnabled, setPasskeyEnabled] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const history = useHistory();
  const wallet = useWallet();

  // Use our new passkey hook
  const { isSupported: isPasskeySupported, isEnabled, checkPasskeyStatus } = usePasskey();

  // Update local state when passkey status changes
  useEffect(() => {
    setPasskeyEnabled(isEnabled);
  }, [isEnabled]);

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setPasswordError('');
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validatePassword = async () => {
    if (!password) {
      setPasswordError('Password is required to set up a passkey');
      return false;
    }

    try {
      // Verify the password is correct
      await wallet.verifyPassword(password);
      return true;
    } catch (error) {
      setPasswordError('Incorrect password. Please try again.');
      return false;
    }
  };

  const handleSetupPasskey = async () => {
    try {
      // First validate the password
      const isPasswordValid = await validatePassword();
      if (!isPasswordValid) {
        return;
      }

      setIsLoading(true);
      setShowError(false);

      // Create a new passkey using WebAuthn in the UI context
      // Generate a random challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Get user info from wallet controller
      const userInfo = await wallet.getUserInfo(false);
      if (!userInfo || !userInfo.username) {
        throw new Error('User information not available');
      }

      // Get the domain for the RP ID - use the effective domain
      const rpId = window.location.hostname;

      // Create credential options
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'FRW Extension Wallet',
          id: rpId,
        },
        user: {
          id: new TextEncoder().encode(userInfo.username),
          name: userInfo.username,
          displayName: userInfo.nickname || userInfo.username,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required',
        },
        timeout: 60000,
        attestation: 'none',
      };

      try {
        // Create credential in the UI context
        const credential = (await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions,
        })) as PublicKeyCredential;

        if (!credential) {
          throw new Error('Failed to create passkey');
        }

        // Extract credential data to send to the background
        const credentialId = credential.id;
        const rawId = Buffer.from(credential.rawId).toString('base64');

        // Register the credential with the wallet service in the background
        // Pass the password for encryption
        const success = await wallet.registerPasskeyCredential(credentialId, rawId, password);

        if (success) {
          setPasskeyEnabled(true);
          setShowSuccessDialog(true);
          // Refresh passkey status
          checkPasskeyStatus();
        } else {
          setError('Failed to register passkey with wallet. Please try again.');
          setShowError(true);
        }
      } catch (credentialError: any) {
        console.error('Error creating credential:', credentialError);

        // Provide more specific error messages based on the error
        if (credentialError.name === 'NotAllowedError') {
          setError('Permission denied. You may have cancelled the request.');
        } else if (credentialError.name === 'SecurityError') {
          setError('Security error. Operation not allowed in this context.');
        } else {
          setError(`Failed to create passkey: ${credentialError.message || 'Unknown error'}`);
        }
        setShowError(true);
      }
    } catch (error) {
      console.error('Error setting up passkey:', error);
      setError('An error occurred while trying to set up passkey.');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPasskeySupported) {
    return (
      <Box className={classes.container} sx={{ backgroundColor: '#1A1A1A' }}>
        <LLHeader title={chrome.i18n.getMessage('Passkey_Authentication')} help={false} />

        <Typography variant="h5" className={classes.title}>
          Passkeys Not Supported
        </Typography>
        <Typography variant="body1" className={classes.subtitle}>
          Your browser or device doesn't support passkeys.
        </Typography>
        <Card className={classes.card}>
          <CardContent className={classes.cardContent}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              To use passkeys, you need:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="A modern browser like Chrome, Safari, or Edge"
                  primaryTypographyProps={{ className: classes.benefitPrimary }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="A device with biometric authentication"
                  primaryTypographyProps={{ className: classes.benefitPrimary }}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Passkey_Authentication')} help={false} />
      <Box className={classes.container} sx={{ backgroundColor: '#1A1A1A' }}>
        <Card className={classes.card}>
          <CardContent className={classes.cardContent}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              gutterBottom
              sx={{ color: '#fff', fontSize: '15px' }}
            >
              Benefits of Passkeys
            </Typography>

            <List className={classes.benefitsList} dense>
              <ListItem className={classes.benefitItem}>
                <ListItemIcon className={classes.listItemIcon}>
                  <SecurityIcon sx={{ color: '#4CAF50', fontSize: '20px' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Enhanced Security"
                  secondary="Protection against phishing"
                  primaryTypographyProps={{ className: classes.benefitPrimary }}
                  secondaryTypographyProps={{ className: classes.benefitSecondary }}
                />
              </ListItem>

              <ListItem className={classes.benefitItem}>
                <ListItemIcon className={classes.listItemIcon}>
                  <SpeedIcon sx={{ color: '#2196F3', fontSize: '20px' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Faster Login"
                  secondary="Use biometric authentication"
                  primaryTypographyProps={{ className: classes.benefitPrimary }}
                  secondaryTypographyProps={{ className: classes.benefitSecondary }}
                />
              </ListItem>

              <ListItem className={classes.benefitItem}>
                <ListItemIcon className={classes.listItemIcon}>
                  <DevicesIcon sx={{ color: '#9C27B0', fontSize: '20px' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Cross-device Support"
                  secondary="Use across compatible browsers"
                  primaryTypographyProps={{ className: classes.benefitPrimary }}
                  secondaryTypographyProps={{ className: classes.benefitSecondary }}
                />
              </ListItem>
            </List>

            <Divider sx={{ backgroundColor: '#4C4C4C' }} />

            {!passkeyEnabled && (
              <>
                <Typography
                  variant="body2"
                  sx={{ mt: 2, mb: 1, color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}
                >
                  Enter your current wallet password:
                </Typography>

                <TextField
                  className={classes.passwordField}
                  label="Current Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  error={!!passwordError}
                  helperText={passwordError}
                  fullWidth
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={toggleShowPassword}
                          edge="end"
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                          size="small"
                        >
                          {showPassword ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </>
            )}

            {!passkeyEnabled && (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                className={classes.setupButton}
                onClick={handleSetupPasskey}
                disabled={isLoading || !password}
                size="small"
                sx={{ marginTop: '12px' }}
              >
                {isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <>
                    <KeyIcon fontSize="small" /> Set Up Passkey
                  </>
                )}
              </Button>
            )}

            {passkeyEnabled && (
              <>
                <Typography
                  variant="body2"
                  color="success.main"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mt: 2,
                    fontWeight: 500,
                    fontSize: '13px',
                  }}
                >
                  <CheckCircleIcon sx={{ mr: 1 }} fontSize="small" />
                  Passkey is set up and ready to use
                </Typography>

                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  component={Link}
                  to="/dashboard/setting/passkey-management"
                  sx={{ mt: 2 }}
                  size="small"
                >
                  Manage Passkeys
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <SuccessDialog
          open={showSuccessDialog}
          title="Passkey Created Successfully"
          message="You can now use this passkey to sign in to your wallet quickly and securely."
          onClose={() => setShowSuccessDialog(false)}
        />

        <WarningSnackbar open={showError} message={error} onClose={() => setShowError(false)} />
      </Box>
    </div>
  );
};

export default PasskeySetup;
