import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';
import React, { useState } from 'react';

import { DEFAULT_PASSWORD } from '@/shared/utils/default';
import { PasswordInput } from '@/ui/components/password/PasswordInput';
import { useWallet } from '@/ui/hooks/use-wallet';

const DecryptWallet = ({ handleSwitchTab, setMnemonic, username }) => {
  const usewallet = useWallet();

  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [isLoading, setLoading] = useState(false);

  const [errorText, setErrorText] = useState<string | undefined>(undefined);
  const decryptWallet = async () => {
    setLoading(true);

    try {
      const mnemonic = await usewallet.restoreAccount(username, password);
      setLoading(false);
      setMnemonic(mnemonic);
      handleSwitchTab();
    } catch (e) {
      setLoading(false);
      // Error will be shown by PasswordValidationText
      setErrorText(chrome.i18n.getMessage('Incorrect__decrypt__password__please__try__again'));
    }
  };

  return (
    <>
      <Box className="registerBox">
        <Typography variant="h4">
          {chrome.i18n.getMessage('Welcome__Back')}
          <Box display="inline" color="primary.main">
            {username}
          </Box>{' '}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Please__enter__your__password__to__decrypt')}
        </Typography>

        <Box
          sx={{
            flexGrow: 1,
            width: 640,
            maxWidth: '100%',
            my: '32px',
            display: 'flex',
          }}
        >
          <PasswordInput
            value={password}
            onChange={setPassword}
            showPassword={isPasswordVisible}
            setShowPassword={setPasswordVisible}
            errorText={errorText}
            autoFocus={true}
            placeholder={chrome.i18n.getMessage('Enter__Your__Password')}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <Button
          className="registerButton"
          onClick={decryptWallet}
          disabled={isLoading || !password}
          variant="contained"
          color="secondary"
          size="large"
          sx={{
            height: '56px',
            borderRadius: '12px',
            width: '640px',
            textTransform: 'capitalize',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
            {chrome.i18n.getMessage('Restore__My__Wallet')}
          </Typography>
        </Button>
      </Box>
    </>
  );
};

export default DecryptWallet;
