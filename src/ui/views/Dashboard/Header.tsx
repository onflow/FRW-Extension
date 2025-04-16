import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  Button,
  Skeleton,
  CircularProgress,
  Chip,
} from '@mui/material';
import Box from '@mui/material/Box';
import { StyledEngineProvider } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import {
  type WalletAccount,
  type WalletAddress,
  type ActiveChildType_depreciated,
  type LoggedInAccountWithIndex,
} from '@/shared/types/wallet-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import StorageExceededAlert from '@/ui/FRWComponent/StorageExceededAlert';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useNews } from '@/ui/utils/NewsContext';
import { useWallet, formatAddress, useWalletLoaded } from 'ui/utils';

import IconCopy from '../../../components/iconfont/IconCopy';

import MainAccountsComponent from './Components/MainAccountsComponent';
import MenuDrawer from './Components/MenuDrawer';
import NewsView from './Components/NewsView';
import Popup from './Components/Popup';
import SwitchAccountCover from './Components/SwitchAccountCover';

const useStyles = makeStyles(() => ({
  appBar: {
    zIndex: 1399,
  },
  paper: {
    background: '#282828',
  },
  active: {
    background: '#BABABA14',
    borderRadius: '12px',
  },
}));

const Header = ({ _loading = false }) => {
  const usewallet = useWallet();
  const walletLoaded = useWalletLoaded();
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();

  const { network, developerMode } = useNetwork();
  const {
    mainAddress,
    currentWallet,
    evmWallet,
    currentWalletIndex,
    childAccounts,
    walletList,
    evmLoading,
    userInfo,
    otherAccounts,
    mainAddressLoading,
    clearProfileData,
    profileIds,
  } = useProfiles();

  const [drawer, setDrawer] = useState(false);

  const [isPending, setIsPending] = useState(false);

  const [ispop, setPop] = useState(false);

  const [switchLoading, setSwitchLoading] = useState(false);
  const [expandAccount, setExpandAccount] = useState(false);
  const [, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState(null);

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
      history.push('/dashboard');
    } else {
      history.push('/dashboard/setting');
    }
  }, [history, location.pathname]);

  const switchAccount = useCallback(
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
        clearProfileData();
      } catch (error) {
        console.error('Error during account switch:', error);
        //if cannot login directly with current password switch to unlock page
        await usewallet.lockWallet();
        history.push('/unlock');
      } finally {
        setSwitchLoading(false);
      }
    },
    [usewallet, history, clearProfileData]
  );

  const setWallets = async (
    walletInfo: WalletAccount,
    key: ActiveChildType_depreciated | null,
    index: number | null = null
  ) => {
    await usewallet.setActiveWallet(walletInfo, key, index);

    // Navigate if needed
    history.push('/dashboard');
    setDrawer(false);
    //  window.location.reload();
  };

  const transactionHandler = (request) => {
    // This is just to handle pending transactions
    // The header will listen to the transactionPending event
    // It shows spinner on the header when there is a pending transaction
    if (request.msg === 'transactionPending') {
      setIsPending(true);
    }
    if (request.msg === 'transactionDone') {
      setIsPending(false);
    }
    // The header should handle transactionError events
    if (request.msg === 'transactionError') {
      console.warn('transactionError', request.errorMessage, request.errorCode);
      // The error message is not used anywhere else for now
      setErrorMessage(request.errorMessage);
      setErrorCode(request.errorCode);
    }
    return true;
  };

  const checkPendingTx = useCallback(async () => {
    const network = await usewallet.getNetwork();

    const result = await chrome.storage.session.get('transactionPending');
    const now = new Date();
    if (result.transactionPending?.date) {
      const diff = now.getTime() - result.transactionPending.date.getTime();
      const inMins = Math.round(diff / 60000);
      if (inMins > 5) {
        await chrome.storage.session.remove('transactionPending');
        return;
      }
    }
    if (
      result &&
      Object.keys(result).length !== 0 &&
      network === result.transactionPending.network
    ) {
      setIsPending(true);
      usewallet.listenTransaction(result.transactionPending.txId, false);
    } else {
      setIsPending(false);
    }
  }, [usewallet]);

  const networkColor = (network: string) => {
    switch (network) {
      case 'mainnet':
        return '#41CC5D';
      case 'testnet':
        return '#FF8A00';
      case 'crescendo':
        return '#CCAF21';
    }
    return '#41CC5D';
  };

  const checkAuthStatus = useCallback(async () => {
    await usewallet.openapi.checkAuthStatus();
    await usewallet.checkNetwork();
  }, [usewallet]);

  useEffect(() => {
    checkPendingTx();
    checkAuthStatus();

    chrome.runtime.onMessage.addListener(transactionHandler);
    /**
     * Fired when a message is sent from either an extension process or a content script.
     */
    return () => {
      chrome.runtime.onMessage.removeListener(transactionHandler);
    };
  }, [checkAuthStatus, checkPendingTx, network]);

  // Function to construct GitHub comparison URL
  const getComparisonUrl = useCallback(() => {
    const repoUrl = process.env.REPO_URL || 'https://github.com/onflow/FRW-Extension';
    const latestTag = process.env.LATEST_TAG || '';
    const commitSha = process.env.COMMIT_SHA || '';

    if (latestTag && commitSha) {
      return `${repoUrl}/compare/${latestTag}...${commitSha}`;
    }

    return `${repoUrl}/commits`;
  }, []);

  const createWalletList = (props: WalletAccount) => {
    return (
      <List component="nav" key={props.id} sx={{ mb: '0', padding: 0 }}>
        <MainAccountsComponent
          network={network}
          props_id={props.id}
          name={props.name}
          address={props.address as WalletAddress}
          icon={props.icon}
          color={props.color}
          setWallets={setWallets}
          currentWalletIndex={currentWalletIndex}
          currentWallet={currentWallet}
          mainAddress={mainAddress!}
          setExpandAccount={setExpandAccount}
          expandAccount={expandAccount}
          walletList={walletList}
        />
      </List>
    );
  };

  const NewsDrawer = () => {
    return (
      <Drawer
        open={showNewsDrawer}
        anchor="top"
        onClose={toggleNewsDrawer}
        classes={{ paper: classes.paper }}
        PaperProps={{
          sx: {
            width: '100%',
            marginTop: '56px',
            marginBottom: '144px',
            bgcolor: 'background.paper',
          },
        }}
      >
        <NewsView />
      </Drawer>
    );
  };
  const deploymentEnv = process.env.DEPLOYMENT_ENV || 'local';

  interface AppBarLabelProps {
    address: string;
    name: string;
  }

  const appBarLabel = (props: AppBarLabelProps) => {
    const haveAddress = !mainAddressLoading && props && props.address;

    return (
      <Toolbar sx={{ height: '56px', width: '100%', display: 'flex', px: '0px' }}>
        <Box sx={{ flex: '0 0 68px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          {isPending && (
            <CircularProgress
              size={'28px'}
              sx={{
                position: 'absolute',
                width: '28px',
                height: '28px',
                left: '-1px',
                top: '-1px',
                color: networkColor(network),
              }}
            />
          )}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{
              marginLeft: '0px',
              padding: '3px',
              position: 'relative',
              border: isPending
                ? ''
                : network !== 'mainnet'
                  ? `2px solid ${networkColor(network)}`
                  : '2px solid #282828',
              marginRight: '0px',
            }}
          >
            <img
              src={userInfo?.avatar}
              style={{ backgroundColor: '#797979', borderRadius: '10px' }}
              width="20px"
              height="20px"
            />
          </IconButton>
          {deploymentEnv !== 'production' && (
            <Box sx={{ position: 'absolute', left: '30px', top: '-8px', zIndex: 10 }}>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="caption">
                      {`Build: ${process.env.DEPLOYMENT_ENV}`}
                    </Typography>
                    {process.env.LATEST_TAG && process.env.COMMIT_SHA && (
                      <Typography variant="caption" display="block">
                        {`Compare: ${process.env.LATEST_TAG}...${process.env.COMMIT_SHA?.substring(0, 7)}`}
                      </Typography>
                    )}
                    <Typography variant="caption" display="block">
                      {`Repo: ${process.env.REPO_URL?.replace('https://github.com/', '') || 'onflow/FRW-Extension'}`}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Click to view changes
                    </Typography>
                  </Box>
                }
                arrow
              >
                <Chip
                  label={deploymentEnv}
                  size="small"
                  color={
                    deploymentEnv === 'staging'
                      ? 'default'
                      : deploymentEnv === 'development'
                        ? 'warning'
                        : 'error'
                  }
                  sx={{
                    height: '18px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    minWidth: '16px',
                    maxWidth: '90px',
                    cursor: 'pointer',
                    '& .MuiChip-label': {
                      padding: '0 8px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                  onClick={() => {
                    const url = getComparisonUrl();
                    window.open(url, '_blank');
                  }}
                />
              </Tooltip>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            flex: '1 1 auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Tooltip title={chrome.i18n.getMessage('Copy__Address')} arrow>
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
                    ) : (
                      <Skeleton variant="text" width={40} />
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'none' }}
                    >
                      {haveAddress ? (
                        formatAddress(props.address)
                      ) : (
                        <Skeleton variant="text" width={120} />
                      )}
                    </Typography>
                    <IconCopy fill="icon.navi" width="12px" />
                  </Box>
                </Box>
              </Button>
            </span>
          </Tooltip>
        </Box>

        <Box sx={{ flex: '0 0 68px' }}>
          <Tooltip title={isPending ? chrome.i18n.getMessage('Pending__Transaction') : ''} arrow>
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
      <AppBar position="relative" className={classes.appBar} elevation={0}>
        <Toolbar sx={{ px: '12px', backgroundColor: '#282828' }}>
          {walletList && (
            <MenuDrawer
              userInfo={userInfo || null}
              drawer={drawer}
              toggleDrawer={toggleDrawer}
              otherAccounts={otherAccounts}
              switchAccount={switchAccount}
              togglePop={togglePop}
              walletList={walletList}
              childAccounts={childAccounts || null}
              current={currentWallet}
              profileIds={profileIds || []}
              createWalletList={createWalletList}
              setWallets={setWallets}
              currentNetwork={network}
              evmWallet={evmWallet}
              networkColor={networkColor}
              evmLoading={evmLoading}
              modeOn={developerMode}
              mainAddressLoading={mainAddressLoading}
            />
          )}
          {appBarLabel(currentWallet)}
          <NewsDrawer />
          {userInfo && (
            <Popup
              isConfirmationOpen={ispop}
              handleCloseIconClicked={() => setPop(false)}
              handleCancelBtnClicked={() => setPop(false)}
              handleAddBtnClicked={() => {
                setPop(false);
              }}
              userInfo={userInfo!}
              current={currentWallet}
              switchAccount={switchAccount}
              profileIds={profileIds || []}
              switchLoading={switchLoading}
            />
          )}
        </Toolbar>
      </AppBar>
      <StorageExceededAlert open={errorCode === 1103} onClose={() => setErrorCode(null)} />
    </StyledEngineProvider>
  );
};

export default Header;
