import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
import RefreshIcon from '@mui/icons-material/Refresh';
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
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import dayjs from 'dayjs';
import React, { useState, useEffect, useCallback } from 'react';

import { usePasskey } from '@/ui/hooks/usePasskey';
import { useWallet } from '@/ui/utils';

import { SuccessDialog } from './Dialog';
import WarningSnackbar from './WarningSnackbar';

const useStyles = makeStyles(() => ({
  container: {
    padding: '16px',
    maxWidth: '368px', // 400px - 16px padding on each side
    margin: '0 auto',
  },
  title: {
    fontWeight: 600,
    marginBottom: '12px',
    fontSize: '20px',
  },
  subtitle: {
    color: '#666',
    marginBottom: '16px',
    fontSize: '14px',
  },
  card: {
    borderRadius: '12px',
    marginBottom: '16px',
  },
  cardContent: {
    padding: '16px !important',
  },
  passkeyIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#f5f5f5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  },
  actionButton: {
    padding: '10px',
    borderRadius: '12px',
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  passwordField: {
    marginTop: '12px',
    marginBottom: '12px',
    width: '100%',
  },
  noPasskeysMessage: {
    textAlign: 'center',
    padding: '16px',
    color: '#666',
  },
  listItem: {
    borderRadius: '8px',
    marginBottom: '4px',
    padding: '4px 8px',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  createdDate: {
    fontSize: '12px',
    color: '#666',
  },
}));

interface PasskeyInfo {
  id: string;
  rawId: string;
  createdAt: string;
}

const PasskeyManagement: React.FC = () => {
  const classes = useStyles();
  const wallet = useWallet();
  const { isSupported, isEnabled, checkPasskeyStatus } = usePasskey();

  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Password for recreating passkey
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recreateDialogOpen, setRecreateDialogOpen] = useState(false);
  const [selectedPasskey, setSelectedPasskey] = useState<PasskeyInfo | null>(null);

  // Load passkeys
  const loadPasskeys = useCallback(async () => {
    try {
      setIsLoading(true);
      const passkeyInfo = await wallet.getAvailablePasskeys();
      setPasskeys(passkeyInfo || []);
    } catch (error) {
      console.error('Error loading passkeys:', error);
      setError('Failed to load passkeys. Please try again.');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    loadPasskeys();
  }, [loadPasskeys]);

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setPasswordError('');
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const validatePassword = async () => {
    if (!password) {
      setPasswordError('Password is required');
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

  // Handle delete passkey
  const handleDeletePasskey = async () => {
    if (!selectedPasskey) return;

    try {
      setIsLoading(true);
      const success = await wallet.deletePasskey(selectedPasskey.id);

      if (success) {
        setSuccessMessage('Passkey deleted successfully');
        setShowSuccessDialog(true);
        await loadPasskeys();
        await checkPasskeyStatus();
      } else {
        setError('Failed to delete passkey. Please try again.');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error deleting passkey:', error);
      setError('An error occurred while deleting the passkey. Please try again.');
      setShowError(true);
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // Handle recreate passkey
  const handleRecreatePasskey = async () => {
    try {
      // First validate the password
      const isPasswordValid = await validatePassword();
      if (!isPasswordValid) {
        return;
      }

      setIsLoading(true);

      // Delete existing passkeys
      for (const passkey of passkeys) {
        await wallet.deletePasskey(passkey.id);
      }

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
        const success = await wallet.registerPasskeyCredential(credentialId, rawId, password);

        if (success) {
          setSuccessMessage('Passkey recreated successfully');
          setShowSuccessDialog(true);
          await loadPasskeys();
          await checkPasskeyStatus();
        } else {
          setError('Failed to register new passkey. Please try again.');
          setShowError(true);
        }
      } catch (credentialError: any) {
        console.error('Error creating credential:', credentialError);

        // Provide more specific error messages based on the error
        if (credentialError.name === 'NotAllowedError') {
          setError(
            'Permission denied. You may have cancelled the passkey creation or your device denied the request.'
          );
        } else if (credentialError.name === 'SecurityError') {
          setError(
            'Security error. The operation is not allowed in this context or with these parameters.'
          );
        } else {
          setError(`Failed to create passkey: ${credentialError.message || 'Unknown error'}`);
        }
        setShowError(true);
      }
    } catch (error) {
      console.error('Error recreating passkey:', error);
      setError('An error occurred while recreating the passkey. Please try again.');
      setShowError(true);
    } finally {
      setIsLoading(false);
      setRecreateDialogOpen(false);
      setPassword('');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return dayjs(dateString).format('MMM D, YYYY h:mm A');
    } catch (error) {
      return dateString;
    }
  };

  if (!isSupported) {
    return (
      <Box className={classes.container}>
        <Typography variant="h5" className={classes.title}>
          Passkeys Not Supported
        </Typography>
        <Typography variant="body1" className={classes.subtitle}>
          Your browser or device doesn't support passkeys. This feature requires a compatible
          browser and platform authenticator.
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      <Box className={classes.headerContainer}>
        <Box className={classes.passkeyIcon}>
          <KeyIcon sx={{ fontSize: 32, color: '#1976d2' }} />
        </Box>
        <div>
          <Typography variant="h5" className={classes.title}>
            Manage Passkeys
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View, recreate, or remove passkeys for your wallet
          </Typography>
        </div>
      </Box>

      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Your Passkeys
          </Typography>

          {isLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : passkeys.length === 0 ? (
            <Box className={classes.noPasskeysMessage}>
              <Typography variant="body1" gutterBottom>
                You don't have any passkeys set up yet.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => (window.location.href = '/dashboard/setting/passkey-setup')}
                sx={{ mt: 2 }}
              >
                Set Up Passkey
              </Button>
            </Box>
          ) : (
            <>
              <List>
                {passkeys.map((passkey) => (
                  <ListItem key={passkey.id} className={classes.listItem}>
                    <ListItemIcon>
                      <KeyIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Passkey ${passkey.id.substring(0, 8)}...`}
                      secondary={
                        <span className={classes.createdDate}>
                          Created: {formatDate(passkey.createdAt)}
                        </span>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
                          setSelectedPasskey(passkey);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Button
                variant="outlined"
                color="primary"
                fullWidth
                className={classes.actionButton}
                startIcon={<RefreshIcon />}
                onClick={() => setRecreateDialogOpen(true)}
              >
                Recreate Passkey
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Passkey Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Passkey</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this passkey? You will need to enter your password to
            sign in until you set up a new passkey.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeletePasskey}
            color="error"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recreate Passkey Dialog */}
      <Dialog
        open={recreateDialogOpen}
        onClose={() => setRecreateDialogOpen(false)}
        aria-labelledby="recreate-dialog-title"
      >
        <DialogTitle id="recreate-dialog-title">Recreate Passkey</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will delete your existing passkey and create a new one. You'll need to enter your
            current wallet password to continue.
          </DialogContentText>
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecreateDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleRecreatePasskey}
            color="primary"
            disabled={isLoading || !password}
            startIcon={isLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            Recreate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccessDialog}
        title="Success"
        message={successMessage}
        onClose={() => setShowSuccessDialog(false)}
      />

      {/* Error Snackbar */}
      <WarningSnackbar open={showError} message={error} onClose={() => setShowError(false)} />
    </Box>
  );
};

export default PasskeyManagement;
