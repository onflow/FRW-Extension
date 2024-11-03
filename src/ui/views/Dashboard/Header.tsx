import React, { useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import Box from '@mui/material/Box';
import MenuIcon from '@mui/icons-material/Menu';
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
  Divider,
  Button,
  Avatar,
  Skeleton,
  CircularProgress,
  CardMedia,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import IconCopy from '../../../components/iconfont/IconCopy';
import Tooltip from '@mui/material/Tooltip';
import { useWallet, formatAddress } from 'ui/utils';
import { isValidEthereumAddress } from 'ui/utils/address';
import { useHistory } from 'react-router-dom';
import { UserInfoResponse } from 'background/service/networkModel';
import { storage } from '@/background/webapi';
import { withPrefix, ensureEvmAddressPrefix } from '@/ui/utils/address';
import { StyledEngineProvider } from '@mui/material/styles';
import eventBus from '@/eventBus';
import EyeOff from '../../FRWAssets/svg/EyeOff.svg';
import Popup from './Components/Popup';
import MenuDrawer from './Components/MenuDrawer';
import { profileHooks } from 'ui/utils/profileHooks'
import { P } from 'ts-toolbelt/out/Object/_api';
import { Network } from 'ethers';

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

const tempEmoji = [
  {
    "emoji": "🥥",
    "name": "Coconut",
    "bgcolor": "#FFE4C4"
  },
  {
    "emoji": "🥑",
    "name": "Avocado",
    "bgcolor": "#98FB98"
  }
];

const Header = ({ loading }) => {

  const usewallet = useWallet();
  const classes = useStyles();
  const history = useHistory();

  const [isLoading, setLoading] = useState(loading);

  const [mainAddressLoading, setMainLoading] = useState(true);

  const [evmLoading, setEvmLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [userWallet, setWallet] = useState<any>(null);
  const [currentWallet, setCurrentWallet] = useState(0);
  const [current, setCurrent] = useState({});
  const [currentNetwork, setNetwork] = useState('mainnet');
  const [emojis, setEmojis] = useState(tempEmoji);

  const [isSandbox, setIsSandbox] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [otherAccounts, setOtherAccounts] = useState<any>(null);
  const [loggedInAccounts, setLoggedIn] = useState<any>(null);
  const [childAccounts, setChildAccount] = useState<ChildAccount>({});
  const [modeOn, setModeOn] = useState(false);
  // const [unread, setUnread] = useState(0);

  const [domain, setDomain] = useState('');
  const [mainnetAvailable, setMainnetAvailable] = useState(true);
  const [testnetAvailable, setTestnetAvailable] = useState(true);
  const [evmAddress, setEvmAddress] = useState('');



  const [flowBalance, setFlowBalance] = useState(0);

  const [modeAnonymous, setModeAnonymous] = useState(false);

  const [isPending, setIsPending] = useState(false);

  const [ispop, setPop] = useState(false);

  const [initialStart, setInitial] = useState(true);

  const toggleDrawer = () => {
    setDrawer(!drawer);
  };

  const togglePop = () => {
    setPop(!ispop);
  };

  // const toggleUnread = () => {
  //   setUnread(0);
  // };

  const [usernameDrawer, setUsernameDrawer] = useState(false);
  const toggleUsernameDrawer = () => {
    setUsernameDrawer(!usernameDrawer);
  };

  const wallets = (data) => {
    let sortData = data;
    const walletName = domain ? domain : 'Wallet';
    if (!Array.isArray(sortData)) {
      sortData = [];
    }
    const filteredData = (sortData || []).filter((wallet, index) => {
      return wallet.chain_id == currentNetwork;
    });
    return (filteredData || []).map((wallet, index) => {
      return {
        id: index,
        name: walletName,
        address: withPrefix(wallet.blockchain[0].address),
        key: index,
      };
    });
  };

  const [walletList, setWalletList] = useState([]);

  const fetchUserWallet = async () => {

    const userInfo = await usewallet.getUserInfo(false);
    await setUserInfo(userInfo);
    if (userInfo.private == 1) {
      setModeAnonymous(false);
    } else {
      setModeAnonymous(true);
    }

    freshUserWallet();
    freshUserInfo();
    const childresp: ChildAccount = await usewallet.checkUserChildAccount();
    setChildAccount(childresp);
    usewallet.setChildWallet(childresp);
  };

  const freshUserWallet = async () => {
    const wallet = await usewallet.getUserWallets();
    const fData = wallet.filter((item) => item.blockchain !== null);

    // putDeviceInfo(fData);
    await setWallet(fData);
    if (initialStart) {
      await usewallet.openapi.putDeviceInfo(fData);
      setInitial(false);
    }
  };

  const freshUserInfo = async () => {
    const currentWallet = await usewallet.getCurrentWallet();
    const isChild = await usewallet.getActiveWallet();
    const mainAddress = await usewallet.getMainAddress();
    

    if (isChild === 'evm') {
      const res = await usewallet.queryEvmAddress(mainAddress!);
      const evmWallet = await usewallet.getEvmWallet();
      const evmAddress = ensureEvmAddressPrefix(res)
      evmWallet.address = evmAddress
      await setCurrent(evmWallet);
      setMainLoading(false);
    } else {
      await setCurrent(currentWallet);
      setMainLoading(false);
    }
    const keys = await usewallet.getAccount();
    const pubKTuple = await usewallet.getPubKey();

    if (mainAddress) {
      try {
        const res = await usewallet.queryEvmAddress(mainAddress);
        setEvmAddress(res!);
      } catch (err) {
        console.log('queryEvmAddress err', err);
      } finally {
        setEvmLoading(false);
      }
    }
    
    const walletData = await usewallet.getUserInfo(true);

    const { otherAccounts, wallet, loggedInAccounts } = await usewallet.openapi.freshUserInfo(currentWallet, keys, pubKTuple, walletData, isChild);
    if (!isChild) {
      setFlowBalance(keys.balance);
    } else {
      usewallet.getUserWallets().then((res) => {
        const address = res[0].blockchain[0].address;
        usewallet.getFlowBalance(address).then((balance) => {
          setFlowBalance(balance);
        });
      });
    }
    await setOtherAccounts(otherAccounts);
    await setUserInfo(wallet);
    await setLoggedIn(loggedInAccounts);

    // usewallet.checkUserDomain(wallet.username);
  };
  const switchAccount = async (account) => {
    const switchingTo =
      process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet';
    await storage.set('currentAccountIndex', account.indexInLoggedInAccounts);
    if (account.id) {
      await storage.set('currentId', account.id);
    } else {
      await storage.set('currentId', '');
    }
    await usewallet.lockWallet();
    history.push('/switchunlock');
    await usewallet.clearWallet();
    await usewallet.switchNetwork(switchingTo);
  };

  const loadNetwork = async () => {
    const network = await usewallet.getNetwork();
    setIsSandbox(false);

    setEvmLoading(true);
    await setNetwork(network);
  }

  // const loadInbox = async () => {

  //   const giftBoxHistory = await usewallet.getHistory();
  //   const resp = await usewallet.fetchFlownsInbox();
  //   let tempRead = 0;
  //   let nftRead = 0;
  //   Object.keys(resp.vaultBalances).map(() => {
  //     tempRead += 1;
  //   });
  //   Object.keys(resp.collections).map((k) => {
  //     nftRead += resp.collections[k].length;
  //   });

  //   giftBoxHistory.token.map((token) => {
  //     const key = Object.keys(token)[0];
  //     if (parseFloat(token[key]) === parseFloat(resp.vaultBalances[key])) {
  //       tempRead -= 1;
  //     }
  //   });

  //   Object.keys(giftBoxHistory.nft).map((k) => {
  //     const arr = giftBoxHistory.nft[k];
  //     arr.map((v) => {
  //       if (resp.collections[k].includes(v)) {
  //         nftRead -= 1;
  //       }
  //     })
  //   });
  //   const totalUnread = nftRead + tempRead;
  //   setUnread(totalUnread);

  // }
  const loadDeveloperMode = async () => {
    const developerMode = await storage.get('developerMode');
    if (developerMode) {
      setModeOn(developerMode);
    }
  };

  // const goToInbox = () => {
  //   if (domain) {
  //     history.push('/dashboard/inbox');
  //   } else {
  //     history.push('/dashboard/flowns');
  //   }
  // }

  const setWallets = async (walletInfo, key) => {
    await usewallet.setActiveWallet(walletInfo, key);
    const currentWallet = await usewallet.getCurrentWallet();
    setCurrent(currentWallet);
    setMainLoading(false);
    usewallet.clearNFTCollection();
    usewallet.clearCoinList();
    // TODO: replace it with better UX
    history.push('/dashboard')
    window.location.reload();

  };

  const transactionHanlder = (request) => {
    if (request.msg === 'transactionPending') {
      setIsPending(true);
    }
    if (request.msg === 'transactionDone') {
      setIsPending(false);
    }
    return true;
  };

  const checkPendingTx = async () => {
    const network = await usewallet.getNetwork();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = await chrome.storage.session.get('transactionPending');
    const now = new Date();
    if (result.transactionPending?.date) {
      const diff = now.getTime() - result.transactionPending.date.getTime();
      const inMins = Math.round(diff / 60000);
      console.log('inMins ->', inMins, diff);
      if (inMins > 5) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
  };

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

  const checkAuthStatus = async () => {
    await usewallet.openapi.checkAuthStatus();
    await usewallet.checkNetwork();
  };

  const fetchProfile = async () => {
    const emojires = await usewallet.getEmoji();
    setEmojis(emojires);
  }
  useEffect(() => {
    loadNetwork();
    fetchUserWallet();
    loadDeveloperMode();
    checkPendingTx();
    checkAuthStatus();
    fetchProfile();

    const addressDone = () => {
      fetchUserWallet();
    };

    const changeEmoji = () => {
      fetchProfile();
    };

    const networkChanged = (network) => {
      loadNetwork();
    };

    chrome.runtime.onMessage.addListener(transactionHanlder);
    /**
     * Fired when a message is sent from either an extension process or a content script.
     */
    eventBus.addEventListener('addressDone', addressDone);
    eventBus.addEventListener('profileChanged', changeEmoji);
    eventBus.addEventListener('switchNetwork', networkChanged);
    return () => {
      eventBus.removeEventListener('addressDone', addressDone);
      eventBus.removeEventListener('switchNetwork', networkChanged);
      eventBus.removeEventListener('profileChanged', changeEmoji);
      chrome.runtime.onMessage.removeListener(transactionHanlder);
    };
  }, []);

  useEffect(() => {
    const list = wallets(userWallet);
    setWalletList(list);
    setCurrentWallet(0);
    setLoading(userWallet === null);
  }, [userWallet, currentNetwork]);

  const checkNetwork = async () => {
    const mainnetAvailable = await usewallet.openapi.pingNetwork('mainnet');
    setMainnetAvailable(mainnetAvailable);
    const testnetAvailable = await usewallet.openapi.pingNetwork('testnet');
    setTestnetAvailable(testnetAvailable);
    // const crescendoAvailable = await usewallet.openapi.pingNetwork('crescendo')
    // setSandboxnetAvailable(crescendoAvailable)
  };

  useEffect(() => {
    if (usernameDrawer) {
      checkNetwork();
    }
  }, [usernameDrawer]);

  const switchNetwork = async (network: string) => {
    setNetwork(network);
    usewallet.switchNetwork(network);
    toggleUsernameDrawer();

    // TODO: replace it with better UX
    history.push('/dashboard')
    window.location.reload();
  };


  const WalletFunction = (props) => {
    return (
      <ListItem
        onClick={() => {
          setWallets(null, null);
        }}
        sx={{ mb: 0, paddingX: '0', cursor: 'pointer' }}
      >

        <ListItemButton
          sx={{ mb: 0, display: 'flex', px: '16px', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {emojis &&
            < Box sx={{
              display: 'flex', height: '32px', width: '32px', borderRadius: '32px', alignItems: 'center', justifyContent: 'center', backgroundColor: emojis[0]['bgcolor'], marginRight: '12px'
            }}>
              <Typography sx={{ fontSize: '20px', fontWeight: '600' }}>
                {emojis[0].emoji}
              </Typography>
            </Box>
          }
          <Box sx={{ display: 'flex', flexDirection: 'column', background: 'none' }}>
            <Typography
              variant="body1"
              component="span"
              fontWeight={'semi-bold'}
              sx={{ fontSize: '12px' }}
              display="flex"
              color={
                props.props_id == currentWallet
                  ? 'text.title'
                  : 'text.nonselect'
              }
            >
              {emojis[0].name}
              {props.address == current['address'] && (
                <ListItemIcon
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <FiberManualRecordIcon
                    style={{
                      fontSize: '10px',
                      color: '#40C900',
                      marginLeft: '10px',
                    }}
                  />
                </ListItemIcon>
              )}
            </Typography>
            <Typography
              variant="body1"
              component="span"
              // display="inline"
              color={'text.nonselect'}
              sx={{ fontSize: '12px', textTransform: 'uppercase' }}
            >
              {/* <span>{'  '}</span> */}
              {(flowBalance / 100000000).toFixed(3)} FLOW
            </Typography>
          </Box>
          <Box sx={{ flex: "1" }}></Box>
          {/* <IconEnd size={12} /> */}
        </ListItemButton>
      </ListItem >
    );
  };

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
                <Typography
                  variant="body1"
                  component="div"
                  display="inline"
                  color="text"
                >
                  {'@' + props.username}
                </Typography>
              </Tooltip>
              {modeAnonymous && (
                <Tooltip
                  title={chrome.i18n.getMessage('Anonymous__mode__on')}
                  arrow
                >
                  <img
                    style={{ display: 'inline-block', width: '20px' }}
                    src={EyeOff}
                  />
                </Tooltip>
              )}
            </Box>
          </ListItemText>
        </ListItemButton>
      </ListItem>
    );
  };

  const NetworkFunction = () => {
    return (
      <>
        <Typography
          variant="h5"
          color="text"
          padding="18px 0 0 18px"
          fontWeight="semi-bold"
        >
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
                    opacity: currentNetwork == 'mainnet' ? '1' : '0.1',
                  }}
                />
              </ListItemIcon>
              <ListItemText>
                <Typography
                  variant="body1"
                  component="span"
                  display="inline"
                  color="text"
                >
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
                    opacity: currentNetwork == 'testnet' ? '1' : '0.1',
                  }}
                />
              </ListItemIcon>
              <ListItemText>
                <Typography
                  variant="body1"
                  component="span"
                  display="inline"
                  color="text"
                >
                  {chrome.i18n.getMessage('Testnet')}
                </Typography>
              </ListItemText>
            </ListItemButton>
          </ListItem>

          {/* {isSandboxEnabled && <ListItem
            disablePadding
            key='crescendo'
            secondaryAction={
              !crescendoAvailable && (<ListItemText>
                <Typography
                  variant="caption"
                  component="span"
                  display="inline"
                  color='error.main'
                >
                  {chrome.i18n.getMessage('Unavailable')}
                </Typography>
              </ListItemText>)
            }
            onClick={() => {
              switchNetwork('crescendo');
            }}>
            <ListItemButton>
              <ListItemIcon>
                <FiberManualRecordIcon
                  style={{
                    color: networkColor('crescendo'),
                    fontSize: '10px',
                    marginLeft: '10px',
                    marginRight: '10px',
                    opacity: currentNetwork == 'crescendo' ? '1' : '0.1',
                  }}
                />
              </ListItemIcon>
              <ListItemText>
                <Typography
                  variant="body1"
                  component="span"
                  display="inline"
                  color='text'
                >
                  {chrome.i18n.getMessage('Crescendo')}
                </Typography>
              </ListItemText>
            </ListItemButton>
          </ListItem>
          } */}
        </List>
      </>
    );
  };

  const createWalletList = (props) => {
    return (
      <List component="nav" key={props.id}>
        <WalletFunction
          props_id={props.id}
          name={props.name}
          address={props.address}
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
        <Typography
          variant="h5"
          color="text"
          padding="18px 0 0 18px"
          fontWeight="semi-bold"
        >
          {chrome.i18n.getMessage('Account')}
        </Typography>
        {userInfo && createAccountList(userInfo)}
        {modeOn && NetworkFunction()}
      </Drawer>
    );
  };

  const appBarLabel = (props) => {
    return (
      <Toolbar
        sx={{ height: '56px', width: '100%', display: 'flex', px: '0px' }}
      >
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={toggleDrawer}
          sx={{ marginLeft: '0px', padding: '3px', position: 'relative' }}
        >
          <MenuIcon />
          {/* {unread ?
            <Box sx={{
              width: '8px',
              height: '8px',
              backgroundColor: '#41CC5D',
              borderRadius: '8px',
              position: 'absolute',
              top: '5px',
              right: '2px'
            }}>
            </Box>
            :
            <Box></Box>
          } */}
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        {!mainAddressLoading && props && props.address ? (
          <Tooltip title={chrome.i18n.getMessage('Copy__Address')} arrow>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(props.address);
              }}
              variant="text"
            >
              <Box
                component="div"
                sx={{ display: 'flex', flexDirection: 'column' }}
              >
                <Typography
                  variant="overline"
                  color="text"
                  align="center"
                  display="block"
                  sx={{ lineHeight: '1.5' }}
                >
                  {`${props.name === 'Flow' ? 'Wallet' : props.name}${isValidEthereumAddress(props.address) ? ' EVM' : ''}`}
                </Typography>
                <Box sx={{ display: 'flex', gap: '5px' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'lowercase' }}>
                    {formatAddress(props.address)}
                  </Typography>
                  <IconCopy fill="icon.navi" width="12px" />
                </Box>
              </Box>
            </Button>
          </Tooltip>
        ) : (
          <Skeleton
            variant="rectangular"
            width={78}
            height={33}
            sx={{ borderRadius: '8px' }}
          />
        )}
        <Box sx={{ flexGrow: 1 }} />

        {!isLoading && userInfo && props ? (
          <Tooltip
            title={
              isPending ? chrome.i18n.getMessage('Pending__Transaction') : ''
            }
            arrow
          >
            <Box style={{ position: 'relative' }}>
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
                edge="end"
                color="inherit"
                aria-label="avatar"
                onClick={toggleUsernameDrawer}
                sx={{
                  border: isPending
                    ? ''
                    : currentNetwork !== 'mainnet'
                      ? `2px solid ${networkColor(currentNetwork)}`
                      : isSandbox
                        ? '2px solid #CCAF21'
                        : '2px solid #282828',
                  padding: '3px',
                  marginRight: '0px',
                }}
              >
                <img
                  src={userInfo.avatar}
                  style={{ backgroundColor: '#797979', borderRadius: '10px' }}
                  width="20px"
                  height="20px"
                />
              </IconButton>
            </Box>
          </Tooltip>
        ) : (
          <Skeleton variant="circular" width={20} height={20} />
        )}
      </Toolbar>
    );
  };

  return (
    <StyledEngineProvider injectFirst>
      <AppBar position="relative" className={classes.appBar} elevation={0}>
        <Toolbar sx={{ px: '12px', backgroundColor: '#282828' }}>
          {userInfo &&
            <MenuDrawer
              userInfo={userInfo!}
              drawer={drawer}
              toggleDrawer={toggleDrawer}
              otherAccounts={otherAccounts}
              switchAccount={switchAccount}
              togglePop={togglePop}
              walletList={walletList}
              childAccounts={childAccounts}
              current={current}
              createWalletList={createWalletList}
              setWallets={setWallets}
              currentNetwork={currentNetwork}
              evmAddress={evmAddress}
              emojis={emojis}
              networkColor={networkColor}
              evmLoading={evmLoading}
              modeOn={modeOn}
            />
          }
          {appBarLabel(current)}
          {usernameSelect()}
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
              current={current!}
              switchAccount={switchAccount}
              loggedInAccounts={loggedInAccounts}
            />
          )}
        </Toolbar>
      </AppBar>
    </StyledEngineProvider>
  );
};

export default Header;
