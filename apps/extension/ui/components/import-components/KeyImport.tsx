import { Box, Button, TextareaAutosize, Typography } from '@mui/material';
import React, { useState } from 'react';

import { KEY_TYPE } from '@/shared/constant/algo-constants';
import { type PublicKeyAccount } from '@/shared/types/wallet-types';
import { LLSpinner } from '@/ui/components/LLSpinner';
import PasswordTextarea from '@/ui/components/password/PasswordTextarea';
import { useWallet } from '@/ui/hooks/use-wallet';
import { COLOR_DARKMODE_WHITE_3pc } from '@/ui/style/color';

const KeyImport = ({
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
      const accounts: (PublicKeyAccount & { type: string })[] = result.map((a) => ({
        ...a,
        type: KEY_TYPE.PRIVATE_KEY,
      }));
      onImport(accounts);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: '0' }}>
      <form
        id="seed"
        onSubmit={handleImport}
        style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
      >
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
          }}
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
    </Box>
  );
};

export default KeyImport;
