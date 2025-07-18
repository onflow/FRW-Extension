import { generateOnRampURL } from '@coinbase/cbpay-js';
import CloseIcon from '@mui/icons-material/Close';
import { ButtonBase, IconButton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Box } from '@mui/system';
import React, { useCallback, useEffect, useState } from 'react';

// import theme from '../../style/LLTheme';
// import { initOnRamp } from '@coinbase/cbpay-js';
// import { LLHeader } from '@/ui/components';
// import Coinbase from '@/ui/assets/svg/coinbasepay-txt.svg';

import Coinbase from '@/ui/assets/svg/coinbase-pay.svg';
import MoonPay from '@/ui/assets/svg/moonpay.svg';
import { useWallet } from '@/ui/hooks/use-wallet';

const OnRampList = ({ close }) => {
  const wallet = useWallet();
  const [address, setAddress] = useState<string | null>(null);

  const loadAddress = useCallback(async () => {
    const address = await wallet.getCurrentAddress();
    setAddress(address);
  }, [wallet]);

  useEffect(() => {
    loadAddress();
  }, [loadAddress]);

  const loadMoonPay = async () => {
    if (!address) {
      return;
    }

    // If for only one currency
    // &currencyCode=Flow
    const url = `https://buy.moonpay.com?apiKey=pk_live_6YNhgtZH8nyxkJiQRZsotO69G2loIyv0&defaultCurrencyCode=FLOW&colorCode=%23FC814A&walletAddress=${address}`;
    const response = await wallet.openapi.getMoonpayURL(url);

    if (response?.data?.url) {
      wallet.trackOnRampClicked('moonpay');
      await chrome.tabs.create({
        url: response?.data?.url,
      });
    }
  };

  const loadCoinbasePay = async () => {
    if (!address) {
      return;
    }

    const onRampURL = generateOnRampURL({
      appId: 'd22a56bd-68b7-4321-9b25-aa357fc7f9ce',
      destinationWallets: [{ address: address, blockchains: ['flow'] }],
    });

    if (onRampURL) {
      // Track before opening the tab
      wallet.trackOnRampClicked('coinbase');

      await chrome.tabs.create({
        url: onRampURL,
      });
    }
  };

  return (
    <Box>
      <Grid
        container
        sx={{
          justifyContent: 'start',
          alignItems: 'center',
          px: '8px',
        }}
      >
        <Grid size={1}></Grid>
        <Grid size={10}>
          <Typography variant="h1" align="center" py="14px" fontWeight="bold" fontSize="20px">
            {chrome.i18n.getMessage('Choose_provider')}
          </Typography>
        </Grid>
        <Grid size={1}>
          <IconButton onClick={close}>
            <CloseIcon sx={{ color: 'icon.navi' }} />
          </IconButton>
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', mx: '18px' }}>
        <ButtonBase
          sx={{ width: '100%', backgroundColor: '#242424', borderRadius: '12px', height: '80px' }}
          onClick={loadMoonPay}
        >
          <img src={MoonPay} style={{ height: '40px' }} />
        </ButtonBase>

        <ButtonBase
          sx={{ width: '100%', backgroundColor: '#0052FF', borderRadius: '8px', height: '80px' }}
          onClick={loadCoinbasePay}
        >
          <img src={Coinbase} style={{ height: '50px' }} />
        </ButtonBase>
      </Box>
    </Box>
  );
};

export default OnRampList;
