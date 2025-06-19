import { Box, Button, Typography, TextareaAutosize } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState } from 'react';

import { type PublicKeyAccount } from '@/shared/types/wallet-types';
import { consoleError } from '@/shared/utils/console-log';
import { LLSpinner } from '@/ui/components/LLSpinner';
import PasswordTextarea from '@/ui/components/PasswordTextarea';
import { type ImportState, type ImportAction } from '@/ui/reducers/import-profile-reducer';
import { useWallet } from '@/ui/utils/WalletContext';

import KeyPathInput from './KeyPathInputs';

const useStyles = makeStyles(() => ({
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

interface SeedPhraseImportProps {
  state: ImportState;
  dispatch: (action: ImportAction) => void;
  onImport: (accounts: PublicKeyAccount[]) => void;
}
const SeedPhraseImport: React.FC<SeedPhraseImportProps> = ({ state, dispatch, onImport }) => {
  const classes = useStyles();
  const usewallet = useWallet();
  const [isLoading, setLoading] = useState(false);
  const { path, phrase, mnemonic, address } = state;
  const handleImport = async () => {
    try {
      setLoading(true);

      // Check if the seed phrase is valid
      // If address is provided, check if the address is associated with the seed phrase
      // The address method uses fcl, to query the flow address then checks the public key matches
      // Otherwise we use the key indexer to find the address.
      // The address method is help the user double check they are importing the correct seed phrase for the address they want to access
      const accounts = await usewallet.findAddressWithSeedPhrase(mnemonic, address, path, phrase);

      onImport(accounts);
    } catch (error) {
      consoleError(error);
      // TODO: We need to catch errors and show them to the user
      dispatch({
        type: 'SET_ERROR',
        payload: { message: chrome.i18n.getMessage('Something__went__wrong__please__try__again') },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: '0' }}>
      <form id="seed" onSubmit={handleImport} className={classes.form}>
        <PasswordTextarea
          minRows={4}
          placeholder={chrome.i18n.getMessage('Import_12_or_24_words')}
          required
          sx={{ marginBottom: '16px' }}
          value={mnemonic}
          onChange={(e) => dispatch({ type: 'SET_MNEMONIC', payload: e.target.value })}
        />
        <TextareaAutosize
          placeholder={chrome.i18n.getMessage('Enter_your_flow_address')}
          className={classes.textarea}
          value={address}
          onChange={(e) => dispatch({ type: 'SET_ADDRESS', payload: e.target.value })}
        />
        <KeyPathInput
          path={path}
          setPath={(path) => dispatch({ type: 'SET_DERIVATION_PATH', payload: path })}
          phrase={phrase}
          setPhrase={(phrase) => dispatch({ type: 'SET_PASSPHRASE', payload: phrase })}
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
            marginTop: '40px',
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

export default SeedPhraseImport;
