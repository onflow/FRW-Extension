'use client';

import { Box, Tooltip, Typography } from '@mui/material';
import React from 'react';

import type {
  CoinItem,
  CustomFungibleTokenInfo,
  EvmCustomTokenInfo,
} from '@onflow/flow-wallet-shared/types/coin-types';
import { isValidFlowAddress } from '@onflow/flow-wallet-shared/utils/address';

export const SecurityCard: React.FC<{
  tokenInfo: CoinItem | CustomFungibleTokenInfo | EvmCustomTokenInfo;
}> = ({ tokenInfo }) => {
  return (
    <Box
      sx={{
        backgroundColor: '#121212',
        borderRadius: '12px',
        p: 2,
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Typography>Security</Typography>
      </Box>

      <Box sx={{ mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 0.5,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Verified
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tokenInfo && 'isVerified' in tokenInfo && tokenInfo.isVerified ? 'Yes' : 'No'}
          </Typography>
        </Box>
        {tokenInfo.address && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 0.5,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              Contract Address
            </Typography>
            <Tooltip title={tokenInfo.address} arrow placement="top">
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => {
                  if (tokenInfo.address) {
                    const url = isValidFlowAddress(tokenInfo.address)
                      ? `https://flowscan.io/account/${tokenInfo.address}`
                      : `https://flowscan.io/evm/address/${tokenInfo.address}?tab=contract`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                {tokenInfo.address &&
                  (tokenInfo.address.length > 10
                    ? `${tokenInfo.address.slice(0, 5)}...${tokenInfo.address.slice(-5)}`
                    : tokenInfo.address)}
              </Typography>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SecurityCard;
