import { Avatar, Box, Typography } from '@mui/material';
import React from 'react';

import { useWallet } from '@/ui/hooks/use-wallet';

export const FRWChildProfile = ({ contact, address, isLoading = false }) => {
  const usewallet = useWallet();

  const getName = (name: string) => {
    if (!name) {
      return '0x';
    }
    if (name.startsWith('0')) {
      return '0x';
    } else {
      return name[0].toUpperCase();
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          padding: '16px',
          alignItems: 'center',
          borderRadius: '16px',
          backgroundColor: '#2C2C2C',
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={contact.thumbnail.url}
            sx={{ height: '40px', width: '40px', borderRadius: '12px', marginRight: '12px' }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <Typography sx={{ textAlign: 'start', color: '#FFFFFF', fontSize: '12px' }}>
              {contact.name}
            </Typography>
            <Typography
              sx={{ lineHeight: '1', textAlign: 'start', fontSize: '12px', fontWeight: '400' }}
              color="#FFFFFFCC"
            >
              {address}
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};
