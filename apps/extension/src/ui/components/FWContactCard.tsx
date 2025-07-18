import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { Box, CardMedia, IconButton, Skeleton, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import { ContactType } from '@onflow/flow-wallet-shared/types/network-types';

import closex from '@/ui/assets/closex.svg';
import { useWallet } from '@/ui/hooks/use-wallet';
import { formatAddress } from '@/ui/utils';

export const FWContactCard = ({ contact, hideCloseButton, isSend = false, isLoading = false }) => {
  const wallet = useWallet();

  const navigate = useNavigate();
  const [contactAdd, setContactAdd] = useState(false);

  const DomainLogo = () => {
    if (contact.domain?.value === '') {
      return undefined;
    }
    switch (contact.domain?.domain_type) {
      case 0:
        return 'https://raw.githubusercontent.com/Outblock/Assets/main/ft/flow/logo.png';
      case 1:
        return 'https://raw.githubusercontent.com/Outblock/Assets/main/ft/flow/logo.png';
      case 2:
        return 'https://raw.githubusercontent.com/Outblock/Assets/main/ft/flow/logo.png';
      default:
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
        {isSend ? (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/token/flow/send/${contact.address}`);
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
