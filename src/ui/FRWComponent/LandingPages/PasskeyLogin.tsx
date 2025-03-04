import KeyIcon from '@mui/icons-material/Key';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import WarningSnackbar from '@/ui/FRWComponent/WarningSnackbar';
import { usePasskey } from '@/ui/hooks/usePasskey';
import { useWallet } from '@/ui/utils';
import { authenticateWithPasskey, parseWebAuthnError } from '@/ui/utils/passkey-utils';

const useStyles = makeStyles(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    padding: '24px',
    maxWidth: '400px',
    margin: '0 auto',
  },
  title: {
    fontWeight: 600,
    marginBottom: '8px',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: '16px',
  },
  passkeyButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  orDivider: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    margin: '16px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e0e0e0',
  },
  orText: {
    padding: '0 16px',
    color: '#666',
  },
  passwordButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
  },
  passkeyIcon: {
    width: '80px',
    height: '80px',
    backgroundColor: '#f5f5f5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  helpText: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    marginTop: '16px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}));

interface PasskeyLoginProps {
  onSwitchToPassword: () => void;
}

const PasskeyLogin: React.FC<PasskeyLoginProps> = ({ onSwitchToPassword }) => {
  const classes = useStyles();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const wallet = useWallet();

  // Use our unified passkey hook instead of direct checks
  const { isSupported, isEnabled } = usePasskey();

  const handleSwitchToPassword = () => {
    // If onSwitchToPassword is provided, use it
    if (onSwitchToPassword) {
      onSwitchToPassword();
    } else {
      // Otherwise, use URL parameter approach
      history.push('/?login=password');
    }
  };

  const handleSignInWithPasskey = async () => {
    try {
      setIsLoading(true);
      setShowError(false);

      // Get available passkeys from the wallet controller (background)
      const passkeyInfo = await wallet.getAvailablePasskeys();
      console.log('Available passkeys:', passkeyInfo);

      if (!passkeyInfo || passkeyInfo.length === 0) {
        throw new Error('No passkeys available for this account');
      }

      // Use our utility function to authenticate with passkey
      const credential = await authenticateWithPasskey(passkeyInfo);

      if (!credential) {
        throw new Error('Failed to get passkey');
      }

      console.log('Passkey authentication successful in UI context:', credential);

      // Verify the credential with the wallet service in the background
      // This will also decrypt and store the password if available, and unlock the wallet
      console.log('Verifying credential with ID:', credential.id);
      const success = await wallet.verifyPasskeyCredential(credential.id);
      console.log('Verification result:', success);

      if (success) {
        console.log('Passkey authentication complete, wallet unlocked');
        // Successful login, navigate to home
        history.push('/');
      } else {
        console.error('Passkey verification failed in the background');
        setError('Failed to verify passkey. Please try again.');
        setShowError(true);
      }
    } catch (error: any) {
      console.error('Error signing in with passkey:', error);

      // Use our utility function to parse WebAuthn errors
      const parsedError = parseWebAuthnError(error);
      setError(parsedError.message);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Box className={classes.container}>
        <Box className={classes.passkeyIcon}>
          <KeyIcon sx={{ fontSize: 40, color: '#888' }} />
        </Box>
        <Typography variant="h5" className={classes.title}>
          Passkeys Not Supported
        </Typography>
        <Typography variant="body1" className={classes.subtitle}>
          Your browser or device doesn't support passkeys. Please use password login instead.
        </Typography>
        <Button
          variant="contained"
          className={classes.passwordButton}
          onClick={handleSwitchToPassword}
          startIcon={<LockPersonIcon />}
        >
          Sign in with Password
        </Button>
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      <Box className={classes.passkeyIcon}>
        <KeyIcon sx={{ fontSize: 40, color: '#1976d2' }} />
      </Box>
      <Typography variant="h5" className={classes.title}>
        Sign in with Passkey
      </Typography>
      <Typography variant="body1" className={classes.subtitle}>
        Use your passkey to quickly and securely sign in to your wallet without entering a password.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        className={classes.passkeyButton}
        onClick={handleSignInWithPasskey}
        disabled={isLoading}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <>
            <KeyIcon /> Sign in with Passkey
          </>
        )}
      </Button>

      {/* Only show password option if passkeys are not yet enabled */}
      {!isEnabled && (
        <>
          <Box className={classes.orDivider}>
            <Box className={classes.dividerLine} />
            <Typography variant="body2" className={classes.orText}>
              OR
            </Typography>
            <Box className={classes.dividerLine} />
          </Box>

          <Button
            variant="outlined"
            className={classes.passwordButton}
            onClick={handleSwitchToPassword}
            startIcon={<LockPersonIcon />}
          >
            Sign in with Password
          </Button>
        </>
      )}

      {/* Always show a way to access password login in case of issues */}
      {isEnabled && (
        <Typography className={classes.helpText} onClick={handleSwitchToPassword}>
          Having trouble? Use password instead
        </Typography>
      )}

      <WarningSnackbar open={showError} message={error} onClose={() => setShowError(false)} />
    </Box>
  );
};

export default PasskeyLogin;
