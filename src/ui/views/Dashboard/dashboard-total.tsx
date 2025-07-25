import { Box, Typography, Button, Skeleton } from '@mui/material';
import React from 'react';

import { CurrencyValue } from '@/ui/components/TokenLists/CurrencyValue';
import { useWallet } from '@/ui/hooks/use-wallet';

interface DashboardSummaryProps {
  network: string;
  balance?: string;
  currencyCode?: string;
  currencySymbol?: string;
  noAddress?: boolean;
  addressCreationInProgress?: boolean;
}

export const DashboardTotal: React.FC<DashboardSummaryProps> = ({
  network,
  noAddress,
  addressCreationInProgress,
  balance,
  currencyCode,
  currencySymbol,
}: DashboardSummaryProps) => {
  const wallet = useWallet();
  const loading =
    balance === undefined ||
    currencyCode === undefined ||
    currencySymbol === undefined ||
    noAddress === undefined ||
    addressCreationInProgress === undefined;

  const handleAddAddress = () => {
    wallet.createNewAccount(network);
  };
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '66px',
        // Fix the height to prevent small pixel scrolling issue
        backgroundColor: 'background.default',
      }}
    >
      <Typography
        variant="body1"
        sx={{
          py: '8px',
          alignSelf: 'center',
          fontSize: '32px',
          fontWeight: 'semi-bold',
        }}
      >
        {noAddress ? (
          addressCreationInProgress ? (
            <Typography
              variant="body1"
              component="span"
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#777E90',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {chrome.i18n.getMessage('Address_creation_in_progress')}
            </Typography>
          ) : (
            <Button variant="contained" onClick={handleAddAddress}>
              {chrome.i18n.getMessage('Add_address')}
            </Button>
          )
        ) : !loading ? (
          <CurrencyValue
            value={balance}
            currencyCode={currencyCode ?? ''}
            currencySymbol={currencySymbol ?? ''}
          />
        ) : (
          <Skeleton variant="text" width={150} />
        )}
      </Typography>
    </Box>
  );
};
