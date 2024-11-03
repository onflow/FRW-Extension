import { useEffect, useState, useContext } from 'react';
import { findAddressWithSeed } from '../../../utils/modules/findAddressWithPK';
import { KEY_TYPE } from '../../../utils/modules/constants';
import React from 'react';
import { Box, Button, Typography, TextareaAutosize } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LLSpinner } from 'ui/FRWComponent';
import KeyPathInput from '../../../FRWComponent/KeyPathInputs';

const useStyles = makeStyles((theme) => ({
  form: {
    width: '100%', // Fix full width
    display: 'flex',
    flexDirection: 'column',
  },
  textarea: {
    width: '100%', // Fix full width
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
    width: '100%', // Fix full width
    fontWeight: 'bold',
  },
}));


const SeedPhraseImport = ({ onOpen, onImport, setmnemonic, isSignLoading }) => {
  const classes = useStyles();
  const [isLoading, setLoading] = useState(false);

  const handleImport = async (e) => {
    try {
      setLoading(true);
      e.preventDefault();
      const seed = e.target[0].value.trim().split(/\s+/g).join(' ');
      setmnemonic(seed);
      const flowAddressRegex = /^(0x)?[0-9a-fA-F]{16}$/;
      const inputValue = e.target[2].value;

      const address = flowAddressRegex.test(inputValue) ? inputValue : null;

      console.log('address ', address)
      const result = await findAddressWithSeed(seed, address, true)
      if (!result) {
        onOpen();
        return;
      }
      const accounts = result.map((a) => ({ ...a, type: KEY_TYPE.SEED_PHRASE, mnemonic: seed }))
      onImport(accounts);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: '0' }}>
      <form id="seed" onSubmit={handleImport} className={classes.form}>
        <TextareaAutosize
          minRows={6}
          placeholder={chrome.i18n.getMessage('Import_12_or_24_words')}
          className={classes.textarea}
          required
        />
        <TextareaAutosize
          placeholder={chrome.i18n.getMessage('Enter_your_flow_address')}
          className={classes.textarea}
          defaultValue={''}

        />

        <KeyPathInput />


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
            marginTop:'40px',
          }}
          disabled={isLoading || isSignLoading}

        >
          {(isLoading || isSignLoading) && <LLSpinner size={28} />}
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 'bold' }}
            color="background.paper"
          >
            {chrome.i18n.getMessage('Import')}
          </Typography>
        </Button>
      </form>
    </Box>
  );
};

export default SeedPhraseImport;
