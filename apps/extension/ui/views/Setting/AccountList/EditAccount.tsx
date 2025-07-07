import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  ListItem,
  ListItemButton,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import emojis from '@/shared/constant/emoji.json';
import { isValidEthereumAddress } from '@/shared/utils/address';
import { consoleError } from '@/shared/utils/console-log';
import { useWallet } from '@/ui/hooks/use-wallet';

interface MoveBoardProps {
  showMoveBoard: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  updateProfileEmoji: (emoji: any) => void;
  emoji: any;
  userWallet: any;
  address: string;
}

const EditAccount = (props: MoveBoardProps) => {
  const usewallet = useWallet();
  const [selectedEmoji, setSelectEmoji] = useState<any>(null);
  const [customName, setCustomName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const requestWalletInfo = useCallback(async () => {
    // Use userWallet data as default, fall back to props.emoji if no userWallet data
    const defaultEmoji = {
      emoji: props.userWallet?.icon || props.emoji?.emoji || '',
      name: props.userWallet?.name || props.emoji?.name || '',
      bgcolor: props.userWallet?.color || props.emoji?.bgcolor || '',
    };

    setSelectEmoji(defaultEmoji);
    setCustomName(defaultEmoji.name || '');
  }, [props.emoji, props.userWallet]);

  const changeAccount = async () => {
    try {
      setIsLoading(true);
      let childType = '';
      if (isValidEthereumAddress(props.address)) {
        childType = 'evm';
      }

      // Use custom name if provided, otherwise use emoji name
      const finalName = customName.trim() || selectedEmoji.name;

      // Call the API to update account metadata
      await usewallet.updateAccountMetadata(
        props.address,
        selectedEmoji.emoji,
        finalName,
        selectedEmoji.bgcolor
      );

      // Update local state with the final name
      const updatedEmoji = {
        ...selectedEmoji,
        name: finalName,
      };

      setSelectEmoji(updatedEmoji);
      props.updateProfileEmoji(updatedEmoji);
      props.handleAddBtnClicked();
    } catch (error) {
      consoleError('Failed to update account metadata:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  const selectEmoji = async (emoji) => {
    setSelectEmoji(emoji);
    setCustomName(emoji.name || '');
  };

  useEffect(() => {
    requestWalletInfo();
  }, [props.emoji, props.userWallet, requestWalletInfo]);

  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1000 !important' }}
      transitionDuration={300}
      open={props.showMoveBoard}
      PaperProps={{
        sx: {
          width: '100%',
          height: 'auto',
          padding: '18px',
          marginBottom: '89px',
          background: 'none',
          borderRadius: '16px',
        },
      }}
    >
      <Box sx={{ background: '#2C2C2C', borderRadius: '16px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', px: '16px' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              height: '24px',
              margin: '20px 0 12px',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="body1"
              component="div"
              display="inline"
              color="text"
              sx={{
                fontSize: '18px',
                fontFamily: 'Inter',
                textAlign: 'center',
                lineHeight: '24px',
                fontWeight: '700',
              }}
            >
              {chrome.i18n.getMessage('edit_wallet')}
            </Typography>
          </Box>

          <Box
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'column',
              display: 'flex',
            }}
          >
            {selectedEmoji && (
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                }}
              >
                {isLoading && (
                  <CircularProgress
                    size={'80px'}
                    sx={{
                      position: 'absolute',
                      color: '#41CC5D',
                      zIndex: 0,
                    }}
                  />
                )}
                <Box
                  sx={{
                    display: 'flex',
                    height: '64px',
                    width: '64px',
                    borderRadius: '32px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selectedEmoji['bgcolor'],
                    zIndex: 1,
                  }}
                >
                  <Typography sx={{ fontSize: '50px', fontWeight: '600' }}>
                    {selectedEmoji.emoji}
                  </Typography>
                </Box>
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '8px',
                my: '16px',
              }}
            >
              {emojis.emojis.map((emoji, index) => (
                <ListItem
                  key={index}
                  disablePadding
                  sx={{
                    display: 'flex',
                    height: '32px',
                    width: '32px',
                    borderRadius: '32px',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ListItemButton
                    onClick={() => selectEmoji(emoji)}
                    sx={{
                      display: 'flex',
                      height: '32px',
                      width: '32px',
                      borderRadius: '32px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: emoji['bgcolor'],
                      border: selectedEmoji === emoji ? '2px solid #41CC5D' : 'none',
                    }}
                  >
                    <Typography sx={{ fontSize: '20px', fontWeight: '600' }}>
                      {emoji.emoji}
                    </Typography>
                  </ListItemButton>
                </ListItem>
              ))}
            </Box>
            <Box
              sx={{
                width: '100%',
                mb: '24px',
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder={selectedEmoji?.name || 'Enter custom name'}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#FFFFFF',
                    backgroundColor: 'transparent',
                    border: '1px solid #FFFFFFCC',
                    borderRadius: '16px',
                    height: '46px',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: 'none',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: '600',
                    '&::placeholder': {
                      color: '#FFFFFFCC',
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                mb: '24px',
                width: '100%',
              }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={props.handleCancelBtnClicked}
                sx={{
                  backgroundColor: '#E5E5E5',
                  display: 'flex',
                  flexGrow: 1,
                  height: '48px',
                  width: '100%',
                  borderRadius: '8px',
                  textTransform: 'capitalize',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    color: '#000000CC',
                  }}
                >
                  {chrome.i18n.getMessage('Cancel')}
                </Typography>
              </Button>

              <Button
                variant="contained"
                color="primary"
                onClick={() => changeAccount()}
                disabled={isLoading}
                size="large"
                sx={{
                  display: 'flex',
                  flexGrow: 1,
                  height: '48px',
                  borderRadius: '8px',
                  textTransform: 'capitalize',
                  width: '100%',
                }}
              >
                {isLoading ? (
                  <CircularProgress size={20} sx={{ color: '#000000CC' }} />
                ) : (
                  <Typography
                    sx={{
                      fontWeight: '600',
                      fontSize: '14px',
                      fontFamily: 'Inter',
                    }}
                    color="#000000CC"
                  >
                    {chrome.i18n.getMessage('Save')}
                  </Typography>
                )}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default EditAccount;
