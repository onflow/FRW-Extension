import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { Box, Typography, Avatar, IconButton, CardMedia, Skeleton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { ContactType } from '@/shared/types/network-types';
import closex from 'ui/assets/closex.svg';
import { useWallet, formatAddress } from 'ui/utils';

const useStyles = makeStyles(() => ({
  ContactCardAvatar: {
    mr: '13px',
    color: 'primary.main',
    backgroundColor: 'neutral.main',
  },
  ContactCardContainer: {
    display: 'flex',
    // border: '1px solid #4C4C4C',
    // borderRadius: '8px',
    // padding: ''
    alignItems: 'center',
    px: '18px',
  },
}));

export const LLContactEth = ({ contact, hideCloseButton, isSend = false, isLoading = false }) => {
  const classes = useStyles();
  const wallet = useWallet();

  const history = useHistory();
  const [contactAdd, setContactAdd] = useState(false);

  const DomainLogo = () => {
    if (contact.domain?.value === '') {
      return undefined;
    }
  };

  const getName = (name: string) => {
    if (name.startsWith('0')) {
      return '0x';
    } else {
      return name[0].toUpperCase();
    }
  };

  const addAddressBook = async (contact) => {
    if (!contact.domain.value) {
      wallet.openapi
        .addAddressBook(contact.contact_name, contact.address, contact.contact_name)
        .then((response) => {
          if (response.status === 200) {
            setContactAdd(true);
            wallet.refreshAddressBook();
          }
        });
    } else {
      wallet.openapi
        .addExternalAddressBook(
          contact.domain.value,
          contact.address,
          contact.domain.value,
          contact.domain.domain_type
        )
        .then((response) => {
          if (response.status === 200) {
            setContactAdd(true);
            wallet.refreshAddressBook();
          }
        });
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
          <Box
            sx={{
              display: 'flex',
              mr: '13px',
              height: '40px',
              width: '40px',
              borderRadius: '32px',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: contact['bgcolor'],
            }}
          >
            <Typography sx={{ fontSize: '28px', fontWeight: '600' }}>{contact.avatar}</Typography>
          </Box>
        ) : (
          <Skeleton variant="circular" width={40} height={40} />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {!isLoading ? (
            <Typography variant="body1" sx={{ textAlign: 'start' }}>
              {contact.domain?.value || formatAddress(contact.contact_name)}{' '}
              {contact.username && contact.username !== '' && (
                <Box display="inline" color="info.main">
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
        {isSend ? (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              history.push(`/dashboard/token/flow/send/${contact.address}`);
            }}
          >
            <CardMedia sx={{ width: '11px', height: '11px' }} image={closex} />
          </IconButton>
        ) : contact.contact_type === ContactType.User && !contactAdd ? (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              addAddressBook(contact);
            }}
          >
            <PersonAddAltIcon color="info" />
          </IconButton>
        ) : (
          <div />
        )}
      </Box>
    </>
  );
};
