import React, { useEffect, useState } from 'react';
import { useWallet } from 'ui/utils';
import { formatLargeNumber } from 'ui/utils/number';
import { Box } from '@mui/system';
import { Typography, Button, Tab, Tabs, Skeleton, Drawer, ButtonBase, CardMedia } from '@mui/material';
import theme from '../../style/LLTheme';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import SwipeableViews from 'react-swipeable-views';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import CoinList from './Coinlist';
import MoveBoard from '../MoveBoard';
import { withPrefix } from '../../utils/address';
import { useHistory } from 'react-router-dom';
import TransferList from './TransferList';
import { useLocation } from 'react-router-dom';
import eventBus from '@/eventBus';
import LLComingSoon from '@/ui/FRWComponent/LLComingSoonWarning';
import ReactTextTransition from 'react-text-transition';
import OnRampList from './OnRampList';
import iconMove from 'ui/FRWAssets/svg/homeMove.svg';
import sendIcon from 'ui/FRWAssets/svg/sendIcon.svg';
import swapIcon from 'ui/FRWAssets/svg/swapIcon.svg';
import receiveIcon from 'ui/FRWAssets/svg/receiveIcon.svg';
import buyIcon from 'ui/FRWAssets/svg/buyIcon.svg';


function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

const WalletTab = ({ network }) => {
  const wallet = useWallet();
  const history = useHistory();
  const location = useLocation();
  const [value, setValue] = React.useState(0);
  const [coinLoading, setCoinLoading] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [coinData, setCoinData] = useState<any>([]);
  const [accessible, setAccessible] = useState<any>([]);
  const [balance, setBalance] = useState<string>('$0.00');
  const [childType, setChildType] = useState<string>('');
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [childAccount, setChildAccount] = useState<any>({});
  const [txCount, setTxCount] = useState('');
  const [isOnRamp, setOnRamp] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [swapConfig, setSwapConfig] = useState(false);
  const [showMoveBoard, setMoveBoard] = useState(false);
  const [buyHover, setBuyHover] = useState(false);
  const [sendHover, setSendHover] = useState(false);
  const [swapHover, setSwapHover] = useState(false);
  const [canMoveChild, setCanMoveChild] = useState(true);
  const [receiveHover, setReceiveHover] = useState(false);
  const [childStateLoading, setChildStateLoading] = useState<boolean>(false);
  const [lastManualAddressCallTime, setlastManualAddressCallTime] = useState<any>(0);

  const [incLink, _] = useState(
    network === 'mainnet'
      ? 'https://app.increment.fi/swap'
      : 'https://demo.increment.fi/swap'
  );

  const expiry_time = 60000;

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleChangeIndex = (index) => {
    setValue(index);
  };

  const setUserAddress = async () => {
    let data = '';
    try {
      if (childType === 'evm') {
        data = await wallet.getEvmAddress();
      } else {
        data = await wallet.getCurrentAddress();
      }
    } catch (error) {
      console.error('Error getting address:', error);
      data = '';
    }
    if (data) {
      setAddress(withPrefix(data) || '');
    } else {
      const currentTime = Date.now();
      if (currentTime - lastManualAddressCallTime > 60000) {
        try {
          await wallet.openapi.getManualAddress();
          setlastManualAddressCallTime(currentTime)
        } catch (error) {
          console.error('Error getting manual address:', error);
        }
      } else {
        console.log('Skipped calling getManualAddress to prevent frequent calls');
      }
    }
    return data;
  };

  //todo: move to util
  const pollingFunction = (func, time = 1000, endTime, immediate = false) => {
    immediate && func();
    const startTime = new Date().getTime();
    const pollTimer = setInterval(async () => {
      const nowTime = new Date().getTime();
      const data = await func();
      if (data.length > 2 || nowTime - startTime >= endTime) {
        pollTimer && clearInterval(pollTimer);
        eventBus.emit('addressDone');
      }
    }, time);
    return pollTimer;
  };

  const refreshWithRetry = async (expiry_time, retryCount = 0, delay = 2000, maxRetries = 5) => {
    if (childStateLoading) {
      console.log("childStateLoading.");
      return;
    }
    try {

      const refreshedCoinlist = await wallet.refreshCoinList(expiry_time);
      console.log(`refreshedCoinlist fetching price for token:`, refreshedCoinlist);

      if (refreshedCoinlist.length === 0 && retryCount < maxRetries) {
        console.log(`No data found, retrying in 5 seconds... (Attempt ${retryCount + 1} of ${maxRetries})`);
        setTimeout(() => {
          refreshWithRetry(expiry_time, retryCount + 1);
        }, delay);
      } else {
        console.log(`refreshedCoinlist found, refreshedCoinlist`, refreshedCoinlist);
        sortWallet(refreshedCoinlist);
      }
    } catch (error) {
      console.error(`Error fetching price for token:`, error);
      if (retryCount < maxRetries) {
        console.log(`Retrying refreshCoinList in ${delay / 1000} seconds... (Attempt ${retryCount + 1} of ${maxRetries})`);
        setTimeout(() => {
          refreshWithRetry(expiry_time, retryCount + 1);
        }, delay);
      } else {
        wallet.refreshCoinList(expiry_time)
          .then((res) => {
            if (res.length === 0 && retryCount < maxRetries) {
              console.log(`No data found in storage, retrying in 5 seconds... (Attempt ${retryCount + 1} of ${maxRetries})`);
              setTimeout(() => {
                refreshWithRetry(expiry_time, retryCount + 1);
              }, delay);
            } else {
              console.log(`res found, refreshedCoinlist`, res);
              sortWallet(res);
            }
          })
          .catch((err) => {
            console.error(`Error getting CoinList price for token:`, err);
          });
      }
    }
  };

  const sortWallet = (data) => {
    const sorted = data.sort((a, b) => {
      if (b.total === a.total) {
        return b.balance - a.balance;
      } else {
        return b.total - a.total;
      }
    });
    handleStorageData(sorted);
  };

  const fetchWallet = async () => {
    // If childType is 'evm', handle it first
    if (childType === 'evm') {
      const storageData = await wallet.refreshEvmList(expiry_time);
      sortWallet(storageData);
      return;
    }

    // If not 'evm', check if it's active or not
    if (!isActive && childType !== 'evm') {
      const ftResult = await wallet.checkAccessibleFt(address);
      if (ftResult) {
        setAccessible(ftResult);
      }
    }

    // Handle all non-evm and non-active cases here
    try {
      const refreshedCoinlist = await wallet.refreshCoinList(expiry_time);
      if (refreshedCoinlist.length === 0) {
        refreshWithRetry(expiry_time);
      } else {
        sortWallet(refreshedCoinlist);
      }
    } catch (error) {
      refreshWithRetry(expiry_time);
    }
  };

  const loadCache = async () => {
    const storageSwap = await wallet.getSwapConfig();
    setSwapConfig(storageSwap);
    const storageData = await wallet.getCoinList(expiry_time);
    sortWallet(storageData);
  };


  const handleStorageData = async (storageData) => {
    if (storageData) {
      const uniqueTokens = storageData.filter((token, index, self) =>
        index === self.findIndex((t) => t.unit.toLowerCase() === token.unit.toLowerCase())
      );
      await setCoinData(uniqueTokens);
      let sum = 0;
      storageData
        .filter((item) => item.total !== null)
        .forEach((coin) => {
          sum = sum + parseFloat(coin.total);
        });
      setBalance('$ ' + sum.toFixed(2));
    }
  };

  const fetchChildState = async () => {
    setChildStateLoading(true)
    const isChild = await wallet.getActiveWallet();
    const childresp = await wallet.checkUserChildAccount();
    setChildAccount(childresp);
    setChildType(isChild);
    if (isChild && isChild !== 'evm') {
      await setIsActive(false);
    } else {
      setIsActive(true);
    }
    setChildStateLoading(false)
    return isChild;
  };

  useEffect(() => {
    fetchChildState();
    const pollTimer = pollingFunction(setUserAddress, 5000, 300000, true);

    if (location.search.includes('activity')) {
      setValue(1);
    }

    return function cleanup() {
      clearInterval(pollTimer);
    };
  }, []);

  const goMoveBoard = async () => {
    setMoveBoard(true);
  };

  const filteredCoinData = coinData.filter((coin) => {
    if (childType === 'evm' && coin.unit !== 'flow' && parseFloat(coin.balance) === 0) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    setCoinLoading(address === '');
    if (address) {
      setCoinLoading(true);
      loadCache();
      setCoinLoading(false);
      fetchWallet();
    }
  }, [address]);

  useEffect(() => {
    setUserAddress();
  }, [childType]);

  useEffect(() => {
    const checkPermission = async () => {
      const result = await wallet.checkCanMoveChild();
      setCanMoveChild(result);
    };

    checkPermission();
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'black',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          backgroundColor: 'background.default',
        }}
      >
        {coinLoading ? (
          <Skeleton
            width="30%"
            sx={{
              py: '25px',
              my: '18px',
              borderRadius: '8px',
              // height: '48px',
              alignSelf: 'center',
            }}
          />
        ) : (
          <Typography
            variant="body1"
            sx={{
              py: '30px',
              alignSelf: 'center',
              fontSize: '32px',
              fontWeight: 'semi-bold',
            }}
            component="span"
          >
            {/* {balance} */}
            {/* <ReactTextTransition
              text={balance}
              springConfig={{ damping: 20 }}
              style={{textAlign: 'center' }}
              noOverflow
            /> */}

            {`$${formatLargeNumber(balance)}`.split('').map((n, i) => (
              <ReactTextTransition
                key={i}
                text={n}
                className="big"
                delay={i * 20}
                direction="down"
                noOverflow
                inline
              />
            ))}
          </Typography>
        )}
        <Box
          sx={{
            display: 'flex',
            height: '32px',
            px: '20px',
            mb: '20px',
          }}
        >
          <Box sx={{ display: 'flex', gap: '2px', width: '100%', }}>
            {(!childType || childType === '' || childType === 'evm') &&
              <Button
                color="info3"
                variant="contained"
                onMouseEnter={() => setSendHover(true)}
                onMouseLeave={() => setSendHover(false)}
                onClick={() => history.push('/dashboard/wallet/send')}
                sx={{
                  height: '36px',
                  borderTopLeftRadius: '24px',
                  borderBottomLeftRadius: '24px',
                  borderTopRightRadius: '0',
                  borderBottomRightRadius: '0',
                  px: '12px !important',
                  minWidth: '56px',
                  width: sendHover ? '100%' : '56px',
                  textTransform: 'capitalize !important',
                  flex: '1',
                  transition: 'width 0.3s ease-in-out'
                }}
              >
                <CardMedia sx={{ width: '20px', height: '20px', color: 'FFF' }} image={sendIcon} />
                {sendHover && <Typography sx={{ fontWeight: 'normal', color: '#FFF', fontSize: '12px', textTransform: 'capitalize !important', marginLeft: '4px' }}>{chrome.i18n.getMessage('Send')}</Typography>}
              </Button>

            }

            {!childType && (
              <Button
                color="info3"
                variant="contained"
                sx={{
                  height: '36px',
                  px: '12px !important',
                  minWidth: '56px',
                  borderRadius: '0px',
                  width: swapHover ? '100%' : '56px',
                  textTransform: 'capitalize !important',
                  flex: '1',
                  transition: 'width 0.3s ease-in-out'
                }}
                onMouseEnter={() => setSwapHover(true)}
                onMouseLeave={() => setSwapHover(false)}
                onClick={() => {
                  window.open(incLink, '_blank', 'noopener,noreferrer');
                }}
              >
                <CardMedia sx={{ width: '20px', height: '20px', color: 'FFF' }} image={swapIcon} />
                {swapHover && <Typography sx={{ fontWeight: 'normal', color: '#FFF', fontSize: '12px', textTransform: 'capitalize !important', marginLeft: '4px' }}>{chrome.i18n.getMessage('Swap')}</Typography>}
              </Button>
            )}


            <Button
              color="info3"
              variant="contained"
              sx={{
                height: '36px',
                px: '12px !important',
                minWidth: '56px',
                borderTopLeftRadius: (!childType || childType === '' || childType === 'evm') ? '0px' : '24px',
                borderBottomLeftRadius: (!childType || childType === '' || childType === 'evm') ? '0px' : '24px',
                borderTopRightRadius: isActive ? '0px' : '24px',
                borderBottomRightRadius: isActive ? '0px' : '24px',
                width: receiveHover ? '100%' : '56px',
                textTransform: 'capitalize !important',
                flex: '1',
                transition: 'width 0.3s ease-in-out'
              }}
              onMouseEnter={() => setReceiveHover(true)}
              onMouseLeave={() => setReceiveHover(false)}
              onClick={() => history.push('/dashboard/wallet/deposit')}
            >
              <CardMedia sx={{ width: '20px', height: '20px', color: 'FFF' }} image={receiveIcon} />
              {receiveHover && <Typography sx={{ fontWeight: 'normal', color: '#FFF', fontSize: '12px', textTransform: 'capitalize !important', marginLeft: '4px' }}>{chrome.i18n.getMessage('Receive')}</Typography>}
            </Button>
            {isActive &&
              <Button
                color="info3"
                variant="contained"
                sx={{
                  height: '36px',
                  borderTopRightRadius: '24px',
                  borderBottomRightRadius: '24px',
                  borderTopLeftRadius: '0px',
                  borderBottomLeftRadius: '0px',
                  px: '12px !important',
                  minWidth: '56px',
                  width: buyHover ? '100%' : '56px',
                  textTransform: 'capitalize !important',
                  flex: '1',
                  transition: 'width 0.3s ease-in-out'
                }}
                onMouseEnter={() => setBuyHover(true)}
                onMouseLeave={() => setBuyHover(false)}
                onClick={() => setOnRamp(true)}
              >
                <CardMedia sx={{ width: '20px', height: '20px', color: 'FFF' }} image={buyIcon} />
                {buyHover && <Typography sx={{ fontWeight: 'normal', color: '#FFF', fontSize: '12px', textTransform: 'capitalize !important', marginLeft: '4px' }}>{chrome.i18n.getMessage('Buy')}</Typography>}
              </Button>
            }
          </Box>
          {canMoveChild
            &&


            <Box sx={{ flex: '1 1 5px' }}>
            </Box>
          }
          {canMoveChild
            &&

            <Box>
              <Button
                color="info3"
                variant="contained"
                onClick={() => goMoveBoard()}
                sx={{ height: '36px', borderRadius: '24px', px: '12px' }}
              >
                <CardMedia sx={{ width: '20px', height: '20px', marginRight: '4px', color: 'FFF' }} image={iconMove} />
                <Typography sx={{ fontWeight: 'normal', color: '#FFF', fontSize: '12px', textTransform: 'capitalize !important' }}>
                  {chrome.i18n.getMessage('Move')}
                </Typography>
              </Button>
            </Box>
          }

        </Box>
        <Tabs
          value={value}
          sx={{ width: '100%' }}
          onChange={handleChange}
          TabIndicatorProps={{
            style: {
              backgroundColor: '#5a5a5a',
            },
          }}
          // textColor="inherit"
          variant="fullWidth"
          aria-label="full width tabs example"
        >
          <Tab
            icon={
              <SavingsRoundedIcon
                sx={{ color: 'text.secondary' }}
                fontSize="small"
              />
            }
            iconPosition="start"
            label={
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  textTransform: 'capitalize',
                  fontSize: '10',
                  fontWeight: 'semi-bold',
                }}
              >
                {childType === 'evm' ? filteredCoinData?.length || '' : coinData?.length || ''} {chrome.i18n.getMessage('coins')}
              </Typography>
            }
            style={{ color: '#F9F9F9', minHeight: '25px' }}
            {...a11yProps(0)}
          />
          <Tab
            icon={
              <FlashOnRoundedIcon
                sx={{ color: 'text.secondary' }}
                fontSize="small"
              />
            }
            iconPosition="start"
            label={
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  textTransform: 'capitalize',
                  fontSize: '10',
                  fontWeight: 'semi-bold',
                }}
              >
                {`${txCount}`} {chrome.i18n.getMessage('Activity')}
              </Typography>
            }
            style={{ color: '#F9F9F9', minHeight: '25px' }}
            {...a11yProps(1)}
          />
        </Tabs>
      </Box>

      <SwipeableViews
        axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
        index={value}
        onChangeIndex={handleChangeIndex}
        style={{ height: '100%', width: '100%' }}
      >
        <TabPanel value={value} index={0}>
          <CoinList data={coinData} ableFt={accessible} isActive={isActive} childType={childType} coinLoading={coinLoading} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <TransferList setCount={setTxCount} />
        </TabPanel>
      </SwipeableViews>
      <LLComingSoon
        alertOpen={alertOpen}
        handleCloseIconClicked={() => setAlertOpen(false)}
      />

      <Drawer
        anchor="bottom"
        open={isOnRamp}
        transitionDuration={300}
        PaperProps={{
          sx: {
            width: '100%',
            height: '65%',
            bgcolor: 'background.default',
            borderRadius: '18px 18px 0px 0px',
          },
        }}
      >
        <OnRampList close={() => setOnRamp(false)} />
      </Drawer>
      {
        showMoveBoard && (
          <MoveBoard
            showMoveBoard={showMoveBoard}
            handleCloseIconClicked={() => setMoveBoard(false)}
            handleCancelBtnClicked={() => setMoveBoard(false)}
            handleAddBtnClicked={() => {
              setMoveBoard(false);
            }}
          />
        )
      }
    </Box >
  );
};

export default WalletTab;
