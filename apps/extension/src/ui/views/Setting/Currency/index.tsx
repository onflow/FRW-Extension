import { Box, CircularProgress, List, ListItem, ListItemButton, Typography } from '@mui/material';
import React, { useCallback } from 'react';

import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import { LLHeader } from '@/ui/components';
import { useCurrency, useSupportedCurrencies } from '@/ui/hooks/preference-hooks';
import { useWallet, useWalletLoaded } from '@/ui/hooks/use-wallet';

const CurrencySettings = () => {
  const walletLoaded = useWalletLoaded();
  const wallet = useWallet();
  const currentCurrency = useCurrency();
  const supportedCurrencies = useSupportedCurrencies();
  const isLoading = currentCurrency === undefined;

  const handleCurrencyChange = useCallback(
    async (newCurrency: string) => {
      try {
        const currency = supportedCurrencies?.find((c) => c.code === newCurrency);
        if (currency) {
          await wallet.setDisplayCurrency(currency);
        }
      } catch (error) {
        consoleError('Error saving currency preference:', error);
      }
    },
    [wallet, supportedCurrencies]
  );

  if (!walletLoaded || isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="page">
      <LLHeader
        title={chrome.i18n.getMessage('Display__Currency')}
        help={false}
        goBackLink="/dashboard/setting"
      />
      <Box
        sx={{
          width: '90%',
          margin: '10px auto',
          backgroundColor: '#282828',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          gap: '8px',
        }}
      >
        <Typography variant="body1" color="neutral.contrastText" style={{ fontWeight: 600 }}>
          {chrome.i18n.getMessage('Select__Currency')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {chrome.i18n.getMessage('Currency__Description')}
        </Typography>
        <List
          sx={{
            width: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#1A1A1A',
            '&:hover': {
              backgroundColor: '#1A1A1A',
            },
          }}
        >
          {supportedCurrencies?.map((curr) => (
            <ListItem
              key={curr.code}
              component="div"
              onClick={() => handleCurrencyChange(curr.code)}
              sx={{
                height: '48px',
                width: '100%',
                overflow: 'hidden',
                '&:hover': {
                  backgroundColor: '#333333',
                },
                backgroundColor: curr.code === currentCurrency?.code ? '#333333' : 'transparent',
              }}
              disablePadding
            >
              <ListItemButton
                sx={{
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 16px',
                }}
              >
                <Typography color="neutral.contrastText">
                  {curr.code} ({curr.symbol}) {curr.name}
                </Typography>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </div>
  );
};

export default CurrencySettings;
