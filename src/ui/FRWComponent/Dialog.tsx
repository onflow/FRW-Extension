import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React from 'react';

const useStyles = makeStyles(() => ({
  successIcon: {
    color: '#4CAF50',
    fontSize: 48,
    margin: '16px auto',
    display: 'block',
  },
  title: {
    textAlign: 'center',
  },
  content: {
    textAlign: 'center',
  },
  actions: {
    justifyContent: 'center',
    padding: '16px',
  },
}));

interface SuccessDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({ open, title, message, onClose }) => {
  const classes = useStyles();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ padding: '16px' }}>
        <CheckCircleIcon className={classes.successIcon} />
        <DialogTitle className={classes.title}>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText className={classes.content}>{message}</DialogContentText>
        </DialogContent>
        <DialogActions className={classes.actions}>
          <Button variant="contained" onClick={onClose} color="primary" sx={{ minWidth: '120px' }}>
            Got it
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default { SuccessDialog };
