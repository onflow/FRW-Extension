import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  TextareaAutosize,
  InputAdornment,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState } from 'react';

import { type PublicKeyAccount } from '@/shared/types/wallet-types';
import { consoleError } from '@/shared/utils/console-log';
import PasswordTextarea from '@/ui/components/PasswordTextarea';
import { useWallet } from '@/ui/utils/WalletContext';
import { LLSpinner } from 'ui/components';

import ErrorModel from '../../../../components/PopupModal/errorModel';
import { KEY_TYPE } from '../../../../utils/modules/constants';

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
    fontWeight: 400,
  },
  inputChild: {
    width: '100%',
    borderRadius: '16px',
    backgroundColor: '#2C2C2C',
    padding: '20px 0',
    color: '#fff',
    marginBottom: '16px',
    resize: 'none',
    fontSize: '16px',
    fontFamily: 'Inter',
    fontWeight: 400,
  },
  input: {
    '& .MuiInputBase-input': {
      padding: '0 20px',
      fontWeight: 400,
    },
  },
  button: {
    width: '100%',
    fontWeight: 'bold',
  },
}));

const JsonImport = ({
  onOpen,
  onImport,
  setPk,
}: {
  onOpen: () => void;
  onImport: (accounts: PublicKeyAccount[]) => void;
  setPk: (pk: string) => void;
}) => {
  const classes = useStyles();
  const usewallet = useWallet();
  const [isLoading, setLoading] = useState(false);
  const [errorMesssage, setErrorMessage] = useState('');

  const [keystoreInput, setKeystoreInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  const hasJsonStructure = (str) => {
    if (typeof str !== 'string') return false;
    try {
      const result = JSON.parse(str);
      const type = Object.prototype.toString.call(result);
      return type === '[object Object]' || type === '[object Array]';
    } catch {
      return false;
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);

      if (!checkJSONImport(keystoreInput)) {
        setErrorMessage('JSON not valid');
        return;
      }

      if (!passwordInput) {
        setErrorMessage('Password cannot be empty');
        return;
      }
      let privateKeyHex;
      try {
        privateKeyHex = await usewallet.jsonToPrivateKeyHex(keystoreInput, passwordInput);
        if (!privateKeyHex) {
          setErrorMessage('Password incorrect');
          return;
        }
      } catch (conversionError) {
        consoleError('Error decoding JSON to private key:', conversionError);
        setErrorMessage(
          'Failed to decode JSON to private key. Please check the keystore and password.'
        );
        return;
      }
      setPk(privateKeyHex);

      const foundAccounts = await usewallet.findAddressWithPrivateKey(privateKeyHex, addressInput);

      if (!foundAccounts) {
        onOpen();
        return;
      }

      onImport(foundAccounts);
    } catch (error) {
      consoleError('Error during import:', error);
      setErrorMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkJSONImport = (event) => {
    if (event.length === 0) {
      setErrorMessage('');
      return false;
    }
    const result = hasJsonStructure(event);
    setErrorMessage(!result ? 'Not a valid json input' : '');
    return result;
  };

  return (
    <Box sx={{ padding: '0' }}>
      <form id="seed" onSubmit={handleImport} className={classes.form}>
        <PasswordTextarea
          minRows={5}
          placeholder={chrome.i18n.getMessage('You_can_import_the')}
          name="keystore"
          value={keystoreInput}
          onChange={(e) => setKeystoreInput(e.target.value)}
          required
          sx={{ marginBottom: '16px' }}
        />
        <TextField
          required
          placeholder={chrome.i18n.getMessage('Enter_password_for_json_file')}
          type={isVisible ? 'text' : 'password'}
          className={classes.input}
          name="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          InputProps={{
            className: classes.inputChild,
            endAdornment: (
              <InputAdornment position="end" sx={{ paddingRight: '20px' }}>
                <IconButton onClick={toggleVisibility} edge="end">
                  {isVisible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextareaAutosize
          placeholder={chrome.i18n.getMessage('Enter_your_flow_address')}
          className={classes.textarea}
          defaultValue={''}
          name="address"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
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
      {errorMesssage !== '' && (
        <ErrorModel
          isOpen={errorMesssage !== ''}
          onOpenChange={() => {
            setErrorMessage('');
          }}
          errorName={chrome.i18n.getMessage('Error')}
          errorMessage={errorMesssage}
        />
      )}
    </Box>
  );
};

export default JsonImport;
