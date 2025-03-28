import { MenuItem, Select, Typography, Tooltip, Button, Box } from '@mui/material';
import { styled, StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import QRCodeStyling from 'qr-code-styling';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { withPrefix } from '@/shared/utils/address';
import alertMark from '@/ui/FRWAssets/svg/alertMark.svg';
import { NetworkIndicator } from '@/ui/FRWComponent/NetworkIndicator';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { LLHeader } from 'ui/FRWComponent';
import { useWallet } from 'ui/utils';

import IconCopy from '../../../components/iconfont/IconCopy';

import TestnetWarning from './TestnetWarning';

const useStyles = makeStyles((theme) => ({
  page: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  container: {
    padding: '0 18px',
    width: '100%',
  },
  addressDropdown: {
    height: '56px',
    borderRadius: '16px',
    backgroundColor: '#282828',
    color: 'white',
    width: '100%',
    '&.MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
  },
}));

const CopyIconWrapper = styled('div')(() => ({
  position: 'absolute',
  cursor: 'pointer',
  right: '30px',
  top: '13px',
}));

const SelectContainer = styled('div')(() => ({
  position: 'relative',
}));

const InlineAddress = styled('span')(() => ({
  color: 'grey',
}));

const QRContainer = styled('div')(() => ({
  backgroundColor: '#121212',
  borderRadius: '0 0 16px 16px',
  margin: '0 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'start',
  position: 'relative',
  paddingTop: '40px',
}));

const QRWrapper = styled('div')(() => ({
  width: '170px',
  height: '170px',
  background: '#333333',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

const qrCode = new QRCodeStyling({
  width: 160,
  height: 160,
  type: 'svg',
  dotsOptions: {
    color: '#E6E6E6',
    type: 'dots',
  },
  cornersSquareOptions: {
    type: 'extra-rounded',
  },
  cornersDotOptions: {
    type: 'dot',
    color: '#41CC5D',
  },
  backgroundOptions: {
    color: '#333333',
  },
  qrOptions: {
    errorCorrectionLevel: 'M',
  },
});

const Deposit = () => {
  const classes = useStyles();
  const usewallet = useWallet();
  const ref = useRef<HTMLDivElement>(null);
  const { childAccounts, currentWallet, currentWalletIndex } = useProfiles();

  const [userWallets, setUserWallets] = useState<any>(null);
  const [localWalletIndex, setLocalWalletIndex] = useState<number>(currentWalletIndex);
  const [currentNetwork, setNetwork] = useState<string>('mainnet');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [active, setIsActive] = useState<string>('');
  const [emulatorModeOn, setEmulatorModeOn] = useState<boolean>(false);

  const fetchStuff = useCallback(async () => {
    const isChild = await usewallet.getActiveWallet();
    if (isChild === 'evm') {
      setIsActive(isChild);
      const wallets = await usewallet.getEvmWallet();
      const result = [
        {
          id: 0,
          name: isChild,
          chain_id: currentNetwork,
          icon: 'placeholder',
          color: 'placeholder',
          blockchain: [wallets],
        },
      ];
      setUserWallets(
        result.map((ele, idx) => ({
          id: idx,
          name: chrome.i18n.getMessage('Wallet'),
          address: withPrefix(ele?.blockchain[0]?.address ?? ''),
        }))
      );
    } else if (isChild) {
      setIsActive(isChild);
      setUserWallets(
        Object.keys(childAccounts).map((key, index) => ({
          id: index,
          name: key,
          address: isChild,
        }))
      );
    } else {
      setUserWallets([
        {
          id: 0,
          name: currentWallet.name,
          address: currentWallet.address,
        },
      ]);
    }

    await usewallet.setDashIndex(0);
    const network = await usewallet.getNetwork();
    setNetwork(network);
    const emulatorMode = await usewallet.getEmulatorMode();
    setEmulatorModeOn(emulatorMode);
    const user = await usewallet.getUserInfo(false);
    setUserInfo(user);
  }, [currentNetwork, usewallet, childAccounts, currentWallet]);

  useEffect(() => {
    if (userWallets && userInfo) {
      qrCode.update({
        data: userWallets[localWalletIndex].address,
        // image: userInfo.avatar
      });
    }
  }, [userWallets, localWalletIndex, userInfo]);

  useEffect(() => {
    fetchStuff();
  }, [fetchStuff]);

  useEffect(() => {
    if (ref.current) {
      qrCode.append(ref.current);
    }
  });

  return (
    <StyledEngineProvider injectFirst>
      <div className={`${classes.page} page`}>
        <NetworkIndicator network={currentNetwork} emulatorMode={emulatorModeOn} />
        <LLHeader title={chrome.i18n.getMessage('')} help={false} />
        <div className={classes.container}>
          {userWallets && (
            <SelectContainer>
              <Select
                className={classes.addressDropdown}
                value={localWalletIndex}
                onChange={(e) => setLocalWalletIndex(e.target.value as number)}
                displayEmpty
                inputProps={{ 'aria-label': 'Without label' }}
              >
                {userWallets.map((ele) => (
                  <MenuItem key={ele.id} value={ele.id}>
                    {ele.name} <InlineAddress>({ele.address})</InlineAddress>
                  </MenuItem>
                ))}
              </Select>
              <CopyIconWrapper>
                <Tooltip title={chrome.i18n.getMessage('Copy__Address')} arrow>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(userWallets[localWalletIndex].address);
                    }}
                    sx={{ maxWidth: '30px', minWidth: '30px' }}
                  >
                    <IconCopy fill="icon.navi" width="16px" />
                  </Button>
                </Tooltip>
              </CopyIconWrapper>
            </SelectContainer>
          )}
          {userWallets && (
            <QRContainer style={{ height: currentNetwork === 'testnet' ? 350 : 330 }}>
              <QRWrapper>
                {/* <QRCode value={userWallets[localWalletIndex].address} size={150} /> */}
                <div ref={ref} />
              </QRWrapper>
              <Typography
                variant="body1"
                sx={{
                  marginTop: '20px',
                  textAlign: 'center',
                }}
              >
                {chrome.i18n.getMessage('QR__Code')}
              </Typography>
              {currentNetwork === 'testnet' ? (
                <TestnetWarning />
              ) : (
                <Typography
                  color="grey.600"
                  sx={{
                    marginTop: '30px',
                    textAlign: 'center',
                    fontSize: '14px',
                  }}
                >
                  {chrome.i18n.getMessage('Shown__your__QR__code__to__receive__transactions')}
                </Typography>
              )}
            </QRContainer>
          )}
          {active === 'evm' && (
            <Box
              sx={{
                marginY: '30px',
                padding: '16px',
                backgroundColor: '#222',
                borderRadius: '12px',
              }}
            >
              <Typography
                color="grey.600"
                sx={{
                  textAlign: 'left',
                  fontSize: '12px',
                  color: '#FFFFFFCC',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <img
                  src={alertMark}
                  alt="alert icon"
                  style={{
                    filter: 'brightness(0) invert(0.8)',
                    marginTop: '2px',
                  }}
                />
                {chrome.i18n.getMessage('Deposit_warning_content')}
              </Typography>
            </Box>
          )}
        </div>
      </div>
    </StyledEngineProvider>
  );
};

export default Deposit;
