import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemText,
  ListItemIcon,
  ListItem,
  ListItemButton,
  Button,
  Avatar,
  Skeleton,
  CircularProgress,
  Icon,
  Chip,
} from '@mui/material';
import Box from '@mui/material/Box';
import { StyledEngineProvider } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { storage } from '@/background/webapi';
import { type LoggedInAccountWithIndex } from '@/shared/types/wallet-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import StorageExceededAlert from '@/ui/FRWComponent/StorageExceededAlert';
import { useCoins } from '@/ui/hooks/useCoinHook';
import { useNetworks } from '@/ui/hooks/useNetworkHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useNews } from '@/ui/utils/NewsContext';
import { useWallet, formatAddress, useWalletLoaded } from 'ui/utils';

import IconCopy from '../../../components/iconfont/IconCopy';
import EyeOff from '../../FRWAssets/svg/EyeOff.svg';

import MenuDrawer from './Components/MenuDrawer';
import NewsView from './Components/NewsView';
import Popup from './Components/Popup';
import WalletFunction from './Components/WalletFunction';

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

type ChildAccount = {
  [key: string]: {
    name: string;
    description: string;
    thumbnail: {
      url: string;
    };
  };
};

const Header = ({ loading = false }) => {
  const usewallet = useWallet();
  const walletLoaded = useWalletLoaded();
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();

  const { clearCoins } = useCoins();
  const { currentNetwork, setNetwork, developerMode } = useNetworks();
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
    loggedInAccounts,
    mainAddressLoading,
    clearProfileData,
  } = useProfiles();

  const [drawer, setDrawer] = useState(false);

  const [mainnetAvailable, setMainnetAvailable] = useState(true);
  const [testnetAvailable, setTestnetAvailable] = useState(true);

  const [isPending, setIsPending] = useState(false);

  const [ispop, setPop] = useState(false);

  const [switchLoading, setSwitchLoading] = useState(false);
  const [expandAccount, setExpandAccount] = useState(false);
  const [, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState(null);

  // News Drawer
  const [showNewsDrawer, setShowNewsDrawer] = useState(false);
  const [usernameDrawer, setUsernameDrawer] = useState(false);

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

  const toggleUsernameDrawer = useCallback(() => {
    // Avoids unnecessary re-renders using a function to toggle the state
    setUsernameDrawer((prevUsernameDrawer) => !prevUsernameDrawer);
  }, []);

  const goToSettings = useCallback(() => {
    if (location.pathname.includes('/dashboard/setting')) {
      history.push('/dashboard');
    } else {
      history.push('/dashboard/setting');
    }
  }, [history, location.pathname]);

  const switchAccount = useCallback(
    async (account: LoggedInAccountWithIndex) => {
      setSwitchLoading(true);
      try {
        const switchingTo = 'mainnet';
        // Note that currentAccountIndex is only used in keyring for old accounts that don't have an id stored in the keyring
        // currentId always takes precedence
        // NOTE: TO FIX it also should be set to the index of the account in the keyring array, NOT the index in the loggedInAccounts array
        if (account.id) {
          await storage.set('currentId', account.id);
        } else {
          await storage.set('currentId', '');
        }

        await usewallet.signOutWallet();
        await usewallet.clearWallet();
        await usewallet.switchNetwork(switchingTo);
        setNetwork(switchingTo);
        clearCoins();
        clearProfileData();
        await usewallet.switchAccount(account.id);
      } catch (error) {
        console.error('Error during account switch:', error);
        //if cannot login directly with current password switch to unlock page
        await usewallet.lockWallet();
        history.push('/unlock');
      } finally {
        setPop(false);
        setSwitchLoading(false);
      }
    },
    [usewallet, history, setNetwork, clearCoins, clearProfileData]
  );

  const setWallets = async (walletInfo, key, index = null) => {
    await usewallet.setActiveWallet(walletInfo, key, index);
    // Clear collections
    usewallet.clearNFTCollection();
    usewallet.clearCoinList();
    // Navigate if needed
    history.push('/dashboard');
    window.location.reload();
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
  }, [checkAuthStatus, checkPendingTx, currentNetwork]);

  const checkNetwork = useCallback(async () => {
    const mainnetAvailable = await usewallet.openapi.pingNetwork('mainnet');
    setMainnetAvailable(mainnetAvailable);
    const testnetAvailable = await usewallet.openapi.pingNetwork('testnet');
    setTestnetAvailable(testnetAvailable);
  }, [usewallet]);

  useEffect(() => {
    if (usernameDrawer) {
      checkNetwork();
    }
  }, [usernameDrawer, checkNetwork]);

  const switchNetwork = useCallback(
    async (network: string) => {
      // Update local states
      setNetwork(network);

      // Switch network in wallet
      await usewallet.switchNetwork(network);

      toggleUsernameDrawer();

      // Navigate if needed
      history.push('/dashboard');
    },
    [usewallet, toggleUsernameDrawer, history, setNetwork]
  );

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

  const AccountFunction = (props) => {
    return (
      <ListItem
        disablePadding
        key={props.username}
        onClick={() => {
          toggleUsernameDrawer();
        }}
      >
        <ListItemButton
          onClick={() => {
            navigator.clipboard.writeText(props.username);
          }}
        >
          <ListItemIcon>
            <Avatar
              component="span"
              src={props.avatar}
              sx={{ width: '24px', height: '24px', ml: '4px' }}
              alt="avatar"
            />
          </ListItemIcon>
          <ListItemText>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Tooltip title={chrome.i18n.getMessage('Copy__username')} arrow>
                <Typography variant="body1" component="div" display="inline" color="text">
                  {'@' + props.username}
                </Typography>
              </Tooltip>
            </Box>
          </ListItemText>
        </ListItemButton>
      </ListItem>
    );
  };

  const NetworkFunction = () => {
    return (
      <>
        <Typography variant="h5" color="text" padding="18px 0 0 18px" fontWeight="semi-bold">
          {chrome.i18n.getMessage('Network')}
        </Typography>
        <List>
          <ListItem
            disablePadding
            key="mainnet"
            secondaryAction={
              !mainnetAvailable && (
                <ListItemText>
                  <Typography
                    variant="caption"
                    component="span"
                    display="inline"
                    color="error.main"
                  >
                    {chrome.i18n.getMessage('Unavailable')}
                  </Typography>
                </ListItemText>
              )
            }
            onClick={() => {
              switchNetwork('mainnet');
            }}
          >
            <ListItemButton>
              <ListItemIcon>
                <FiberManualRecordIcon
                  style={{
                    color: networkColor('mainnet'),
                    fontSize: '10px',
                    marginLeft: '10px',
                    marginRight: '10px',
                    opacity: currentNetwork === 'mainnet' ? '1' : '0.1',
                  }}
                />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body1" component="span" display="inline" color="text">
                  {chrome.i18n.getMessage('Mainnet')}
                </Typography>
              </ListItemText>
            </ListItemButton>
          </ListItem>

          <ListItem
            disablePadding
            key="testnet"
            secondaryAction={
              !testnetAvailable && (
                <ListItemText>
                  <Typography
                    variant="caption"
                    component="span"
                    display="inline"
                    color="error.main"
                  >
                    {chrome.i18n.getMessage('Unavailable')}
                  </Typography>
                </ListItemText>
              )
            }
            onClick={() => {
              switchNetwork('testnet');
            }}
          >
            <ListItemButton>
              <ListItemIcon>
                <FiberManualRecordIcon
                  style={{
                    color: networkColor('testnet'),
                    fontSize: '10px',
                    marginLeft: '10px',
                    marginRight: '10px',
                    fontFamily: 'Inter,sans-serif',
                    opacity: currentNetwork === 'testnet' ? '1' : '0.1',
                  }}
                />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body1" component="span" display="inline" color="text">
                  {chrome.i18n.getMessage('Testnet')}
                </Typography>
              </ListItemText>
            </ListItemButton>
          </ListItem>
        </List>
      </>
    );
  };

  const createWalletList = (props) => {
    return (
      <List component="nav" key={props.id} sx={{ mb: '0', padding: 0 }}>
        <WalletFunction
          props_id={props.id}
          name={props.name}
          address={props.address}
          icon={props.icon}
          color={props.color}
          setWallets={setWallets}
          currentWalletIndex={currentWalletIndex}
          currentWallet={currentWallet}
          mainAddress={mainAddress}
          setExpandAccount={setExpandAccount}
          expandAccount={expandAccount}
          walletList={walletList}
        />
      </List>
    );
  };

  const createAccountList = (props) => {
    return (
      props && (
        <List component="nav" key={props.username}>
          <AccountFunction username={props.username} avatar={props.avatar} />
        </List>
      )
    );
  };

  const usernameSelect = () => {
    return (
      <Drawer
        open={usernameDrawer}
        anchor="top"
        onClose={toggleUsernameDrawer}
        classes={{ paper: classes.paper }}
        PaperProps={{
          sx: { width: '100%', marginTop: '56px', bgcolor: 'background.paper' },
        }}
      >
        <Typography variant="h5" color="text" padding="18px 0 0 18px" fontWeight="semi-bold">
          {chrome.i18n.getMessage('Account')}
        </Typography>
        {userInfo && createAccountList(userInfo)}
        {developerMode && NetworkFunction()}
      </Drawer>
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

  const appBarLabel = (props) => {
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
                color: networkColor(currentNetwork),
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
                : currentNetwork !== 'mainnet'
                  ? `2px solid ${networkColor(currentNetwork)}`
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
            <Button
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
      <AppBar position="relative" className={classes.appBar} elevation={0}>
        <Toolbar sx={{ px: '12px', backgroundColor: '#282828' }}>
          {walletList && (
            <MenuDrawer
              userInfo={userInfo}
              drawer={drawer}
              toggleDrawer={toggleDrawer}
              otherAccounts={otherAccounts}
              switchAccount={switchAccount}
              togglePop={togglePop}
              walletList={walletList}
              childAccounts={childAccounts}
              current={currentWallet}
              createWalletList={createWalletList}
              setWallets={setWallets}
              currentNetwork={currentNetwork}
              evmWallet={evmWallet}
              networkColor={networkColor}
              evmLoading={evmLoading}
              modeOn={developerMode}
              mainAddressLoading={mainAddressLoading}
            />
          )}
          {appBarLabel(currentWallet)}
          {usernameSelect()}
          <NewsDrawer />
          {userInfo && (
            <Popup
              isConfirmationOpen={ispop}
              data={{ amount: 0 }}
              handleCloseIconClicked={() => setPop(false)}
              handleCancelBtnClicked={() => setPop(false)}
              handleAddBtnClicked={() => {
                setPop(false);
              }}
              userInfo={userInfo!}
              current={currentWallet!}
              switchAccount={switchAccount}
              loggedInAccounts={loggedInAccounts}
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
