import {
  Avatar,
  Box,
  FormControl,
  MenuItem,
  Select,
  Skeleton,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import React, { useEffect } from 'react';

import { type Contact } from '@/shared/types/network-types';
import { formatAddress, isEmoji } from '@/ui/utils';

export const FRWDropdownProfileCard = ({
  contacts,
  setSelectedChildAccount,
  isLoading = false,
}: {
  contacts: Contact[];
  setSelectedChildAccount: (account: Contact) => void;
  isLoading?: boolean;
}) => {
  const [selectedChild, setSelectedChild] = React.useState<string>(
    contacts.length > 0 ? contacts[0].address : ''
  );
  useEffect(() => {
    if (selectedChild) {
      const select = contacts.find((contact) => contact.address === selectedChild);
      if (select) {
        setSelectedChildAccount(select);
      }
    }
  }, [selectedChild, contacts, setSelectedChildAccount]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedAddress = event.target.value;
    setSelectedChild(selectedAddress);
    const select = contacts.find((contact) => contact.address === selectedAddress);
    if (select) {
      setSelectedChildAccount(select);
    }
  };

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
        <FormControl sx={{ flexGrow: 1, border: 'none', padding: 0 }}>
          <Select
            labelId="child-wallet-select-label"
            value={selectedChild}
            onChange={handleChange as any}
            sx={{
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                padding: 0,
                border: 'none',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              height: '40px',
            }}
          >
            {contacts.map((contact) => (
              <MenuItem key={contact.address} value={contact.address}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <Typography sx={{ textAlign: 'start', color: '#FFFFFF', fontSize: '12px' }}>
                      {contact.contact_name}
                    </Typography>
                    <Typography
                      sx={{
                        lineHeight: '1',
                        textAlign: 'start',
                        fontSize: '12px',
                        fontWeight: '400',
                      }}
                      color="#FFFFFFCC"
                    >
                      {formatAddress(contact.address)}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </>
  );
};
