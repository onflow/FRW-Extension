import { Button, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router';

import { CustomDialog } from '../custom-dialog';

const ErrorModel = ({ isOpen, onOpenChange, errorName, errorMessage, isGoback = false }) => {
  const navigate = useNavigate();

  const handleSubmit = () => {
    navigate(-1);
  };

  return (
    <CustomDialog open={isOpen} onClose={() => onOpenChange(true)}>
      <Typography sx={{ color: 'testnet.main', fontSize: '24px', fontWeight: '700' }}>
        {errorName}
      </Typography>
      <Typography sx={{ color: '#BABABA', margin: '20px 0 40px', fontSize: '16px' }}>
        {errorMessage}
      </Typography>
      <Button
        className="registerButton"
        variant="contained"
        color="secondary"
        form="seed"
        size="large"
        onClick={() => onOpenChange(true)}
        sx={{
          height: '56px',
          width: '100%',
          borderRadius: '12px',
          textTransform: 'capitalize',
          gap: '12px',
          display: 'flex',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
          {chrome.i18n.getMessage('OK')}
        </Typography>
      </Button>
      {isGoback && (
        <Button
          className="registerButton"
          variant="contained"
          color="info"
          form="seed"
          size="large"
          onClick={() => handleSubmit()}
          sx={{
            height: '56px',
            width: '100%',
            borderRadius: '12px',
            textTransform: 'capitalize',
            gap: '12px',
            display: 'flex',
            marginTop: '8px',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background">
            {chrome.i18n.getMessage('Back')}
          </Typography>
        </Button>
      )}
    </CustomDialog>
  );
};

export default ErrorModel;
