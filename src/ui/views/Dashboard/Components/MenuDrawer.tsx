import {
  Box,
  List,
  ListItemButton,
  Typography,
  Drawer,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  CardMedia,
  Skeleton,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import type { UserInfoResponse } from '@/shared/types/network-types';
import { type WalletAccount } from '@/shared/types/wallet-types';
import { AccountListing } from '@/ui/components/account/account-listing';
import importIcon from 'ui/assets/svg/importIcon.svg';
import popLock from 'ui/assets/svg/popLock.svg';
import { useWallet } from 'ui/utils';

import sideMore from '../../../assets/svg/sideMore.svg';

import NetworkList from './NetworkList';

const useStyles = makeStyles(() => ({
  menuDrawer: {
    zIndex: '1400 !important',
  },
  paper: {
    background: '#282828',
  },
  active: {
    background: '#BABABA14',
    borderRadius: '12px',
  },
}));

interface MenuDrawerProps {
  drawer: boolean;
  toggleDrawer: () => void;
  userInfo: UserInfoResponse | null;
  togglePop: () => void;
  walletList: WalletAccount[];
  activeAccount: WalletAccount;
  activeParentAccount: WalletAccount;
  network: string;
  modeOn: boolean;
  mainAddressLoading: boolean;
  noAddress?: boolean;
}

const MenuDrawer = ({
  userInfo,
  drawer,
  toggleDrawer,
  togglePop,
  activeAccount,
  activeParentAccount,
  walletList,
  network,
  modeOn,
  mainAddressLoading,
  noAddress,
}: MenuDrawerProps) => {
  const wallet = useWallet();
  const history = useHistory();
  const classes = useStyles();

  const setActiveAccount = useCallback(
    (address: string, parentAddress?: string) => {
      wallet.setActiveAccount(address, parentAddress || address).then(() => {
        toggleDrawer();
      });
    },
    [wallet, toggleDrawer]
  );

  return (
    <Drawer
      open={drawer}
      onClose={toggleDrawer}
      className={classes.menuDrawer}
      classes={{ paper: classes.paper }}
      PaperProps={{ sx: { width: '75%', maxWidth: '400px' } }}
    >
      <List
        sx={{
          backgroundColor: '#282828',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <ListItem
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <ListItemIcon sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {userInfo ? (
                <img
                  src={userInfo.avatar}
                  width={48}
                  height={48}
                  style={{ backgroundColor: '#797979', borderRadius: 48 / 2 }}
                />
              ) : (
                <Skeleton variant="circular" width={48} height={48} />
              )}

              <Box sx={{ paddingTop: '4px', px: '2px' }}>
                <IconButton edge="end" aria-label="close" onClick={togglePop}>
                  <img style={{ display: 'inline-block', width: '24px' }} src={sideMore} />
                </IconButton>
              </Box>
            </ListItemIcon>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <ListItemText
                sx={{ fontSize: '14px', fontWeight: '700' }}
                primary={
                  ((!mainAddressLoading || noAddress) && userInfo?.nickname) || (
                    <Skeleton variant="text" width={100} />
                  )
                }
              />
            </Box>
          </Box>
        </ListItem>
        <AccountListing
          network={network}
          accountList={walletList}
          activeAccount={activeAccount}
          activeParentAccount={activeParentAccount}
          onAccountClick={setActiveAccount}
          showActiveAccount={true}
        />
        <Box
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'column',
            display: 'flex',
            px: '0',
            marginTop: 'auto',
            marginBottom: '20px',
          }}
        >
          {modeOn && <NetworkList currentNetwork={network} onClose={toggleDrawer} />}
          <ListItem
            disablePadding
            onClick={async () => {
              await wallet.lockAdd();
            }}
          >
            <ListItemButton sx={{ padding: '8px 16px', margin: '0', borderRadius: '0' }}>
              <ListItemIcon
                sx={{
                  width: '24px',
                  minWidth: '16px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                }}
              >
                <CardMedia
                  component="img"
                  sx={{ width: '16px', height: '16px' }}
                  image={importIcon}
                />
              </ListItemIcon>
              <Typography
                variant="body1"
                component="div"
                display="inline"
                color="text"
                sx={{ fontSize: '12px' }}
              >
                {chrome.i18n.getMessage('Import__Profile')}
              </Typography>
            </ListItemButton>
          </ListItem>
          <ListItem
            disablePadding
            onClick={() => {
              wallet.lockWallet().then(() => {
                history.push('/unlock');
              });
            }}
          >
            <ListItemButton sx={{ padding: '8px 16px', margin: '0', borderRadius: '0' }}>
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
      </List>
    </Drawer>
  );
};

export default MenuDrawer;
