import CloseIcon from '@mui/icons-material/Close';
import KeyIcon from '@mui/icons-material/Key';
import { Box, Typography, Button, Paper } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { usePasskeyPrompt } from '@/ui/utils/PasskeyPromptContext';

interface PasskeyPromptProps {
  onClose?: () => void; // Make onClose optional
}

const PasskeyPrompt: React.FC<PasskeyPromptProps> = ({ onClose }) => {
  const history = useHistory();
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { hidePasskeyPrompt } = usePasskeyPrompt();

  // Add a slight delay before showing the prompt to ensure it appears after login
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleSetupPasskey = () => {
    // Navigate to the passkey setup page
    history.push('/dashboard/setting/passkey-setup');
    handleClose();
  };

  const handleSkip = () => {
    setIsClosing(true);
    setTimeout(() => {
      handleClose();
    }, 300); // Match animation duration
  };

  const handleClose = () => {
    // Call both the local onClose and the global hidePasskeyPrompt
    if (onClose) onClose();
    hidePasskeyPrompt();
  };

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '90%',
          maxWidth: '360px',
          p: 3,
          borderRadius: '12px',
          backgroundColor: '#282828',
          border: '1px solid #4C4C4C',
          position: 'relative',
          transform: isClosing ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 0.3s ease',
        }}
      >
        <Button
          onClick={handleSkip}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            minWidth: 'auto',
            p: 1,
            color: 'text.secondary',
          }}
        >
          <CloseIcon fontSize="small" />
        </Button>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <KeyIcon
            sx={{
              fontSize: 48,
              color: 'primary.main',
              mb: 2,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 1,
            }}
          >
            Set Up Passkey Authentication
          </Typography>
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              mb: 3,
            }}
          >
            Sign in faster and more securely with passkeys. Use your device's biometrics or PIN
            instead of typing your password.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<KeyIcon />}
            onClick={handleSetupPasskey}
            sx={{
              borderRadius: '12px',
              py: 1.5,
            }}
          >
            Set Up Passkey
          </Button>
          <Button
            variant="text"
            color="inherit"
            onClick={handleSkip}
            sx={{
              borderRadius: '12px',
              color: 'text.secondary',
            }}
          >
            Skip for Now
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PasskeyPrompt;
