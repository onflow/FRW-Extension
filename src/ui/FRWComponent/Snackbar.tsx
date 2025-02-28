import { Snackbar, Alert, type AlertProps } from '@mui/material';
import React from 'react';

interface ErrorSnackbarProps {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const ErrorSnackbar: React.FC<ErrorSnackbarProps> = ({
  open,
  message,
  onClose,
  duration = 6000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity="error" variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

interface SuccessSnackbarProps {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export const SuccessSnackbar: React.FC<SuccessSnackbarProps> = ({
  open,
  message,
  onClose,
  duration = 6000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity="success" variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

interface CustomSnackbarProps {
  open: boolean;
  message: React.ReactNode;
  onClose: () => void;
  severity?: AlertProps['severity'];
  duration?: number;
}

export const CustomSnackbar: React.FC<CustomSnackbarProps> = ({
  open,
  message,
  onClose,
  severity = 'info',
  duration = 6000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default { ErrorSnackbar, SuccessSnackbar, CustomSnackbar };
