import { Box, Button, Typography, TextField, TextareaAutosize } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState } from 'react';

import PasswordTextarea from '@/ui/FRWComponent/PasswordTextarea';
import { useWallet } from '@/ui/utils/WalletContext';
import { LLSpinner } from 'ui/FRWComponent';

import { KEY_TYPE } from '../../../../utils/modules/constants';

const useStyles = makeStyles((theme) => ({
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  textarea: {
    width: '100%',
    borderRadius: '16px',
    backgroundColor: '#2C2C2C',
    padding: '20px',
    color: '#fff',
    marginBottom: '16px',
    resize: 'none',
    fontSize: '16px',
    fontFamily: 'Inter',
  },
  button: {
    width: '100%',
    fontWeight: 'bold',
  },
}));
const KeyImport = ({ onOpen, onImport, setPk, isSignLoading }) => {
  const classes = useStyles();
  const usewallet = useWallet();
  const [isLoading, setLoading] = useState(false);

  const handleImport = async (e) => {
    try {
      setLoading(true);
      e.preventDefault();
      const pk = e.target[0].value.replace(/^0x/, '');
      const flowAddressRegex = /^(0x)?[0-9a-fA-F]{16}$/;
      const inputValue = e.target[2].value;
      setPk(pk);
      const address = flowAddressRegex.test(inputValue) ? inputValue : null;
      const result = await usewallet.findAddressWithPrivateKey(pk, address);
      if (!result) {
        onOpen();
        return;
      }
      const accounts = result.map((a) => ({ ...a, type: KEY_TYPE.PRIVATE_KEY }));
      onImport(accounts);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: '0' }}>
      <form id="seed" onSubmit={handleImport} className={classes.form}>
        <PasswordTextarea
          minRows={2}
          maxRows={2}
          placeholder={chrome.i18n.getMessage('Enter_your_Private_key')}
          aria-label="Private Key"
          required
          sx={{ marginBottom: '16px' }}
        />
        <TextareaAutosize
          placeholder={chrome.i18n.getMessage('Enter_your_flow_address')}
          className={classes.textarea}
          defaultValue={''}
        />
        <Button
          className="registerButton"
          variant="contained"
          color="secondary"
          form="seed"
          size="large"
          type="submit"
          sx={{
            height: '56px',
            width: '640px',
            borderRadius: '12px',
            textTransform: 'capitalize',
            gap: '12px',
            display: 'flex',
          }}
          disabled={isLoading || isSignLoading}
        >
          {(isLoading || isSignLoading) && <LLSpinner size={28} />}
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
            {chrome.i18n.getMessage('Import')}
          </Typography>
        </Button>
      </form>
    </Box>
  );
};

export default KeyImport;
