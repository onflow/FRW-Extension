import React, { useState, useEffect } from 'react';
import { Box, Button, ListItemButton, Typography, Drawer, IconButton, ListItem, ListItemIcon, ListItemText, Avatar, CardMedia } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useWallet } from 'ui/utils';
import { useHistory } from 'react-router-dom';
import popLock from 'ui/FRWAssets/svg/popLock.svg';
import popAdd from 'ui/FRWAssets/svg/popAdd.svg';
import iconCheck from 'ui/FRWAssets/svg/iconCheck.svg';
import vmsvg from 'ui/FRWAssets/svg/viewmore.svg';




import { UserInfoResponse } from 'background/service/networkModel';

interface TransferConfirmationProps {
  isConfirmationOpen: boolean;
  data: any;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  userInfo: UserInfoResponse;
  current: any;
  switchAccount: any;
  loggedInAccounts: any;
}


const Popup = (props: TransferConfirmationProps) => {


  const usewallet = useWallet();
  const history = useHistory();
  const [viewmore, setMore] = useState<boolean>(false);

  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1500 !important' }}
      open={props.isConfirmationOpen}
      transitionDuration={300}
      PaperProps={{
        sx: { width: '100%', height: 'auto', background: '#222', borderRadius: '18px 18px 0px 0px', },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '24px', margin: '20px 0', alignItems: 'center',  px: '20px'}}>
          <Box sx={{ width: '40px' }}></Box>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color='text'
            sx={{ fontSize: '18px', textAlign: 'center', lineHeight: '24px', fontWeight: '700' }}
          >
            {chrome.i18n.getMessage('Profile')}
          </Typography>
          <Box onClick={props.handleCancelBtnClicked}>
            <IconButton>
              <CloseIcon
                fontSize="medium"
                sx={{ color: 'icon.navi', cursor: 'pointer' }}
              />
            </IconButton>
          </Box>
        </Box>
        <Box component="nav">
          {Array.isArray(props.loggedInAccounts) &&
            <Box
              sx={{
                justifyContent: 'space-between',
                position: 'relative',
                alignItems: 'center',
                flexDirection: 'column',
                display: 'flex',
                height: 'auto',
                maxHeight: viewmore ? '246px' : '166px',
                overflow: viewmore ? 'scroll' : 'hidden',
                paddingBottom: '16px'
              }}
            >
              {props.loggedInAccounts.map((user, index) => {
                const userWithIndex = {
                  ...user,
                  indexInLoggedInAccounts: index
                };
                return (
                  <ListItem disablePadding key={user.username} onClick={() => {
                    if (user.username !== props.userInfo.username) {
                      props.switchAccount(userWithIndex);
                    }
                  }}>
                    <ListItemButton sx={{padding:'0 20px'}}>
                      <ListItemIcon>
                        <Avatar
                          component="span"
                          src={user.avatar}
                          sx={{ width: '32px', height: '32px' }}
                          alt="avatar"
                        />
                      </ListItemIcon>
                      <ListItemText>
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <Typography
                            variant="body1"
                            component="div"
                            display="inline"
                            color='text.primary'
                          >
                            {user.nickname}
                          </Typography>
                          <Typography
                            variant="body1"
                            component="div"
                            display="inline"
                            color="text.secondary"
                            sx={{ fontSize: '12px' }}
                          >
                            {user.address ? user.address : user.nickname}
                          </Typography>
                        </Box>
                      </ListItemText>
                      {user.username === props.userInfo.username &&
                        <CardMedia component="img" sx={{ width: '16px', height: '16px' }} image={iconCheck} />
                      }
                    </ListItemButton>
                  </ListItem>
                );
              })}
              {(!viewmore && props.loggedInAccounts.length > 3) &&
                <Button
                  sx={{ display: 'flex', position: 'absolute', bottom: '0px', alignItems: 'center', background: '#2C2C2C', borderRadius: '8px', color: '#8C9BAB', textTransform: 'capitalize', padding: '4px 16px' }}
                  onClick={() => setMore(true)}>
                  View More
                  <CardMedia component="img" sx={{ width: '16px', height: '16px', display: 'inline', paddingLeft: '8px' }} image={vmsvg} />
                </Button>
              }
            </Box>

          }
        </Box>

        <Box sx={{ height: '1px', width: '100%', margin: '0 0 16px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }}></Box>

        <Box
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'column',
            display: 'flex',
          }}
        >
          {props.loggedInAccounts &&
            <ListItem disablePadding onClick={async () => {
              await usewallet.lockAdd();
              // history.push('/add');
            }}>
              <ListItemButton sx={{ padding: '8px 20px', margin: '0', borderRadius: '5px' }}>
                <ListItemIcon
                  sx={{
                    width: '24px',
                    minWidth: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px'
                  }}>
                  <CardMedia component="img" sx={{ width: '24px', height: '24px' }} image={popAdd} />
                </ListItemIcon>
                <Typography
                  variant="body1"
                  component="div"
                  display="inline"
                  color='text'
                  sx={{ fontSize: '12px' }}
                >
                  {chrome.i18n.getMessage('Add_account')}
                </Typography>
              </ListItemButton>
            </ListItem>
          }
          <ListItem sx={{ marginTop: '16px' }} disablePadding onClick={async () => {
            await usewallet.lockWallet();
            history.push('/unlock');
          }}>
            <ListItemButton sx={{ padding: '8px 20px', margin: '0', borderRadius: '5px' }}>
              <ListItemIcon
                sx={{
                  width: '24px',
                  minWidth: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                <CardMedia component="img" sx={{ width: '24px', height: '24px' }} image={popLock} />
              </ListItemIcon>
              <Typography
                variant="body1"
                component="div"
                display="inline"
                color='text'
                sx={{ fontSize: '12px' }}
              >
                {chrome.i18n.getMessage('Lock__Wallet')}
              </Typography>
            </ListItemButton>
          </ListItem>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mx: '18px', mb: '35px', mt: '10px' }}>
      </Box>


    </Drawer>
  );
}


export default Popup;