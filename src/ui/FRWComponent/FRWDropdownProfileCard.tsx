import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Skeleton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../style/LLTheme';
import { makeStyles } from '@mui/styles';
import { useWallet, formatAddress, isEmoji } from 'ui/utils';
import { isValidEthereumAddress } from 'ui/utils/address';


const tempEmoji = {
  "emoji": "🥥",
  "name": "Coconut",
  "bgcolor": "#FFE4C4"
};

export const FRWDropdownProfileCard = ({ contact, contacts, setSelectedChildAccount, isLoading = false }) => {

  const usewallet = useWallet();
  const [emoji, setEmoji] = useState(tempEmoji);

  const contactKeys = Object.keys(contacts);
  const [selectedChild, setSelectedChild] = React.useState(contactKeys.length > 0 ? contactKeys[0] : '');

  useEffect(() => {
    if (selectedChild) {
      const select = contacts[selectedChild]
      select['address'] = selectedChild
      setSelectedChildAccount(select);
    }
  }, [selectedChild, contacts, setSelectedChildAccount]);

  const handleChange = (event) => {
    const selectedAddress = event.target.value;
    setSelectedChild(selectedAddress);
    const select = contacts[selectedChild]
    select['address'] = selectedChild
    setSelectedChildAccount(select);
  };

  const getName = (name: string) => {
    if (!name) {
      return '0x'
    }
    if (name.startsWith('0')) {
      return '0x'
    } else {
      return name[0].toUpperCase()
    }
  }

  const getEmoji = async () => {
    const emojiList = await usewallet.getEmoji();
    if (isValidEthereumAddress(contact.address)) {
      setEmoji(emojiList[1])
    } else {
      setEmoji(emojiList[0])
    }
  }


  useEffect(() => {
    getEmoji();
  }, [contact]);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          padding: '16px',
          alignItems: 'center',
          borderRadius: '16px',
          backgroundColor: '#2C2C2C',
          width: '100%'
        }}
      >
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
                border: 'none'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              }, height: '40px'
            }}
          >
            {Object.keys(contacts).map((address) => (
              <MenuItem key={address} value={address}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {!isLoading ? (
                    isEmoji(contacts[address].thumbnail.url) ? (
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
                        {contacts[address].thumbnail.url}
                      </Typography>
                    ) : (
                      <Avatar
                        alt={contacts[address]}
                        src={contacts[address].thumbnail.url}
                        sx={{
                          mr: '13px',
                          color: 'primary.main',
                          backgroundColor: '#484848',
                          width: '40px',
                          height: '40px',
                        }}
                      >
                        {getName(contacts[address].name)}
                      </Avatar>
                    )
                  ) : (
                    <Skeleton variant="circular" width={40} height={40} />
                  )}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <Typography sx={{ textAlign: 'start', color: '#FFFFFF', fontSize: '12px' }}>
                      {contacts[address].name}
                    </Typography>
                    <Typography
                      sx={{ lineHeight: '1', textAlign: 'start', fontSize: '12px', fontWeight: '400' }}
                      color="#FFFFFFCC"
                    >
                      {formatAddress(address)}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </ThemeProvider>
  );
};
