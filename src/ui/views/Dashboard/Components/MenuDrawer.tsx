import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useCallback, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import type { UserInfoResponse } from '@/shared/types/network-types';
import { type WalletAccount } from '@/shared/types/wallet-types';
import { consoleError } from '@/shared/utils/console-log';
import { AccountListing } from '@/ui/components/account/account-listing';
import { MenuItem } from '@/ui/components/sidebar/menu-item';
import { useFeatureFlag } from '@/ui/hooks/use-feature-flags';
import {
  COLOR_GREEN_FLOW_THEME_16FF99,
  COLOR_WHITE_ALPHA_10_FFFFFF1A,
  COLOR_WHITE_ALPHA_40_FFFFFF66,
} from '@/ui/style/color';
import { useWallet } from 'ui/utils';

import lock from '../../../assets/svg/sidebar-lock.svg';
import plus from '../../../assets/svg/sidebar-plus.svg';
import userCircleGear from '../../../assets/svg/user-circle-gear.svg';
import ErrorModel from '../../../components/PopupModal/errorModel';

import AddAccountPopup from './AddAccountPopup';

const useStyles = makeStyles(() => ({
  menuDrawer: {
    zIndex: '1400 !important',
  },
  paper: {
    background: '#0A0A0B',
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
  // Optional props for Storybook stories
  canCreateNewAccount?: boolean;
  canImportExistingAccount?: boolean;
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Add Account Drawer
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const canCreateNewAccount = useFeatureFlag('create_new_account');
  const canImportExistingAccount = useFeatureFlag('import_existing_account');

  // Error state
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const setActiveAccount = useCallback(
    (address: string, parentAddress?: string) => {
      wallet.setActiveAccount(address, parentAddress || address).then(() => {
        toggleDrawer();
      });
    },
    [wallet, toggleDrawer]
  );

  const addAccount = async () => {
    try {
      setIsCreating(true);
      toggleAddAccount();
      await wallet.createManualAddress();

      // Scroll to bottom after a short delay to ensure new account is rendered
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 100);
    } catch (error) {
      consoleError('Failed to create account:', error);
      setErrorMessage(error.message || 'Failed to create account. Please try again.');
      setShowError(true);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleAddAccount = () => {
    setShowAddAccount((prevShowAddAccount) => !prevShowAddAccount);
  };
  return (
    <Drawer
      open={drawer}
      onClose={toggleDrawer}
      className={classes.menuDrawer}
      classes={{ paper: classes.paper }}
      PaperProps={{ sx: { width: '75%' } }}
    >
      <List
        sx={{
          backgroundColor: '#0A0A0B',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box sx={{ padding: '24px 16px' }}>
          <Box
            sx={{
              display: 'flex',
              padding: '0 0 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {userInfo ? (
                <img
                  src={userInfo.avatar}
                  width={48}
                  height={48}
                  style={{ backgroundColor: COLOR_GREEN_FLOW_THEME_16FF99, borderRadius: '8px' }}
                />
              ) : (
                <Skeleton variant="circular" width={48} height={48} />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <ListItemText
                  sx={{ fontSize: '14px', fontWeight: '700', marginLeft: '16px' }}
                  primary={
                    ((!mainAddressLoading || noAddress) && userInfo?.nickname) || (
                      <Skeleton variant="text" width={100} />
                    )
                  }
                />
              </Box>
            </Box>
            <Box sx={{ paddingTop: '4px', px: '2px' }}>
              <IconButton edge="end" aria-label="close" onClick={togglePop}>
                <img style={{ display: 'inline-block', width: '24px' }} src={userCircleGear} />
              </IconButton>
            </Box>
          </Box>
        </Box>
        <Box
          ref={scrollRef}
          sx={{
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 200px)',
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
            },
          }}
        >
          <AccountListing
            network={network}
            accountList={walletList}
            activeAccount={activeAccount}
            activeParentAccount={activeParentAccount}
            onAccountClick={setActiveAccount}
            showActiveAccount={true}
          />
        </Box>
        <Box sx={{ padding: '0 16px', flex: 1 }}></Box>
        <Box
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'column',
            display: 'flex',
            px: '0',
            marginTop: '24px',
            marginBottom: '8px',
            borderTop: `1px solid ${COLOR_WHITE_ALPHA_40_FFFFFF66}`,
            paddingTop: '8px',
          }}
        >
          {canCreateNewAccount &&
            (isCreating ? (
              <ListItem disablePadding>
                <ListItemButton sx={{ padding: '8px 16px', margin: '0', borderRadius: '0' }}>
                  <ListItemIcon
                    sx={{
                      width: '40px',
                      minWidth: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px',
                      borderRadius: '40px',
                      backgroundColor: COLOR_WHITE_ALPHA_10_FFFFFF1A,
                    }}
                  >
                    <CircularProgress size={24} />
                  </ListItemIcon>
                  <Typography
                    variant="body1"
                    component="div"
                    display="inline"
                    sx={{ fontSize: '16px', color: '#FFFFFFCC', opacity: 0.7 }}
                  >
                    Creating...
                  </Typography>
                </ListItemButton>
              </ListItem>
            ) : (
              <MenuItem
                icon={plus}
                text={chrome.i18n.getMessage('Add_Account_Sidebar')}
                dataTestId="add-account-button"
                onClick={toggleAddAccount}
              />
            ))}
          <MenuItem
            icon={lock}
            text={chrome.i18n.getMessage('Lock__Wallet')}
            onClick={() => {
              wallet.lockWallet().then(() => {
                history.push('/unlock');
              });
            }}
          />
        </Box>
        {showAddAccount && (
          <AddAccountPopup
            isConfirmationOpen={showAddAccount}
            handleCloseIconClicked={() => setShowAddAccount(false)}
            handleCancelBtnClicked={() => setShowAddAccount(false)}
            handleAddBtnClicked={() => {
              setShowAddAccount(false);
            }}
            addAccount={addAccount}
            importExistingAccount={canImportExistingAccount}
          />
        )}

        {showError && (
          <ErrorModel
            isOpen={showError}
            onOpenChange={() => setShowError(false)}
            errorName={chrome.i18n.getMessage('Error')}
            errorMessage={errorMessage}
          />
        )}
      </List>
    </Drawer>
  );
};

export default MenuDrawer;
