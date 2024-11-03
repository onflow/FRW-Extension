import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Skeleton } from '@mui/material';
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

export const FRWProfileCard = ({ contact, isEvm = false, isLoading = false }) => {

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
        {!isLoading ?

          <Box sx={{
            display: 'flex', height: '40px', width: '40px', borderRadius: '32px', alignItems: 'center', justifyContent: 'center', backgroundColor: emoji['bgcolor'], marginRight: '12px'
          }}>
            <Typography sx={{ fontSize: '28px', fontWeight: '600' }}>
              {emoji.emoji}
            </Typography>
          </Box>
          : (
            <Skeleton variant="circular" width={40} height={40} />
          )
        }
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {!isLoading ?
            <Typography sx={{ textAlign: 'start', color: '#FFFFFF', fontSize: '12px' }}>
              {emoji.name}
              {isValidEthereumAddress(contact.address) &&
                <Typography
                  variant="body1"
                  component="span"
                  color="#FFF"
                  fontSize={'9px'}
                  sx={{
                    backgroundColor: '#7986CC',
                    padding: '0 8px',
                    borderRadius: '18px',
                    textAlign: 'center',
                    marginLeft: '8px',
                    lineHeight: '16px',
                    height: '16px',
                    display: 'inline-block'
                  }}
                >
                  EVM
                </Typography>
              }
            </Typography> : (
              <Skeleton variant="text" width={45} height={15} />
            )}
          {!isLoading ?
            <Typography
              sx={{ lineHeight: '1', textAlign: 'start', fontSize: '12px', fontWeight: '400' }}
              color="#FFFFFFCC"
            >
              {`${formatAddress(contact.address)}`}
            </Typography>
            : (
              <Skeleton variant="text" width={45} height={15} />
            )}
        </Box>
        <Box sx={{ flexGrow: 1 }} />
      </Box>
    </ThemeProvider>
  );
};
