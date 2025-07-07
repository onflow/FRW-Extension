import { Button, DialogActions, Typography } from '@mui/material';
import React from 'react';

import { CustomDialog } from '../custom-dialog';

const ResetModal = ({ setShowAction, isOpen, onOpenChange, errorName, errorMessage }) => {
  return (
    <CustomDialog open={isOpen} onClose={() => setShowAction(false)}>
      <Typography sx={{ color: 'testnet.main', fontSize: '24px', fontWeight: '700' }}>
        {errorName}
      </Typography>
      <Typography sx={{ color: '#BABABA', margin: '20px 0 40px', fontSize: '16px' }}>
        {errorMessage}
      </Typography>
      <DialogActions sx={{ display: 'flex', flexDirection: 'row' }}>
        <Button
          className="registerButton"
          variant="contained"
          color="secondary"
          form="seed"
          size="large"
          onClick={() => setShowAction(false)}
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
            {chrome.i18n.getMessage('Cancel')}
          </Typography>
        </Button>
        <Button
          className="registerButton"
          variant="contained"
          color="error"
          form="seed"
          size="large"
          onClick={() => onOpenChange()}
          sx={{
            height: '56px',
            width: '100%',
            borderRadius: '12px',
            textTransform: 'capitalize',
            gap: '12px',
            display: 'flex',
            marginLeft: '40px',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.error">
            {chrome.i18n.getMessage('Reset')}
          </Typography>
        </Button>
      </DialogActions>
    </CustomDialog>
  );
};

export default ResetModal;
