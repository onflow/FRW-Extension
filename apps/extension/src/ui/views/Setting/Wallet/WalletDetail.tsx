import {
  Typography,
  Box,
  List,
  ListItemText,
  ListItemIcon,
  ListItem,
  ListItemButton,
  Divider,
  Alert,
  Snackbar,
  CardMedia,
  Switch,
} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router';

import { storage } from '@/background/webapi';
import type { StorageInfo } from '@/shared/types/network-types';
import {
  type Emoji,
  type MainAccountWithBalance,
  type WalletAccountWithBalance,
} from '@/shared/types/wallet-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import { consoleError } from '@/shared/utils/console-log';
import { LLHeader } from '@/ui/components';
import IconEnd from '@/ui/components/iconfont/IconAVector11Stroke';
import { useFeatureFlag } from '@/ui/hooks/use-feature-flags';
import { useWallet } from 'ui/utils';

import editEmoji from '../../../assets/svg/editEmoji.svg';

import EditProfile from './EditProfile';

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['', 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatStorageInfo(used: number | undefined, capacity: number | undefined) {
  return `${formatBytes((used || 0) * 10)} / ${formatBytes((capacity || 0) * 10)}`;
}

const WalletDetail = () => {
  const wallet = useWallet();
  const location = useLocation();
  const address = new URLSearchParams(location.search).get('address') || '';
  const [userWallet, setWallet] = useState<
    WalletAccountWithBalance | MainAccountWithBalance | null
  >(null);
  const [showProfile, setShowProfile] = useState(false);
  const [gasKillSwitch, setGasKillSwitch] = useState(false);
  const [modeGas, setGasMode] = useState(false);
  const [showError, setShowError] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isKeyphrase, setIsKeyphrase] = useState(false);
  const [emoji, setEmoji] = useState<Emoji | null>(null);
  const isFreeGasFeeEnabled = useFeatureFlag('free_gas');
  const handleErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowError(false);
  };

  const loadGasMode = useCallback(async () => {
    const isFreeGasFeeEnabled = await storage.get('lilicoPayer');
    if (isFreeGasFeeEnabled) {
      setGasMode(isFreeGasFeeEnabled);
    }
  }, []);

  const loadGasKillSwitch = useCallback(async () => {
    await wallet.getPayerAddressAndKeyId();
    if (isFreeGasFeeEnabled) {
      setGasKillSwitch(isFreeGasFeeEnabled);
    }
  }, [isFreeGasFeeEnabled, wallet]);

  const switchGasMode = async () => {
    setGasMode(!modeGas);
    storage.set('lilicoPayer', !modeGas);
    setShowError(true);
  };

  const toggleEditProfile = async () => {
    setShowProfile(!showProfile);
  };

  const updateProfileEmoji = (emoji) => {
    setEmoji(emoji);
  };

  const setUserWallet = useCallback(async () => {
    await wallet.setDashIndex(3);
    const walletDetail: {
      wallet: WalletAccountWithBalance;
      selectedEmoji: Emoji;
    } = JSON.parse(await storage.get('walletDetail'));
    if (walletDetail) {
      setWallet(walletDetail.wallet);
      const selectingEmoji: Emoji = {
        name: walletDetail.wallet.name,
        emoji: walletDetail.wallet.icon,
        bgcolor: walletDetail.wallet.color,
      };
      setEmoji(selectingEmoji);
    }
  }, [wallet]);

  const loadStorageInfo = useCallback(async () => {
    const info = await wallet.openapi.getStorageInfo(address!);
    setStorageInfo(info);
  }, [wallet, address]);

  function storageCapacity(storage): number {
    const used = storage?.used ?? 1;
    const capacity = storage?.capacity ?? 1;
    return (used / capacity) * 100;
  }

  const checkKeyphrase = useCallback(async () => {
    const keyrings = await wallet.checkMnemonics();
    await setIsKeyphrase(keyrings);
  }, [wallet]);

  useEffect(() => {
    try {
      setUserWallet();
      loadGasKillSwitch();
      loadGasMode();
      loadStorageInfo();
      checkKeyphrase();
    } catch (error) {
      consoleError(error);
    }
  }, [checkKeyphrase, loadGasKillSwitch, loadGasMode, loadStorageInfo, setUserWallet]);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <LLHeader title={chrome.i18n.getMessage('Account')} help={false} />

      <Box
        px="20px"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexGrow: 1,
        }}
      >
        <Box>
          <List
            sx={{
              borderRadius: '16px',
              padding: '0 10px',
              overflow: 'hidden',
              backgroundColor: '#282828',
              '&:hover': {
                backgroundColor: '#282828',
              },
              margin: '8px auto 8px auto',
              pt: 0,
              pb: 0,
            }}
          >
            <ListItem
              disablePadding
              sx={{
                height: '66px',
                width: '100%',
                '&:hover': {
                  backgroundColor: '#282828',
                },
              }}
              onClick={() => toggleEditProfile()}
            >
              <ListItemButton
                sx={{
                  width: '90%',
                  height: '100%',
                  margin: '0 auto',
                  '&:hover': {
                    backgroundColor: '#282828',
                  },
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
                    backgroundColor: emoji?.bgcolor,
                    marginRight: '12px',
                  }}
                >
                  <Typography sx={{ fontSize: '20px', fontWeight: '600' }}>
                    {emoji?.emoji}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: '##FFFFFF',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginRight: '4px',
                  }}
                >
                  {emoji?.name}
                </Typography>
                <Box sx={{ flex: '1' }}></Box>
                <ListItemIcon aria-label="end" sx={{ minWidth: '20px' }}>
                  <CardMedia
                    component="img"
                    sx={{ width: '20px', height: '20px' }}
                    image={editEmoji}
                  />
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
          </List>
          {userWallet && !isValidEthereumAddress(userWallet.address) && (
            <>
              <List
                sx={{
                  borderRadius: '16px',
                  padding: '0 10px',
                  overflow: 'hidden',
                  backgroundColor: '#282828',
                  '&:hover': {
                    backgroundColor: '#282828',
                  },
                  margin: '8px auto 8px auto',
                  pt: 0,
                  pb: 0,
                }}
              >
                <ListItem
                  component={Link}
                  to="/dashboard/nested/privatekeypassword"
                  disablePadding
                  sx={{
                    height: '66px',
                    width: '100%',
                    '&:hover': {
                      backgroundColor: '#282828',
                    },
                  }}
                >
                  <ListItemButton
                    sx={{
                      width: '90%',
                      height: '100%',
                      margin: '0 auto',
                      '&:hover': {
                        backgroundColor: '#282828',
                      },
                    }}
                  >
                    <ListItemText primary={chrome.i18n.getMessage('Private__Key')} />
                    <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                      <IconEnd size={12} />
                    </ListItemIcon>
                  </ListItemButton>
                </ListItem>
                {isKeyphrase && <Divider sx={{ width: '90%' }} variant="middle" />}

                {isKeyphrase && (
                  <ListItem
                    component={Link}
                    to="/dashboard/nested/recoveryphrasepassword"
                    disablePadding
                    sx={{
                      height: '66px',
                      width: '100%',
                      '&:hover': {
                        backgroundColor: '#282828',
                      },
                    }}
                  >
                    <ListItemButton
                      sx={{
                        width: '90%',
                        height: '100%',
                        margin: '0 auto',
                        '&:hover': {
                          backgroundColor: '#282828',
                        },
                      }}
                    >
                      <ListItemText primary={chrome.i18n.getMessage('Recovery__Phrase')} />
                      <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                        <IconEnd size={12} />
                      </ListItemIcon>
                    </ListItemButton>
                  </ListItem>
                )}
              </List>

              <Box>
                <List
                  sx={{
                    borderRadius: '16px',
                    padding: '0 10px',
                    overflow: 'hidden',
                    backgroundColor: '#282828',
                    '&:hover': {
                      backgroundColor: '#282828',
                    },
                    margin: '8px auto 8px auto',
                    pt: 0,
                    pb: 0,
                  }}
                >
                  <ListItem
                    component={Link}
                    to={`/dashboard/nested/keylist?address=${address}`}
                    disablePadding
                    sx={{
                      height: '66px',
                      width: '100%',
                      '&:hover': {
                        backgroundColor: '#282828',
                      },
                    }}
                  >
                    <ListItemButton
                      sx={{
                        width: '90%',
                        height: '100%',
                        margin: '0 auto',
                        '&:hover': {
                          backgroundColor: '#282828',
                        },
                      }}
                    >
                      <ListItemText primary={'Account Keys'} />
                      <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
                        <IconEnd size={12} />
                      </ListItemIcon>
                    </ListItemButton>
                  </ListItem>
                </List>
              </Box>

              <Box
                sx={{
                  margin: '10px auto',
                  backgroundColor: '#282828',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'row',
                  borderRadius: '16px',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body1" color="neutral.contrastText" style={{ weight: 600 }}>
                    {chrome.i18n.getMessage('Free__Gas__Fee')}
                  </Typography>
                  <Typography
                    variant="body1"
                    color={gasKillSwitch ? 'text.secondary' : 'error.main'}
                    sx={{ weight: 400, fontSize: '12px' }}
                  >
                    {gasKillSwitch
                      ? chrome.i18n.getMessage('Allow__lilico__to__pay__the__gas__fee')
                      : chrome.i18n.getMessage('This__feature__has__been__disabled__temporarily')}
                  </Typography>
                </Box>
                <Switch
                  disabled={!gasKillSwitch}
                  checked={modeGas}
                  onChange={() => {
                    switchGasMode();
                  }}
                />
              </Box>
              {!!storageInfo /* TODO: remove this after the storage usage card is implemented */ && (
                <Box
                  sx={{
                    margin: '10px auto',
                    backgroundColor: '#282828',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'row',
                    borderRadius: '16px',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Typography
                      variant="body1"
                      color="neutral.contrastText"
                      style={{ weight: 600 }}
                    >
                      {chrome.i18n.getMessage('Storage')}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography
                        variant="body1"
                        color={gasKillSwitch ? 'text.secondary' : 'error.main'}
                        sx={{ weight: 400, fontSize: '12px' }}
                      >
                        {`${storageCapacity(storageInfo).toFixed(2)}%`}
                      </Typography>
                      <Typography
                        variant="body1"
                        color={gasKillSwitch ? 'text.secondary' : 'error.main'}
                        sx={{ weight: 400, fontSize: '12px' }}
                      >
                        {`${formatStorageInfo(storageInfo?.used, storageInfo?.capacity)}`}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={storageCapacity(storageInfo)}
                      sx={{ height: '8px', borderRadius: '4px' }}
                    ></LinearProgress>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      <Snackbar open={showError} autoHideDuration={6000} onClose={handleErrorClose}>
        <Alert
          onClose={handleErrorClose}
          variant="filled"
          severity="warning"
          sx={{ width: '100%' }}
        >
          {chrome.i18n.getMessage('You__will__need__to__connect__to__your__wallet__again')}
        </Alert>
      </Snackbar>
      {showProfile && (
        <EditProfile
          showMoveBoard={showProfile}
          handleCloseIconClicked={() => setShowProfile(false)}
          handleCancelBtnClicked={() => setShowProfile(false)}
          handleAddBtnClicked={() => {
            setShowProfile(false);
          }}
          updateProfileEmoji={(emoji) => updateProfileEmoji(emoji)}
          emoji={emoji}
          userWallet={userWallet}
        />
      )}
    </div>
  );
};

export default WalletDetail;
