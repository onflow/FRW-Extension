import React, { useState, useEffect } from 'react';
import { Box, Button, ListItemButton, Typography, Drawer, IconButton, ListItem, ListItemIcon, ListItemText, Avatar, CardMedia } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useWallet } from 'ui/utils';
import { useHistory } from 'react-router-dom';
import { isValidEthereumAddress } from 'ui/utils/address';
import homeMoveFt from 'ui/FRWAssets/svg/homeMoveFt.svg';
import moveSvg from 'ui/FRWAssets/svg/moveSvg.svg';
import emojis from 'background/utils/emoji.json';
import { profileHooks } from 'ui/utils/profileHooks'



interface MoveBoardProps {
  showMoveBoard: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  updateProfileEmoji: (emoji: any) => void;
  emoji: any;
  userWallet: any;
}


const EditProfile = (props: MoveBoardProps) => {

  const { updateEmojis } = profileHooks();

  const usewallet = useWallet();
  const history = useHistory();
  const [showSelectNft, setSelectBoard] = useState<boolean>(false);
  const [selectedEmoji, setSelectEmoji] = useState<any>(null);

  // console.log('props.loggedInAccounts', props.current)

  const requestChildType = async () => {
    setSelectEmoji(props.emoji);
  };

  const changeProfile = async () => {
    const address = props.userWallet[0].blockchain[0].address;
    let childType = ''
    if (isValidEthereumAddress(address)) {
      childType = 'evm'
    }
    await usewallet.setEmoji(selectedEmoji, childType);
    setSelectEmoji(selectedEmoji);
    updateEmojis();
    props.updateProfileEmoji(selectedEmoji);
    props.handleAddBtnClicked();
  };

  const selectEmoji = async (emoji) => {
    setSelectEmoji(emoji);
  };

  useEffect(() => {
    requestChildType();
  }, [props.emoji])

  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1000 !important' }}
      transitionDuration={300}
      open={props.showMoveBoard}
      PaperProps={{
        sx: { width: '100%', height: 'auto', padding: '18px', marginBottom: '89px', background: 'none', borderRadius: '16px', },
      }}
    >
      <Box sx={{ background: '#2C2C2C', borderRadius: '16px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', px: '16px', }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', height: '24px', margin: '20px 0 12px', alignItems: 'center', }}>
            <Typography
              variant="body1"
              component="div"
              display="inline"
              color='text'
              sx={{ fontSize: '18px', fontFamily: 'Inter', textAlign: 'center', lineHeight: '24px', fontWeight: '700' }}
            >
              {chrome.i18n.getMessage('edit_wallet')}
            </Typography>
          </Box>

          <Box
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'column',
              display: 'flex'
            }}
          >
            {selectedEmoji &&
              <Box sx={{
                display: 'flex', height: '64px', width: '64px', borderRadius: '32px', alignItems: 'center', justifyContent: 'center', backgroundColor: selectedEmoji['bgcolor'], marginRight: '12px'
              }}>
                <Typography sx={{ fontSize: '50px', fontWeight: '600' }}>
                  {selectedEmoji.emoji}
                </Typography>
              </Box>

            }
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
                    }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: '600' }}>
                      {emoji.emoji}
                    </Typography>
                  </ListItemButton>
                </ListItem>
              ))}
            </Box>
            <Box sx={{ px: '16px', border: '1px solid #FFFFFFCC', borderRadius: '16px', width: '100%', height: '46px', display: 'flex', justifyContent: 'start', alignItems: 'center', mb: '24px' }}>
              {selectedEmoji && <Typography sx={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600', }}>{selectedEmoji.name}</Typography>}
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                mb: '24px',
                width: '100%'

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
                    fontSize: '14px', fontFamily: 'Inter',
                    color: '#000000CC',
                  }}
                >
                  {chrome.i18n.getMessage('Cancel')}
                </Typography>
              </Button>

              <Button
                variant="contained"
                color="primary"
                onClick={() => changeProfile()}
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
                <Typography
                  sx={{
                    fontWeight: '600',
                    fontSize: '14px', fontFamily: 'Inter'
                  }}
                  color="#000000CC"
                >
                  {chrome.i18n.getMessage('Save')}
                </Typography>
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

    </Drawer>
  );
}


export default EditProfile;