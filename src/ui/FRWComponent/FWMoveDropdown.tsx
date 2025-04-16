import {
  Box,
  Typography,
  Avatar,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect, useCallback } from 'react';

import { type Contact } from '@/shared/types/network-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import { useWallet, isEmoji, formatAddress } from 'ui/utils';

interface FWMoveDropdownProps {
  contacts: Contact[];
  setSelectedChildAccount: (account: Contact) => void;
  isLoading?: boolean;
}

export const FWMoveDropdown: React.FC<FWMoveDropdownProps> = ({
  contacts,
  setSelectedChildAccount,
  isLoading = false,
}) => {
  const [selectedChild, setSelectedChild] = React.useState(
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

  return (
    <>
      <FormControl sx={{ flexGrow: 1, border: 'none', padding: 0 }}>
        <Select
          labelId="child-wallet-select-label"
          value={selectedChild}
          onChange={handleChange}
          disableUnderline
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
            height: '100%',
          }}
        >
          {contacts.map((contact) => (
            <MenuItem key={contact.address} value={contact.address}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <Box sx={{ display: 'flex' }}>
                  {isEmoji(contact.avatar) ? (
                    <Typography
                      sx={{
                        mr: '4px',
                        color: 'primary.main',
                        backgroundColor: '#484848',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        fontSize: '32px', // Adjust font size to fit within the box
                      }}
                    >
                      {contact.avatar}
                    </Typography>
                  ) : (
                    <Avatar
                      src={contact.avatar}
                      sx={{
                        height: '32px',
                        width: '32px',
                        borderRadius: '32px',
                        marginRight: '4px',
                      }}
                    />
                  )}
                </Box>

                <Typography
                  sx={{ textAlign: 'start', color: '#FFFFFF', fontSize: '14px', fontWeight: '600' }}
                >
                  {contact.contact_name}
                </Typography>
                <Typography
                  sx={{ lineHeight: '1', textAlign: 'start', fontSize: '12px', fontWeight: '400' }}
                  color="#FFFFFFCC"
                >
                  {formatAddress(contact.address)}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};
