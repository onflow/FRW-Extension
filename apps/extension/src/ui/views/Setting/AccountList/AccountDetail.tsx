import { Alert, Box, Divider, List, Snackbar, Typography } from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router';

import type { StorageInfo } from '@onflow/flow-wallet-shared/types/network-types';
import { type Emoji } from '@onflow/flow-wallet-shared/types/wallet-types';
import {
  isValidEthereumAddress,
  isValidFlowAddress,
} from '@onflow/flow-wallet-shared/utils/address';
import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import storage from '@/extension-shared/utils/storage';
import { EditIcon } from '@/ui/assets/icons/settings/Edit';
import { LLHeader } from '@/ui/components';
import { AccountCard } from '@/ui/components/account/account-card';
import SettingsListItem from '@/ui/components/settings/setting-list-item';
import SettingsSwitchCard from '@/ui/components/settings/settings-switch';
import { toggleAccountHidden, useAccountHidden } from '@/ui/hooks/preference-hooks';
import { useMainAccount } from '@/ui/hooks/use-account-hooks';
import { useFeatureFlag } from '@/ui/hooks/use-feature-flags';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { COLOR_WHITE_ALPHA_40_FFFFFF66, COLOR_WHITE_ALPHA_80_FFFFFFCC } from '@/ui/style/color';

import EditAccount from './EditAccount';

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

const AccountDetail = () => {
  const wallet = useWallet();
  const { network } = useNetwork();
  const params = useParams();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const parentAddress = urlParams.get('parentAddress') || null;
  const address = params.address || '';
  const userWallet = useMainAccount(network, parentAddress || address);
  const [showProfile, setShowProfile] = useState(false);
  const [gasKillSwitch, setGasKillSwitch] = useState(false);
  const [modeGas, setGasMode] = useState(false);
  const [showError, setShowError] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isKeyphrase, setIsKeyphrase] = useState(false);
  const [emoji, setEmoji] = useState<Emoji | null>(null);
  const isFreeGasFeeEnabled = useFeatureFlag('free_gas');

  // Use the new preference hook for hidden address status
  const isHidden = useAccountHidden(userWallet?.address || '');

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

  const toggleHiddenStatus = async () => {
    if (userWallet?.address) {
      await toggleAccountHidden(userWallet.address);
    }
  };

  const toggleEditProfile = async () => {
    setShowProfile(!showProfile);
  };

  const updateProfileEmoji = (emoji) => {
    setEmoji(emoji);
  };

  const loadStorageInfo = useCallback(async () => {
    if (address && isValidFlowAddress(address)) {
      const info = await wallet.openapi.getStorageInfo(address);
      setStorageInfo(info);
    }
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
      loadGasKillSwitch();
      loadGasMode();
      loadStorageInfo();
      checkKeyphrase();
    } catch (error) {
      consoleError(error);
    }
  }, [checkKeyphrase, loadGasKillSwitch, loadGasMode, loadStorageInfo]);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <LLHeader
        title={chrome.i18n.getMessage('Account')}
        help={false}
        goBackLink="/dashboard/setting/accountlist"
      />

      <Box
        px="20px"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexGrow: 1,
          color: COLOR_WHITE_ALPHA_80_FFFFFFCC,
        }}
      >
        <Box>
          <List
            sx={{
              borderRadius: '16px',
              padding: '0 2px',
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
            {!isValidEthereumAddress(address)
              ? userWallet && (
                  <AccountCard
                    account={userWallet}
                    network={network}
                    showCard={true}
                    onClick={toggleEditProfile}
                    secondaryIcon={<EditIcon width={24} height={24} />}
                    onClickSecondary={toggleEditProfile}
                  />
                )
              : userWallet?.evmAccount && (
                  <AccountCard
                    account={userWallet?.evmAccount}
                    network={network}
                    showCard={true}
                    onClick={toggleEditProfile}
                    secondaryIcon={<EditIcon width={24} height={24} />}
                    onClickSecondary={toggleEditProfile}
                  />
                )}
          </List>

          {address && !isValidEthereumAddress(address) && (
            <>
              <List
                sx={{
                  borderRadius: '16px',
                  padding: '0 2px',
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
                <SettingsListItem
                  text={chrome.i18n.getMessage('Private__Key')}
                  to="/dashboard/nested/privatekeypassword"
                />
                {isKeyphrase && <Divider sx={{ width: '90%' }} variant="middle" />}

                {isKeyphrase && (
                  <SettingsListItem
                    text={chrome.i18n.getMessage('Recovery__Phrase')}
                    to="/dashboard/nested/recoveryphrasepassword"
                  />
                )}
              </List>
              {address && (
                <Box>
                  <List
                    sx={{
                      borderRadius: '16px',
                      padding: '0 2px',
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
                    <SettingsListItem
                      text="Account Keys"
                      to={`/dashboard/nested/keylist?address=${address}`}
                    />
                  </List>
                </Box>
              )}
              <SettingsSwitchCard
                label={chrome.i18n.getMessage('Show__in__account__sidebar')}
                checked={!isHidden}
                onChange={() => {
                  toggleHiddenStatus();
                }}
              />
              <SettingsSwitchCard
                label="Free gas fee"
                checked={modeGas}
                onChange={() => {
                  switchGasMode();
                }}
                disabled={!gasKillSwitch}
              />
              <Box sx={{ padding: '4px 8px' }}>
                <Typography
                  variant="caption"
                  sx={{ fontSize: '12px', color: COLOR_WHITE_ALPHA_40_FFFFFF66 }}
                >
                  * Allow Flow Wallet to pay the gas fee for all my transactions
                </Typography>
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
      {showProfile && address && (
        <EditAccount
          showMoveBoard={showProfile}
          handleCloseIconClicked={() => setShowProfile(false)}
          handleCancelBtnClicked={() => setShowProfile(false)}
          handleAddBtnClicked={async () => {
            setShowProfile(false);
          }}
          updateProfileEmoji={(emoji) => updateProfileEmoji(emoji)}
          emoji={emoji}
          userWallet={userWallet}
          address={address}
        />
      )}
    </div>
  );
};

export default AccountDetail;
