import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Skeleton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../style/LLTheme';
import { makeStyles } from '@mui/styles';
import { useWallet, formatAddress } from 'ui/utils';
import { isValidEthereumAddress } from 'ui/utils/address';


const tempEmoji = {
  "emoji": "🥥",
  "name": "Coconut",
  "bgcolor": "#FFE4C4"
};

export const FRWChildProfile = ({ contact, address, isLoading = false }) => {

  const usewallet = useWallet();
  const [emoji, setEmoji] = useState(tempEmoji);




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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={contact.thumbnail.url} sx={{ height: '40px', width: '40px', borderRadius: '12px', marginRight: '12px' }} />
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
    </ThemeProvider>
  );
};
