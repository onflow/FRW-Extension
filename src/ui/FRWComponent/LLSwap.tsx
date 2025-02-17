import { Box, Typography, Avatar, Skeleton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React from 'react';

export const LLSwap = ({ token, amount, isLoading = false }) => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          px: '0',
          py: '8px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {!isLoading ? (
          <Avatar
            alt={token.contract_name}
            src={token.icon}
            sx={{
              mr: '0',
              marginBottom: '8px',
              color: '#fff',
              backgroundColor: '#484848',
              width: '40px',
              height: '40px',
            }}
          >
            {token.contract_name}
          </Avatar>
        ) : (
          <Skeleton variant="circular" width={40} height={40} />
        )}
        {!isLoading ? (
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            <Box display="inline" color="#fff">
              {amount + ' ' + token.symbol}
            </Box>
          </Typography>
        ) : (
          <Skeleton variant="text" width={45} height={15} />
        )}
        <Box sx={{ flexGrow: 1 }} />
      </Box>
    </>
  );
};
