// import { useTranslation } from 'react-i18next';
import { Typography, Box, FormControl, Input } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

import { consoleError } from '@/shared/utils/console-log';
import { DEFAULT_PASSWORD } from '@/shared/utils/default';
import CancelIcon from '@/ui/components/iconfont/IconClose';
import SlideRelative from '@/ui/components/SlideRelative';
import { LLPrimaryButton } from 'ui/components';
import { useWallet } from 'ui/utils';

const RecoverPage = ({ dataArray, setArray, goNext }) => {
  const wallet = useWallet();
  const inputEl = useRef<any>(null);
  // const { t } = useTranslation();
  const [showError, setShowError] = useState(false);
  const [isLoading, setLoading] = useState(false);
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

  const usernameError = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CancelIcon size={24} color={'#E54040'} style={{ margin: '8px' }} />
      <Typography variant="body1" color="text.secondary">
        {chrome.i18n.getMessage('Incorrect__Password')}
      </Typography>
    </Box>
  );

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
        <Input
          id="textfield"
          type="password"
          sx={{
            height: '64px',
            padding: '16px',
            magrinBottom: '64px',
            zIndex: '999',
            backgroundColor: '#282828',
            border: '2px solid #4C4C4C',
            borderRadius: '12px',
            boxSizing: 'border-box',
            '&.Mui-focused': {
              border: '2px solid #FAFAFA',
              boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
            },
          }}
          placeholder={chrome.i18n.getMessage('Enter__Your__Password')}
          autoFocus
          fullWidth
          disableUnderline
          value={password}
          onChange={(event) => {
            setShowError(false);
            setPassword(event.target.value);
          }}
          onKeyDown={handleKeyDown}
        />

        <SlideRelative direction="down" show={showError}>
          <Box
            sx={{
              width: '95%',
              backgroundColor: 'error.light',
              mx: 'auto',
              borderRadius: '0 0 12px 12px',
            }}
          >
            <Box sx={{ p: '4px' }}>{usernameError()}</Box>
          </Box>
        </SlideRelative>
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
