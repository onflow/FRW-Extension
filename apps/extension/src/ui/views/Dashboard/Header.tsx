import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import { AppBar, Toolbar, Typography, IconButton, Drawer, Button, Skeleton } from '@mui/material';
import Box from '@mui/material/Box';
import { StyledEngineProvider } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';

import { isValidEthereumAddress } from '@/shared/utils/address';
import { consoleError, consoleWarn } from '@/shared/utils/console-log';
import { AccountAvatar } from '@/ui/components/account/account-avatar';
import IconCopy from '@/ui/components/iconfont/IconCopy';
import StorageExceededAlert from '@/ui/components/StorageExceededAlert';
import { useNews } from '@/ui/hooks/use-news';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useTransferList } from '@/ui/hooks/useTransferListHook';
import { useWallet, formatAddress, useWalletLoaded } from 'ui/utils';

import MenuDrawer from './Components/MenuDrawer';
import NewsView from './Components/NewsView';
import Popup from './Components/Popup';
import SwitchAccountCover from './Components/SwitchAccountCover';

const Header = ({ _loading = false }) => {
  const usewallet = useWallet();
  const walletLoaded = useWalletLoaded();
  const navigate = useNavigate();
  const location = useLocation();

  const { developerMode } = useNetwork();
  const {
    network,
    currentWallet,
    parentWallet,
    walletList,
    userInfo,
    mainAddressLoading,
    profileIds,
    noAddress,
  } = useProfiles();

  const { occupied: pendingTransactions } = useTransferList();
  const [drawer, setDrawer] = useState(false);

  const [ispop, setPop] = useState(false);

  const [switchLoading, setSwitchLoading] = useState(false);

  // News Drawer
  const [showNewsDrawer, setShowNewsDrawer] = useState(false);

  // const { unreadCount } = useNotificationStore();
  // TODO: add notification count
  const { unreadCount } = useNews();

  const toggleDrawer = () => {
    setDrawer((prevDrawer) => !prevDrawer);
  };

  const togglePop = () => {
    setPop((prevPop) => !prevPop);
  };

  const toggleNewsDrawer = useCallback(() => {
    // Avoids unnecessary re-renders using a function to toggle the state
    setShowNewsDrawer((prevShowNewsDrawer) => !prevShowNewsDrawer);
  }, []);

  const goToSettings = useCallback(() => {
    if (location.pathname.includes('/dashboard/setting')) {
      navigate('/dashboard');
    } else {
      navigate('/dashboard/setting');
    }
  }, [navigate, location.pathname]);

  const switchProfile = useCallback(
    async (profileId: string) => {
      setSwitchLoading(true);
      setPop(false);
      setDrawer(false);
      try {
        //  const switchingTo = 'mainnet';
        // Note that currentAccountIndex is only used in keyring for old accounts that don't have an id stored in the keyring
        // currentId always takes precedence
        // NOTE: TO FIX it also should be set to the index of the account in the keyring array, NOT the index in the loggedInAccounts array

        // await usewallet.signOutWallet();
        // await usewallet.clearWallet();
        await usewallet.switchProfile(profileId);
        // await usewallet.switchNetwork(switchingTo);
      } catch (error) {
        consoleError('Error during account switch:', error);
        //if cannot login directly with current password switch to unlock page
        await usewallet.lockWallet();
        navigate('/unlock');
      } finally {
        setSwitchLoading(false);
      }
    },
    [usewallet, navigate]
  );

  const [errorCode, setErrorCode] = useState<number | null>(null);

  const transactionHandler = (request: {
    msg: string;
    errorMessage: string;
    errorCode: number;
  }) => {
    // The header should handle transactionError events
    if (request.msg === 'transactionError') {
      consoleWarn('transactionError', request.errorMessage, request.errorCode);
      // The error message is not used anywhere else for now
      setErrorCode(request.errorCode);
    }
  };

  const checkAuthStatus = useCallback(async () => {
    await usewallet.openapi.checkAuthStatus();
    await usewallet.checkNetwork();
  }, [usewallet]);

  useEffect(() => {
    checkAuthStatus();
    chrome.runtime.onMessage.addListener(transactionHandler);
    /**
     * Fired when a message is sent from either an extension process or a content script.
     */
    return () => {
      chrome.runtime.onMessage.removeListener(transactionHandler);
    };
  }, [checkAuthStatus, network]);

  const NewsDrawer = () => {
    return (
      <Drawer
        open={showNewsDrawer}
        anchor="top"
        onClose={toggleNewsDrawer}
        PaperProps={{
          sx: {
            width: '100%',
            marginTop: '56px',
            marginBottom: '144px',
            bgcolor: 'background.paper',
            background: '#282828',
          },
        }}
      >
        <NewsView />
      </Drawer>
    );
  };

  interface AppBarLabelProps {
    address: string;
    name: string;
  }

  const appBarLabel = (props: AppBarLabelProps) => {
    const haveAddress = !mainAddressLoading && props && props.address;

    return (
      <Toolbar sx={{ height: '56px', width: '100%', display: 'flex', px: '0px' }}>
        <Box
          sx={{ flex: '0 0 68px', position: 'relative', display: 'flex', alignItems: 'center' }}
          data-testid="account-menu-button"
        >
          <AccountAvatar
            network={network}
            emoji={currentWallet.icon}
            color={currentWallet.color}
            parentEmoji={
              parentWallet.address !== currentWallet.address ? parentWallet.icon : undefined
            }
            parentColor={parentWallet.color}
            active={true}
            spinning={pendingTransactions}
            onClick={toggleDrawer}
          />
        </Box>

        <Box
          sx={{
            flex: '1 1 auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Tooltip
            title={
              noAddress
                ? chrome.i18n.getMessage('Check_your_public_key')
                : chrome.i18n.getMessage('Copy__Address')
            }
            arrow
          >
            <span>
              <Button
                data-testid="copy-address-button"
                disabled={!haveAddress}
                onClick={() => {
                  if (haveAddress) {
                    navigator.clipboard.writeText(props.address);
                  }
                }}
                variant="text"
              >
                <Box
                  component="div"
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <Typography
                    data-testid="account-name"
                    variant="overline"
                    color="text"
                    align="center"
                    display="block"
                    sx={{ lineHeight: '1.5' }}
                  >
                    {haveAddress ? (
                      `${props.name === 'Flow' ? 'Wallet' : props.name}${
                        isValidEthereumAddress(props.address) ? ' EVM' : ''
                      }`
                    ) : noAddress ? (
                      'None'
                    ) : (
                      <Skeleton variant="text" width={120} />
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <Typography
                      data-testid="account-address"
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'none' }}
                    >
                      {haveAddress ? (
                        formatAddress(props.address)
                      ) : noAddress ? (
                        chrome.i18n.getMessage('No_address_found')
                      ) : (
                        <Skeleton variant="text" width={120} />
                      )}
                    </Typography>
                    {!noAddress && <IconCopy fill="icon.navi" width="12px" />}
                  </Box>
                </Box>
              </Button>
            </span>
          </Tooltip>
        </Box>

        <Box sx={{ flex: '0 0 68px' }}>
          <Tooltip
            title={pendingTransactions ? chrome.i18n.getMessage('Pending__Transaction') : ''}
            arrow
          >
            <Box style={{ position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconButton
                  edge="end"
                  color="inherit"
                  aria-label="notification"
                  onClick={toggleNewsDrawer}
                >
                  <NotificationsIcon />
                  {unreadCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        backgroundColor: '#4CAF50',
                        color: 'black',
                        borderRadius: '50%',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        padding: '2px',
                        border: 'none',
                        fontWeight: 'bold',
                      }}
                    >
                      {unreadCount}
                    </Box>
                  )}
                </IconButton>
                <IconButton
                  edge="end"
                  color="inherit"
                  aria-label="avatar"
                  onClick={() => goToSettings()}
                  sx={{
                    padding: '3px',
                    marginRight: '0px',
                    position: 'relative',
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Box>
            </Box>
          </Tooltip>
        </Box>
      </Toolbar>
    );
  };

  if (!walletLoaded) {
    return null;
  }

  return (
    <StyledEngineProvider injectFirst>
      <SwitchAccountCover open={switchLoading} />
      <AppBar position="relative" sx={{ zIndex: 1399 }} elevation={0}>
        <Toolbar sx={{ px: '12px', backgroundColor: '#282828' }}>
          <MenuDrawer
            drawer={drawer}
            toggleDrawer={toggleDrawer}
            togglePop={togglePop}
            userInfo={userInfo}
            activeAccount={currentWallet}
            activeParentAccount={parentWallet}
            walletList={walletList}
            network={network}
            modeOn={developerMode}
            mainAddressLoading={mainAddressLoading}
            noAddress={noAddress ?? false}
          />
          {appBarLabel(currentWallet)}
          <NewsDrawer />
          <Popup
            isConfirmationOpen={ispop}
            handleCloseIconClicked={() => setPop(false)}
            handleCancelBtnClicked={() => setPop(false)}
            handleAddBtnClicked={() => {
              setPop(false);
            }}
            userInfo={userInfo}
            current={currentWallet}
            switchProfile={switchProfile}
            profileIds={profileIds || []}
            switchLoading={switchLoading}
          />
        </Toolbar>
      </AppBar>
      <StorageExceededAlert open={errorCode === 1103} onClose={() => setErrorCode(null)} />
    </StyledEngineProvider>
  );
};

export default Header;
