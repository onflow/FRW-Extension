import { Box, Button, TextareaAutosize, Typography } from '@mui/material';
import React, { useState } from 'react';

import { KEY_TYPE } from '@onflow/flow-wallet-shared/constant/algo-constants';
import { type PublicKeyAccount } from '@onflow/flow-wallet-shared/types/wallet-types';

import KeyPathInput from '@/ui/components/KeyPathInputs';
import { LLSpinner } from '@/ui/components/LLSpinner';
import PasswordTextarea from '@/ui/components/password/PasswordTextarea';
import { useWallet } from '@/ui/hooks/use-wallet';
import { COLOR_DARKMODE_WHITE_3pc } from '@/ui/style/color';

const SeedPhraseImport = ({
  onOpen,
  onImport,
  setMnemonic,
  isSignLoading,
  path,
  setPath,
  phrase,
  setPhrase,
}: {
  onOpen: () => void;
  onImport: (accounts: PublicKeyAccount[]) => void;
  setMnemonic: (mnemonic: string) => void;
  isSignLoading: boolean;
  path: string;
  setPath: (path: string) => void;
  phrase: string;
  setPhrase: (phrase: string) => void;
}) => {
  const usewallet = useWallet();
  const [isLoading, setLoading] = useState(false);

  const handleImport = async (e) => {
    try {
      setLoading(true);
      e.preventDefault();
      const seed = e.target[0].value.trim().split(/\s+/g).join(' ');
      setMnemonic(seed);
      const flowAddressRegex = /^(0x)?[0-9a-fA-F]{16}$/;
      const inputValue = e.target[2].value;
      const address = flowAddressRegex.test(inputValue) ? inputValue : null;

      // Check if the seed phrase is valid
      // If address is provided, check if the address is associated with the seed phrase
      // The address method uses fcl, to query the flow address then checks the public key matches
      // Otherwise we use the key indexer to find the address.
      // The address method is help the user double check they are importing the correct seed phrase for the address they want to access
      const result = await usewallet.findAddressWithSeedPhrase(seed, address, path, phrase);
      if (!result || result.length === 0) {
        // Couldn't import the seed phrase... there's no account found on the network
        onOpen();
        return;
      }
      const accounts: (PublicKeyAccount & { type: string; mnemonic: string })[] = result.map(
        (a) => ({
          ...a,
          type: KEY_TYPE.SEED_PHRASE,
          mnemonic: seed,
        })
      );
      onImport(accounts);
      // TODO: We need to catch errors and show them to the user
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
          minRows={4}
          placeholder={chrome.i18n.getMessage('Import_12_or_24_words')}
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
        <KeyPathInput path={path} setPath={setPath} phrase={phrase} setPhrase={setPhrase} />
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

export default SeedPhraseImport;
