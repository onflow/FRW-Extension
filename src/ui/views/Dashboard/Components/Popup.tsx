import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  ListItemButton,
  Typography,
  Drawer,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  CardMedia,
} from '@mui/material';
import CircularProgress, { circularProgressClasses } from '@mui/material/CircularProgress';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import type { UserInfoResponse } from '@/shared/types/network-types';
import {
  type LoggedInAccountWithIndex,
  type LoggedInAccount,
  type WalletAccount,
} from '@/shared/types/wallet-types';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import iconCheck from 'ui/FRWAssets/svg/iconCheck.svg';
import popAdd from 'ui/FRWAssets/svg/popAdd.svg';
import popLock from 'ui/FRWAssets/svg/popLock.svg';
import vmsvg from 'ui/FRWAssets/svg/viewmore.svg';
import { useWallet } from 'ui/utils';

interface TransferConfirmationProps {
  isConfirmationOpen: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  userInfo: UserInfoResponse;
  current: WalletAccount;
  switchAccount: (account: LoggedInAccountWithIndex) => Promise<void>;
  loggedInAccounts: LoggedInAccount[];
  switchLoading: boolean;
}

const Popup = (props: TransferConfirmationProps) => {
  const usewallet = useWallet();
  const history = useHistory();
  const [viewmore, setMore] = useState<boolean>(false);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const { clearProfileData } = useProfiles();

  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1500 !important' }}
      open={props.isConfirmationOpen}
      transitionDuration={300}
      PaperProps={{
        sx: {
          width: '100%',
          height: 'auto',
          background: '#222',
          borderRadius: '18px 18px 0px 0px',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            height: '24px',
            margin: '20px 0',
            alignItems: 'center',
            px: '20px',
          }}
        >
          <Box sx={{ width: '40px' }}></Box>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color="text"
            sx={{ fontSize: '18px', textAlign: 'center', lineHeight: '24px', fontWeight: '700' }}
          >
            {chrome.i18n.getMessage('Profile')}
          </Typography>
          <Box onClick={props.handleCancelBtnClicked}>
            <IconButton>
              <CloseIcon fontSize="medium" sx={{ color: 'icon.navi', cursor: 'pointer' }} />
            </IconButton>
          </Box>
        </Box>
        <Box component="nav">
          {Array.isArray(props.loggedInAccounts) && (
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
                paddingBottom: '16px',
              }}
            >
              {props.loggedInAccounts.map((loggedInAccount: LoggedInAccount, index: number) => {
                const loggedInAccountWithIndex: LoggedInAccountWithIndex = {
                  ...loggedInAccount,
                  indexInLoggedInAccounts: index,
                };
                return (
                  <ListItem
                    disablePadding
                    key={loggedInAccount.username}
                    onClick={() => {
                      if (loggedInAccount.username !== props.userInfo.username) {
                        setLoadingIndex(index); // Set the loading index
                        props.switchAccount(loggedInAccountWithIndex);
                      }
                    }}
                  >
                    <ListItemButton sx={{ padding: '0 20px' }}>
                      <ListItemIcon>
                        <Avatar
                          component="span"
                          src={loggedInAccount.avatar}
                          sx={{ width: '32px', height: '32px' }}
                          alt="avatar"
                        />
                      </ListItemIcon>
                      <ListItemText>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography
                            variant="body1"
                            component="div"
                            display="inline"
                            color="text.primary"
                          >
                            {loggedInAccount.nickname}
                          </Typography>
                          <Typography
                            variant="body1"
                            component="div"
                            display="inline"
                            color="text.secondary"
                            sx={{ fontSize: '12px' }}
                          >
                            {loggedInAccount.address
                              ? loggedInAccount.address
                              : loggedInAccount.nickname}
                          </Typography>
                        </Box>
                      </ListItemText>
                      {loggedInAccount.username === props.userInfo.username && (
                        <CardMedia
                          component="img"
                          sx={{ width: '16px', height: '16px' }}
                          image={iconCheck}
                        />
                      )}
                      {props.switchLoading && index === loadingIndex && (
                        <CircularProgress
                          variant="indeterminate"
                          // disableShrink
                          sx={{
                            color: 'primary.main',
                            animationDuration: '2000ms',
                            [`& .${circularProgressClasses.circle}`]: {
                              strokeLinecap: 'round',
                            },
                          }}
                          size={'16px'}
                          thickness={5}
                          value={10}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
              {!viewmore && props.loggedInAccounts.length > 3 && (
                <Button
                  sx={{
                    display: 'flex',
                    position: 'absolute',
                    bottom: '0px',
                    alignItems: 'center',
                    background: '#2C2C2C',
                    borderRadius: '8px',
                    color: '#8C9BAB',
                    textTransform: 'capitalize',
                    padding: '4px 16px',
                  }}
                  onClick={() => setMore(true)}
                >
                  View More
                  <CardMedia
                    component="img"
                    sx={{ width: '16px', height: '16px', display: 'inline', paddingLeft: '8px' }}
                    image={vmsvg}
                  />
                </Button>
              )}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            height: '1px',
            width: '100%',
            margin: '0 0 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
          }}
        ></Box>

        <Box
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'column',
            display: 'flex',
          }}
        >
          {props.loggedInAccounts && (
            <ListItem
              disablePadding
              onClick={async () => {
                await usewallet.lockAdd();
                // history.push('/add');
              }}
            >
              <ListItemButton sx={{ padding: '8px 20px', margin: '0', borderRadius: '5px' }}>
                <ListItemIcon
                  sx={{
                    width: '24px',
                    minWidth: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{ width: '24px', height: '24px' }}
                    image={popAdd}
                  />
                </ListItemIcon>
                <Typography
                  variant="body1"
                  component="div"
                  display="inline"
                  color="text"
                  sx={{ fontSize: '12px' }}
                >
                  {chrome.i18n.getMessage('Add_account')}
                </Typography>
              </ListItemButton>
            </ListItem>
          )}
          <ListItem
            sx={{ marginTop: '16px' }}
            disablePadding
            onClick={() => {
              usewallet.lockWallet().then(() => {
                clearProfileData();
                history.push('/unlock');
              });
            }}
          >
            <ListItemButton sx={{ padding: '8px 20px', margin: '0', borderRadius: '5px' }}>
              <ListItemIcon
                sx={{
                  width: '24px',
                  minWidth: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                }}
              >
                <CardMedia component="img" sx={{ width: '24px', height: '24px' }} image={popLock} />
              </ListItemIcon>
              <Typography
                variant="body1"
                component="div"
                display="inline"
                color="text"
                sx={{ fontSize: '12px' }}
              >
                {chrome.i18n.getMessage('Lock__Wallet')}
              </Typography>
            </ListItemButton>
          </ListItem>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          mx: '18px',
          mb: '35px',
          mt: '10px',
        }}
      ></Box>
    </Drawer>
  );
};

export default Popup;
