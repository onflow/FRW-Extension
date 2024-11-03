import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CardMedia
} from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { formatAddress } from 'ui/utils';
import { useWallet } from 'ui/utils';


const tempEmoji = {
  "emoji": "🥥",
  "name": "Coconut",
  "bgcolor": "#FFE4C4"
};

const TransferTo = ({ wallet, userInfo }) => {


  const usewallet = useWallet();
  const [emoji, setEmoji] = useState(tempEmoji);

  const getEmoji = async () => {
    const emojiList = await usewallet.getEmoji();
    setEmoji(emojiList[1])
  }

  useEffect(() => {
    getEmoji();
  }, [userInfo]);

  return (
    <StyledEngineProvider injectFirst>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        zIndex: '10'
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          px: '4px',
          backgroundColor: 'neutral.main',
          zIndex: 1000
        }}>
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', padding: '8px' }}>
            <Box sx={{
              display: 'flex', height: '40px', width: '40px', borderRadius: '32px', alignItems: 'center', justifyContent: 'center', backgroundColor: emoji['bgcolor'], marginRight: '12px'
            }}>
              <Typography sx={{ fontSize: '28px', fontWeight: '600' }}>
                {emoji.emoji}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '14px', fontWeight: '600' }}>
                  {emoji.name}
                </Typography>
                <Typography
                  variant="body1"
                  component="span"
                  color="#FFF"
                  fontSize={'9px'}
                  sx={{
                    backgroundColor: '#627EEA',
                    padding: '0 8px',
                    borderRadius: '18px',
                    textAlign: 'center',
                    marginLeft: '8px',
                    lineHeight: '19px'
                  }}
                >
                  EVM
                </Typography>
              </Box>

              <Typography sx={{ fontSize: '12px', fontWeight: '400', color: '#FFFFFFCC' }}>{formatAddress(wallet)}</Typography>
            </Box>

          </Box>
        </Box>
      </Box>
    </StyledEngineProvider>
  );
};

export default TransferTo;
