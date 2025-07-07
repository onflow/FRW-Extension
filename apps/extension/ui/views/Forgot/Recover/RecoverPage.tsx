// import { useTranslation } from 'react-i18next';
import { Box, FormControl, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

import { consoleError } from '@/shared/utils/console-log';
import { DEFAULT_PASSWORD } from '@/shared/utils/default';
import { LLPrimaryButton } from '@/ui/components';
import { PasswordInput } from '@/ui/components/password/PasswordInput';
import { useWallet } from '@/ui/hooks/use-wallet';

const RecoverPage = ({ dataArray, setArray, goNext }) => {
  const wallet = useWallet();

  const inputEl = useRef<any>(null);
  // const { t } = useTranslation();
  const [showError, setShowError] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [retrieved, setRetrieved] = useState(false);
  useEffect(() => {
    if (!inputEl.current) return;
    inputEl.current.focus();
  }, []);

  const run = async (password) => {
    const result = await wallet.revealKeyring(password);
    const resultArray: string[] = [];
    result.forEach((keyring) => {
      try {
        keyring.decryptedData.forEach((dataEntry) => {
          try {
            if (dataEntry.type === 'HD Key Tree') {
              const mnemonic = dataEntry.data?.mnemonic;
              if (mnemonic) {
                resultArray.push(mnemonic);
              }
            } else if (dataEntry.type === 'Simple Key Pair') {
              const privateKey = dataEntry.data?.[0];
              if (privateKey) {
                resultArray.push(privateKey);
              }
            }
          } catch (dataEntryError) {
            consoleError('Error processing data entry:', dataEntryError);
          }
        });
      } catch (keyringError) {
        consoleError('Error processing keyring:', keyringError);
      }
    });

    await setArray(resultArray);
    setRetrieved(true);
    setLoading(false);
    goNext();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      setLoading(true);
      run(password);
    }
  };

  const handleSwitchTab = () => {
    setLoading(true);
    run(password);
  };

  const copyAll = () => {
    // Extract 'value' from each item and join them with a space
    const allValues = dataArray.map((item, index) => `${index + 1}: ${item.value};`).join(' ');

    navigator.clipboard
      .writeText(allValues)
      .catch((err) => consoleError('Failed to copy to clipboard: ', err));
  };

  return (
    <Box
      sx={{
        width: '100%',
        flexDirection: 'column',
        padding: '24px 40px 40px',
      }}
    >
      <Box
        sx={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: '700',
            fontSize: '40px',
            WebkitBackgroundClip: 'text',
            color: '#fff',
            lineHeight: '56px',
          }}
        >
          {chrome.i18n.getMessage('Retrieve_local_sensitive_data')}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            fontFamily: 'Inter',
            fontStyle: 'normal',
            color: '#BABABA',
            margin: '18px 0 32px',
            cursor: 'pointer',
          }}
        >
          {chrome.i18n.getMessage('It_seem_like_something_wrong')}
        </Typography>
      </Box>

      <FormControl sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
        <PasswordInput
          value={password}
          onChange={(value) => {
            setShowError(false);
            setPassword(value);
          }}
          showPassword={isPasswordVisible}
          setShowPassword={setPasswordVisible}
          errorText={showError ? chrome.i18n.getMessage('Incorrect__Password') : undefined}
          autoFocus={true}
          placeholder={chrome.i18n.getMessage('Enter__Your__Password')}
          onKeyDown={handleKeyDown}
        />
      </FormControl>

      <Box
        sx={{
          width: '100%',
          marginTop: '40px',
          marginBottom: '16px',
          weight: '700',
          fontSize: '20px',
        }}
      >
        <LLPrimaryButton
          // className="w-full block"\
          color="success"
          type="submit"
          onClick={handleSwitchTab}
          fullWidth
          label={
            isLoading ? (
              <Typography> {chrome.i18n.getMessage('Loading')}</Typography>
            ) : (
              <Typography>{chrome.i18n.getMessage('Reveal_Private_Key')}</Typography>
            )
          }
        />
      </Box>
    </Box>
  );
};

export default RecoverPage;
