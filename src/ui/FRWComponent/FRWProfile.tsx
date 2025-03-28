import { Box, Typography, Avatar, Skeleton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect, useCallback } from 'react';

import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useWallet, formatAddress, isEmoji } from 'ui/utils';

const tempEmoji = {
  emoji: '🥥',
  name: '',
  bgcolor: '',
};

export const FRWProfile = ({ contact, isLoading = false, isEvm = false, fromEvm = '1' }) => {
  const usewallet = useWallet();
  const { currentWallet, evmWallet } = useProfiles();
  const [emoji, setEmoji] = useState(tempEmoji);
  const [isload, setLoad] = useState(true);

  const getEmoji = useCallback(async () => {
    setLoad(true);
    if (isEvm) {
      console.log('getEvmWallet ', evmWallet);
      const emojiObject = tempEmoji;
      emojiObject.emoji = evmWallet.icon || '';
      emojiObject.name = evmWallet.name || '';
      emojiObject.bgcolor = evmWallet.color || '';
      emojiObject['type'] = 'evm';
      setEmoji(emojiObject);
      setLoad(false);
    } else {
      const emojiObject = tempEmoji;
      emojiObject.emoji = currentWallet.icon;
      emojiObject.name = currentWallet.name;
      emojiObject.bgcolor = currentWallet.color;
      emojiObject['type'] = 'parent';
      setEmoji(emojiObject);
      setLoad(false);
    }
  }, [isEvm, currentWallet, evmWallet]);

  useEffect(() => {
    getEmoji();
  }, [contact, getEmoji]);

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
        {!isLoading && !isload ? (
          <Box
            sx={{
              display: 'flex',
              height: '40px',
              width: '40px',
              borderRadius: '32px',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: emoji['bgcolor'],
            }}
          >
            <Typography sx={{ fontSize: '28px', fontWeight: '600' }}>
              {isEmoji(contact.avatar) ? contact.avatar : emoji.emoji}
            </Typography>
          </Box>
        ) : (
          <Skeleton variant="circular" width={40} height={40} />
        )}
        {!isLoading && !isload ? (
          <Typography sx={{ textAlign: 'start', color: '#FFFFFF', fontSize: '12px' }}>
            {isEmoji(contact.avatar) ? contact.contact_name : emoji.name}
          </Typography>
        ) : (
          <Skeleton variant="text" width={45} height={15} />
        )}

        {!isLoading && !isload ? (
          <Typography
            sx={{ lineHeight: '1', textAlign: 'start', fontSize: '12px', fontWeight: '400' }}
            color="#FFFFFFCC"
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
