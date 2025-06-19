import { Box, Button, Typography, TextField, TextareaAutosize } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState } from 'react';

import { type PublicKeyAccount } from '@/shared/types/wallet-types';
import PasswordTextarea from '@/ui/components/PasswordTextarea';
import { type ImportAction, type ImportState } from '@/ui/reducers/import-profile-reducer';
import { useWallet } from '@/ui/utils/WalletContext';
import { LLSpinner } from 'ui/components';

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
const KeyImport = ({
  state,
  dispatch,
  onImport,
}: {
  state: ImportState;
  dispatch: (action: ImportAction) => void;
  onImport: (accounts: PublicKeyAccount[]) => void;
}) => {
  const classes = useStyles();
  const usewallet = useWallet();
  const [isLoading, setLoading] = useState(false);
  const { pk, address } = state;
  const handleImport = async () => {
    try {
      setLoading(true);

      const accounts = await usewallet.findAddressWithPrivateKey(pk, address);

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
          placeholder={chrome.i18n.getMessage('Enter_your_Private_key')}
          aria-label="Private Key"
          required
          sx={{ marginBottom: '16px' }}
          value={pk}
          onChange={(e) => dispatch({ type: 'SET_PK', payload: e.target.value })}
        />
        <TextareaAutosize
          placeholder={chrome.i18n.getMessage('Enter_your_flow_address')}
          className={classes.textarea}
          value={address}
          onChange={(e) => dispatch({ type: 'SET_ADDRESS', payload: e.target.value })}
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
            width: '100%',
            borderRadius: '12px',
            textTransform: 'capitalize',
            gap: '12px',
            display: 'flex',
          }}
          disabled={isLoading}
        >
          {isLoading && <LLSpinner size={28} />}
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
            {chrome.i18n.getMessage('Import')}
          </Typography>
        </Button>
      </form>
    </Box>
  );
};

export default KeyImport;
