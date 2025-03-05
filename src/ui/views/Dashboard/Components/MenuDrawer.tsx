import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
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
  Divider,
  CardMedia,
  Skeleton,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import type { UserInfoResponse } from '@/shared/types/network-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import importIcon from 'ui/FRWAssets/svg/importIcon.svg';
import popLock from 'ui/FRWAssets/svg/popLock.svg';
import { useWallet } from 'ui/utils';

import rightarrow from '../../../FRWAssets/svg/rightarrow.svg';
import sideMore from '../../../FRWAssets/svg/sideMore.svg';

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
  userInfo: UserInfoResponse | null;
  drawer: boolean;
  toggleDrawer: any;
  otherAccounts: any;
  switchAccount: any;
  togglePop: any;
  walletList: any;
  childAccounts: any;
  current: any;
  createWalletList: any;
  setWallets: any;
  currentNetwork: string;
  evmWallet: any;
  networkColor: any;
  evmLoading: boolean;
  modeOn: boolean;
  mainAddressLoading: boolean;
}

const MenuDrawer = (props: MenuDrawerProps) => {
  const usewallet = useWallet();
  const history = useHistory();
  const classes = useStyles();
  const [evmMode, setEvmMode] = useState(true);
  const [isEvm, setIsEvm] = useState(false);
  const [evmBalance, setEvmBalance] = useState(0);
  const { clearProfileData } = useProfiles();

  interface EvmADDComponentProps {
    myString: string | number;
  }

  const EvmADDComponent: React.FC<EvmADDComponentProps> = ({ myString }) => {
    // const formattedString = formatString(myString);

    return (
      <Typography
        sx={{
          color: '#808080',
          fontWeight: '400',
          fontSize: '12px',
          marginTop: '4px',
        }}
      >
        {myString} FLOW
      </Typography>
    );
  };

  const gradientStyle: React.CSSProperties = {
    background: 'linear-gradient(92deg, #00EF8B 63.42%, #627EEA 91.99%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline',
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: 600,
    letterSpacing: '0.1px',
  };

  const goEnable = async () => {
    props.toggleDrawer();
    history.push('/dashboard/enable');
  };

  const checkEvmMode = useCallback(async () => {
    const activeChild = await usewallet.getActiveWallet();
    if (activeChild === 'evm') {
      setIsEvm(true);
    } else {
      setIsEvm(false);
    }
    setEvmMode(true);
  }, [usewallet]);

  const getEvmAddress = useCallback(async () => {
    if (isValidEthereumAddress(props.evmWallet.address)) {
      const result = await usewallet.getBalance(props.evmWallet.address);
      const readBalance = parseFloat(result) / 1e18;
      setEvmBalance(readBalance);
    }
  }, [props.evmWallet, usewallet]);

  const hasChildAccounts = props.childAccounts && Object.keys(props.childAccounts).length > 0;

  useEffect(() => {
    checkEvmMode();
  }, [checkEvmMode]);

  useEffect(() => {
    getEvmAddress();
  }, [getEvmAddress, props.evmWallet]);

  return (
    <Drawer
      open={props.drawer}
      onClose={props.toggleDrawer}
      className={classes.menuDrawer}
      classes={{ paper: classes.paper }}
      PaperProps={{ sx: { width: '75%' } }}
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
              <img
                src={props?.userInfo?.avatar}
                width={48}
                height={48}
                style={{ backgroundColor: '#797979', borderRadius: 48 / 2 }}
              />

              <Box sx={{ paddingTop: '4px', px: '2px' }}>
                <IconButton edge="end" aria-label="close" onClick={props.togglePop}>
                  <img style={{ display: 'inline-block', width: '24px' }} src={sideMore} />
                </IconButton>
              </Box>
            </ListItemIcon>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <ListItemText
                sx={{ fontSize: '14px', fontWeight: '700' }}
                primary={
                  (!props.mainAddressLoading && props?.userInfo?.nickname) || (
                    <Skeleton variant="text" width={100} />
                  )
                }
              />
            </Box>
          </Box>
        </ListItem>
        {evmMode && !props.evmLoading && !isValidEthereumAddress(props.evmWallet.address) && (
          <ListItem sx={{ display: 'flex', justifyCOntent: 'space-between', padding: '16px' }}>
            <ListItemButton
              sx={{
                borderRadius: '12px',
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(0, 0, 0, 0.30)',
                padding: '16px',
                cursor: 'pointer',
                ':hover': {
                  opacity: 0.8,
                },
              }}
              onClick={goEnable}
            >
              <Box>
                <Typography
                  sx={{
                    color: ' #FFF',
                    fontSize: '12px',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    letterSpacing: '0.1px',
                  }}
                >
                  {chrome.i18n.getMessage('path_to_enable')}{' '}
                  <Typography style={gradientStyle}>
                    {chrome.i18n.getMessage('EVM_on_flow')}
                  </Typography>{' '}
                  !
                </Typography>
                <Typography
                  sx={{
                    color: ' rgba(255, 255, 255, 0.80)',
                    fontSize: '10px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    letterSpacing: '0.1px',
                  }}
                >
                  {chrome.i18n.getMessage('manage_multi_assets_seamlessly')}
                </Typography>
              </Box>
              <CardMedia
                sx={{ width: '20px', height: '20px', display: 'block', marginLeft: '6px' }}
                image={rightarrow}
              />
            </ListItemButton>
          </ListItem>
        )}
        <Box sx={{ px: '16px' }}>
          <Divider sx={{ my: '10px', mx: '0px' }} variant="middle" color="#4C4C4C" />
        </Box>
        <Box sx={{ overflowY: 'scroll' }}>
          {props.walletList.length > 0 &&
            props.walletList
              .slice()
              .sort((a, b) =>
                a.address === props.current.address
                  ? -1
                  : b.address === props.current.address
                    ? 1
                    : 0
              )
              .map(props.createWalletList)}
          {(isValidEthereumAddress(props.evmWallet.address) || hasChildAccounts) && (
            <Typography
              sx={{ color: '#FFFFFF66', fontSize: '12px', marginTop: '10px', marginLeft: '16px' }}
            >
              {chrome.i18n.getMessage('Linked_Account')}
            </Typography>
          )}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: '16px',
            }}
          >
            {isValidEthereumAddress(props.evmWallet.address) && (
              <ListItem
                sx={{
                  display: 'flex',
                  justifyCOntent: 'space-between',
                  padding: '16px 0 0',
                  cursor: 'pointer',
                }}
                onClick={() =>
                  props.setWallets(
                    {
                      name: 'evm',
                      address: props.evmWallet.address,
                      chain_id: props.currentNetwork,
                      coins: ['flow'],
                      id: 1,
                    },
                    'evm'
                  )
                }
              >
                <ListItemButton
                  sx={{
                    mb: 0,
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'space-between',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      height: '32px',
                      width: '32px',
                      borderRadius: '32px',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: props.evmWallet.color,
                      marginRight: '12px',
                    }}
                  >
                    <Typography sx={{ fontSize: '20px', fontWeight: '600' }}>
                      {props.evmWallet.icon}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="body1"
                      component="span"
                      fontWeight={'semi-bold'}
                      display="flex"
                      color={isEvm ? 'text.title' : 'text.nonselect'}
                    >
                      <Typography variant="body1" component="span" color="#FFF" fontSize={'12px'}>
                        {props.evmWallet.name}
                      </Typography>

                      <Typography
                        variant="body1"
                        component="span"
                        color="#FFF"
                        fontSize={'9px'}
                        sx={{
                          backgroundColor: '#627EEA',
                          padding: '0 8px',
                          borderRadius: '18px',
                          textAlign: 'center',
                          marginLeft: '8px',
                          lineHeight: '19px',
                        }}
                      >
                        EVM
                      </Typography>
                      {isEvm && (
                        <ListItemIcon style={{ display: 'flex', alignItems: 'center' }}>
                          <FiberManualRecordIcon
                            style={{
                              fontSize: '10px',
                              color: '#40C900',
                              marginLeft: '8px',
                            }}
                          />
                        </ListItemIcon>
                      )}
                    </Typography>
                    <EvmADDComponent myString={evmBalance} />
                  </Box>
                </ListItemButton>
              </ListItem>
            )}

            {props.childAccounts &&
              Object.keys(props.childAccounts).map((key, index) => (
                <ListItem
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 16px 8px',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08) !important',
                    },
                  }}
                  key={index}
                  onClick={() =>
                    props.setWallets(
                      {
                        name: props.childAccounts[key]?.name ?? key,
                        address: key,
                        chain_id: props.currentNetwork,
                        coins: ['flow'],
                        id: 1,
                      },
                      key
                    )
                  }
                >
                  <ListItemButton
                    sx={{
                      mb: 0,
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      background: 'none !important',
                    }}
                    className={props.current['address'] === key ? classes.active : ''}
                  >
                    <CardMedia
                      component="img"
                      image={
                        props.childAccounts[key]?.thumbnail?.url ??
                        'https://lilico.app/placeholder-2.0.png'
                      }
                      sx={{
                        height: '32px',
                        width: '32px',
                        marginRight: '12px',
                        backgroundColor: '#282828',
                        borderRadius: '24px',
                        objectFit: 'cover',
                      }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        variant="body1"
                        component="span"
                        fontWeight={'semi-bold'}
                        display="flex"
                        color={props.current['address'] === key ? 'text.title' : 'text.nonselect'}
                      >
                        <Typography
                          variant="body1"
                          component="span"
                          color="#E6E6E6"
                          fontSize={'12px'}
                        >
                          {props.childAccounts[key]?.name ?? key}
                        </Typography>
                        {props.current['address'] === key && (
                          <ListItemIcon sx={{ display: 'flex', alignItems: 'center' }}>
                            <FiberManualRecordIcon
                              sx={{
                                fontSize: '10px',
                                color: '#40C900',
                                marginLeft: '8px',
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
                        sx={{ fontSize: '12px', textTransform: 'lowercase' }}
                      >
                        {key}
                      </Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
          </Box>
        </Box>
        {/* <ListItem disablePadding>
          <ListItemButton onClick={() => {
            toggleDrawer();
            toggleUnread();
            goToInbox();
          }}>
            <ListItemIcon>
              <InboxIcon style={{
                marginLeft: '4px',
              }} />
            </ListItemIcon>
            <ListItemText primary={domain ? chrome.i18n.getMessage('Inbox') : chrome.i18n.getMessage('Enable__Inbox')} />
            {unread ?
              <Box
                sx={{
                  width: '32px',
                  color: '#fff',
                  textAlign: 'center',
                  background: '#41CC5D',
                  borderRadius: '12px',
                }}
              >
                {unread}
              </Box>
              :
              <Box></Box>
            }
          </ListItemButton>
        </ListItem> */}
        {/* <ListItem disablePadding>
          <ListItemButton onClick={() => setAlertOpen(true)}>
            <ListItemIcon
              sx={{
                width: '24px',
                minWidth: '24px',
                marginRight: '12px',
              }}
            >
              <AddIcon style={{
                marginLeft: '4px',
              }} />
            </ListItemIcon>
            <ListItemText primary={chrome.i18n.getMessage('Import__Wallet')} />
          </ListItemButton>
        </ListItem> */}
        {/* <ListItem disablePadding>
          <ListItemButton component="a" href="/">
            <ListItemIcon>
              <LoginIcon />
            </ListItemIcon>
            <ListItemText primary="Import wallet" />
          </ListItemButton>
        </ListItem> */}
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
          {props.modeOn && (
            <NetworkList networkColor={props.networkColor} currentNetwork={props.currentNetwork} />
          )}
          <ListItem
            disablePadding
            onClick={async () => {
              await usewallet.lockAdd();
              // history.push('/add');
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
              usewallet.lockWallet().then(() => {
                clearProfileData();
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
