import { Box, Typography, Avatar, Skeleton } from '@mui/material';
import React from 'react';

import { formatAddress, isEmoji } from 'ui/utils';

export const LLProfile = ({ contact, isLoading = false }) => {
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
          flexDirection: 'column',
          px: '0',
          py: '8px',
          alignItems: 'center',
        }}
      >
        {!isLoading ? (
          isEmoji(contact.avatar) ? (
            <Box
              sx={{
                display: 'flex',
                height: '40px',
                width: '40px',
                borderRadius: '32px',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: contact['color'],
              }}
            >
              <Typography sx={{ fontSize: '28px', fontWeight: '600' }}>{contact.avatar}</Typography>
            </Box>
          ) : (
            <Avatar
              alt={contact.contact_name}
              src={contact.avatar}
              sx={{
                color: 'primary.main',
                backgroundColor: '#484848',
                width: '40px',
                height: '40px',
              }}
            >
              {getName(contact.contact_name)}
            </Avatar>
          )
        ) : (
          <Skeleton variant="circular" width={40} height={40} />
        )}

        {!isLoading ? (
          <Typography variant="body2" sx={{ textAlign: 'start' }}>
            {contact.domain?.value || formatAddress(contact.contact_name)}
          </Typography>
        ) : (
          <Skeleton variant="text" width={45} height={15} />
        )}
        {!isLoading ? (
          <Typography
            variant="overline"
            sx={{ lineHeight: '1', textAlign: 'start' }}
            color="text.secondary"
          >
            {`${formatAddress(contact.address)}`}
          </Typography>
        ) : (
          <Skeleton variant="text" width={45} height={15} />
        )}
        <Box sx={{ flexGrow: 1 }} />
      </Box>
    </>
  );
};
