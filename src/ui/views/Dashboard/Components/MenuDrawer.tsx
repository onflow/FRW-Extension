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
import React, { useCallback, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import type { UserInfoResponse } from '@/shared/types/network-types';
import { type WalletAccount } from '@/shared/types/wallet-types';
import { consoleError } from '@/shared/utils/console-log';
import { AccountListing } from '@/ui/components/account/account-listing';
import { ProfileItemBase } from '@/ui/components/profile/profile-item-base';
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

interface MenuDrawerProps {
  drawer: boolean;
  toggleDrawer: () => void;
  userInfo?: UserInfoResponse;
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
  mainAddressLoading,
  noAddress,
}: MenuDrawerProps) => {
  const wallet = useWallet();
  const history = useHistory();
  const scrollRef = useRef<HTMLDivElement>(null);
  // Add Account Drawer
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const canCreateNewAccount = useFeatureFlag('create_new_account');
  // TODO: Uncomment this when we have the import existing account feature flag
  const canImportExistingAccount = false; // useFeatureFlag('import_existing_account');

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
      toggleAddAccount();

      // Scroll to bottom to show the spinner
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight + 60,
            behavior: 'smooth',
          });
        }
      }, 100);

      await wallet.createNewAccount(network);
    } catch (error) {
      consoleError('Failed to create account:', error);
      setErrorMessage(error.message || 'Failed to create account. Please try again.');
      setShowError(true);
    }
  };

  const toggleAddAccount = () => {
    setShowAddAccount((prevShowAddAccount) => !prevShowAddAccount);
  };
  const handleEnableEvmClick = useCallback(
    (parentAddress: string) => {
      history.push(`/dashboard/enable?parentAddress=${parentAddress}`);
      toggleDrawer();
    },
    [history, toggleDrawer]
  );
  return (
    <Drawer
      open={drawer}
      onClose={toggleDrawer}
      sx={{ zIndex: '1400 !important' }}
      PaperProps={{ sx: { width: '75%', maxWidth: '400px', background: '#0A0A0B' } }}
    >
      <List
        sx={{
          backgroundColor: '#0A0A0B',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box sx={{ padding: '0px 0px 24px 0px' }}>
          <Box
            sx={{
              display: 'flex',
              padding: '0 0 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
              justifyContent: 'space-between',
            }}
          >
            <ProfileItemBase
              profileId={userInfo?.id}
              selectedProfileId={userInfo?.id}
              onClick={(_profileId: string) => togglePop()}
              setLoadingId={() => {}}
              userInfo={userInfo}
              activeProfileVariant={true}
            />
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
            onEnableEvmClick={handleEnableEvmClick}
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
        </Box>

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
