import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { Box, Typography, Avatar, IconButton, CardMedia, Skeleton } from '@mui/material';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import closex from 'ui/assets/closex.svg';
import { useWallet, formatAddress, isEmoji } from 'ui/utils';

export const ContactCard = ({ contact, tokenInfo, isLoading = false }) => {
  const history = useHistory();

  const getName = (name: string) => {
    if (name.startsWith('0')) {
      return '0x';
    } else if (name.length > 0) {
      return name[0].toUpperCase();
    } else {
      return '0x';
    }
  };
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          // border: '1px solid #4C4C4C',
          // borderRadius: '8px',
          px: '18px',
          py: '8px',
          // borderRadius: '16px',
          alignItems: 'center',
          ':hover': {
            backgroundColor: 'neutral.main',
          },
        }}
      >
        {!isLoading ? (
          isEmoji(contact.avatar) ? (
            <Typography
              sx={{
                mr: '13px',
                color: 'primary.main',
                backgroundColor: '#484848',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                fontSize: '24px', // Adjust font size to fit within the box
              }}
            >
              {contact.avatar}
            </Typography>
          ) : (
            <Avatar
              alt={contact.contact_name}
              src={contact.avatar}
              sx={{
                mr: '13px',
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
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {!isLoading ? (
            <Typography variant="body1" sx={{ textAlign: 'start' }}>
              {contact.domain?.value || formatAddress(contact.contact_name)}{' '}
              {contact.username && contact.username !== '' && (
                <Box component="span" sx={{ color: 'info.main' }}>
                  {contact.username !== '' ? ' (@' + contact.username + ')' : ''}
                </Box>
              )}
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
              {formatAddress(contact.address)}
            </Typography>
          ) : (
            <Skeleton variant="text" width={45} height={15} />
          )}
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            history.push(`/dashboard/token/${tokenInfo.unit}/send`);
          }}
        >
          <CardMedia sx={{ width: '11px', height: '11px' }} image={closex} />
        </IconButton>
      </Box>
    </>
  );
};
