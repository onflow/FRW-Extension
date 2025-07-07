import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextareaAutosize,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

import { KEY_TYPE } from '@/shared/constant/algo-constants';
import { type PublicKeyAccount } from '@/shared/types/wallet-types';
import { consoleError } from '@/shared/utils/console-log';
import { LLSpinner } from '@/ui/components/LLSpinner';
import PasswordTextarea from '@/ui/components/password/PasswordTextarea';
import ErrorModel from '@/ui/components/PopupModal/errorModel';
import { useWallet } from '@/ui/hooks/use-wallet';
import { COLOR_DARKMODE_WHITE_3pc } from '@/ui/style/color';

const JsonImport = ({
  onOpen,
  onImport,
  setPk,
  isSignLoading,
}: {
  onOpen: () => void;
  onImport: (accounts: PublicKeyAccount[]) => void;
  setPk: (pk: string) => void;
  isSignLoading: boolean;
}) => {
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

      const formData = new FormData(e.target);
      const keystoreInput = formData.get('keystore') as string;
      const passwordInput = formData.get('password') as string;
      const addressInput = formData.get('address') as string;

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

      const foundAccounts = await usewallet.findAddressWithPrivateKey(privateKeyHex, addressInput);
      setPk(privateKeyHex);

      if (!foundAccounts) {
        onOpen();
        return;
      }

      const accounts: (PublicKeyAccount & { type: string })[] = foundAccounts.map((account) => ({
        ...account,
        type: KEY_TYPE.KEYSTORE,
      }));

      onImport(accounts);
    } catch (error) {
      consoleError('Error during import:', error);
      setErrorMessage('An unexpected error occurred');
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
      <form
        id="seed"
        onSubmit={handleImport}
        style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <PasswordTextarea
          minRows={5}
          placeholder={chrome.i18n.getMessage('You_can_import_the')}
          name="keystore"
          required
          sx={{ marginBottom: '16px' }}
        />
        <TextField
          required
          placeholder={chrome.i18n.getMessage('Enter_password_for_json_file')}
          type={isVisible ? 'text' : 'password'}
          name="password"
          sx={{
            '& .MuiInputBase-input': {
              padding: '0 20px',
              fontWeight: 400,
            },
          }}
          InputProps={{
            sx: {
              width: '100%',
              borderRadius: '16px',
              backgroundColor: COLOR_DARKMODE_WHITE_3pc,
              padding: '20px 0',
              color: '#fff',
              marginBottom: '16px',
              resize: 'none',
              fontSize: '16px',
              fontFamily: 'Inter',
              fontWeight: 400,
            },
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
          style={{
            width: '100%',
            borderRadius: '16px',
            backgroundColor: COLOR_DARKMODE_WHITE_3pc,
            padding: '20px',
            color: '#fff',
            marginBottom: '16px',
            resize: 'none',
            fontSize: '16px',
            fontFamily: 'Inter',
            fontWeight: 400,
          }}
          defaultValue={''}
          name="address"
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
