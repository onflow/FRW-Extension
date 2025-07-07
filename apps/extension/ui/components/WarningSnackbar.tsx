'use client';

import { Snackbar, Alert } from '@mui/material';
import React from 'react';

interface WarningSnackbarProps {
  open: boolean;
  onClose: () => void;
  alertIcon: string;
  message: string | React.ReactNode;
  sx?: object;
}

export default function WarningSnackbar({
  open,
  onClose,
  alertIcon,
  message,
  sx,
}: WarningSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={2000}
      onClose={onClose}
      sx={{
        zIndex: '2000',
        pointerEvents: 'none', // Allow clicks to pass through
        width: '100%',
        maxWidth: 'calc(100% - 36px)', // 18px padding on each side to match button
        margin: '0 auto',
        ...sx, // Spread additional styles
      }}
    >
      <Alert
        icon={<img src={alertIcon} alt="alert icon" style={{ width: '20px', height: '20px' }} />}
        variant="filled"
        severity="warning"
        sx={{
          color: '#FFFFFF',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: '400',
          borderRadius: '24px',
          margin: '0 auto 80px',
          zIndex: '2000',
          pointerEvents: 'auto', // Make the alert itself clickable
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%', // Take full width of constrained Snackbar
          '& .MuiAlert-icon': {
            marginRight: 0,
            padding: 0,
          },
          '& .MuiAlert-message': {
            padding: 0,
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
