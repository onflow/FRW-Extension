import { Typography, Box } from '@mui/material';
import { ButtonBase } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { useWallet } from 'ui/utils';

import Claim from '../../FRWAssets/image/claim.png';

const ClaimTokenCard = ({ token }) => {
  const wallet = useWallet();
  const [network, setNetwork] = useState('testnet');

  const loadNetwork = async () => {
    const currentNetwork = await wallet.getNetwork();
    setNetwork(currentNetwork);
  };

  useEffect(() => {
    loadNetwork();
  }, []);

  return (
    <ButtonBase
      onClick={() => {
        window.open(`https://${network}-faucet.onflow.org/fund-account`, '_blank');
      }}
    >
      <Box
        sx={{
          width: '100%',
          backgroundColor: 'background.default',
          display: 'flex',
          px: '18px',
          py: '12px',
          borderRadius: '12px',
          justifyContent: 'flex-satrt',
          alignItems: 'center',
          '&:hover': {
            backgroundColor: 'neutral.main',
          },
        }}
      >
        <img
          src={Claim}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '30px',
            padding: '5px',
            backgroundColor: '#282828',
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '2px', flexDirection: 'column' }}>
          <Typography variant="body1" sx={{ fontSize: '16px' }}>
            {chrome.i18n.getMessage('Claim_Testnet')}
            {token.toUpperCase()}
            {chrome.i18n.getMessage('tokens')}{' '}
          </Typography>
          <Typography
            variant="body1"
            color="neutral2.main"
            sx={{ fontWeight: 'medium', fontSize: '14px' }}
          >
            {chrome.i18n.getMessage('Go_to_flow_faucet_to_get_some_tokens')}
          </Typography>
        </Box>
      </Box>
    </ButtonBase>
  );
};

export default ClaimTokenCard;
