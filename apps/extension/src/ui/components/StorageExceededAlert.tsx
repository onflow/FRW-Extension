import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, IconButton, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router';

import eventBus from '@/extension-shared/utils/message/eventBus';

interface StorageExceededAlertProps {
  open: boolean;
  onClose: () => void;
}

const StorageExceededAlert: React.FC<StorageExceededAlertProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleBuyFlow = () => {
    onClose();
    eventBus.emit('openOnRamp');
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: '90%',
          maxWidth: '400px',
          backgroundColor: '#1C1C1C',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: '16px',
            top: '16px',
            color: '#FFFFFF',
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography
          variant="h1"
          sx={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            textAlign: 'center',
            mb: 3,
          }}
        >
          {chrome.i18n.getMessage('Insufficient_Storage')}
        </Typography>

        <Typography
          sx={{
            fontSize: '16px',
            color: '#FFFFFF',
            textAlign: 'center',
            mb: 2,
          }}
        >
          {chrome.i18n.getMessage('Transaction_failed_storage_exceeded')}
        </Typography>

        <Typography
          sx={{
            fontSize: '16px',
            color: '#FF8A00',
            textAlign: 'center',
            mb: 3,
          }}
        >
          {chrome.i18n.getMessage('Must_have_minimum_flow_storage')}
        </Typography>

        <Typography
          component="a"
          href="https://developers.flow.com/build/basics/fees#storage"
          target="_blank"
          sx={{
            fontSize: '16px',
            color: '#3898FF',
            textAlign: 'center',
            display: 'block',
            mb: 3,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          {chrome.i18n.getMessage('Learn_More')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="inherit"
            onClick={() => {
              onClose();
              navigate('/dashboard/wallet/deposit');
            }}
            sx={{
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#333333',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#444444',
              },
            }}
          >
            {chrome.i18n.getMessage('Deposit')}
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleBuyFlow}
            sx={{
              height: '48px',
              borderRadius: '12px',
            }}
          >
            {chrome.i18n.getMessage('Buy_FLOW')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default StorageExceededAlert;
