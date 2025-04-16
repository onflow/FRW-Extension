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

import PasswordTextarea from '@/ui/FRWComponent/PasswordTextarea';
import { useWallet } from '@/ui/utils/WalletContext';
import { LLSpinner } from 'ui/FRWComponent';

import ErrorModel from '../../../../FRWComponent/PopupModal/errorModel';
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

const JsonImport = ({ onOpen, onImport, setPk, isSignLoading }) => {
  const classes = useStyles();
  const usewallet = useWallet();
  const [isLoading, setLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [json, setJson] = useState('');
  const [errorMesssage, setErrorMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  const hasJsonStructure = (str) => {
    if (typeof str !== 'string') return false;
    try {
      const result = JSON.parse(str);
      const type = Object.prototype.toString.call(result);
      return type === '[object Object]' || type === '[object Array]';
    } catch (err) {
      return false;
    }
  };

  const handleImport = async (e) => {
    try {
      setLoading(true);
      e.preventDefault();
      const keystore = e.target[0].value;
      const flag = checkJSONImport(keystore);
      if (!flag) {
        setErrorMessage('json not valid');
        return;
      }
      const password = e.target[2].value;
      const address = e.target[5].value;
      const pkHex = await usewallet.jsonToPrivateKeyHex(keystore, password);
      if (pkHex === null) {
        setErrorMessage('Password incorrect');
        return;
      }
      const result = await usewallet.findAddressWithPrivateKey(pkHex, address);
      setPk(pkHex);
      if (!result) {
        onOpen();
        return;
      }
      const accounts = result.map((a) => ({ ...a, type: KEY_TYPE.KEYSTORE }));
      onImport(accounts);
    } finally {
      setLoading(false);
    }
  };

  const checkJSONImport = (event) => {
    setJson(event);
    if (event.length === 0) {
      setIsInvalid(false);
      setErrorMessage('');
      return false;
    }
    const result = hasJsonStructure(event);
    setIsInvalid(!result);
    setErrorMessage(!result ? 'Not a valid json input' : '');
    return result;
  };

  return (
    <Box sx={{ padding: '0' }}>
      <form id="seed" onSubmit={handleImport} className={classes.form}>
        <PasswordTextarea
          minRows={5}
          placeholder={chrome.i18n.getMessage('You_can_import_the')}
          required
          sx={{ marginBottom: '16px' }}
        />
        <TextField
          required
          placeholder={chrome.i18n.getMessage('Enter_password_for_json_file')}
          type={isVisible ? 'text' : 'password'}
          className={classes.input}
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
