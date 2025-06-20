import { MenuItem, Select, Typography, Tooltip, Button, Box } from '@mui/material';
import { styled, StyledEngineProvider } from '@mui/material/styles';
import QRCodeStyling from 'qr-code-styling';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { withPrefix } from '@/shared/utils/address';
import alertMark from '@/ui/assets/svg/alertMark.svg';
import IconCopy from '@/ui/components/iconfont/IconCopy';
import { NetworkIndicator } from '@/ui/components/NetworkIndicator';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { LLHeader } from 'ui/components';
import { useWallet } from 'ui/utils';

import TestnetWarning from './TestnetWarning';

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
  const usewallet = useWallet();
  const ref = useRef<HTMLDivElement>(null);
  const { currentWalletList, currentWallet, activeAccountType } = useProfiles();
  const { network, emulatorModeOn } = useNetwork();
  const [localWalletIndex, setLocalWalletIndex] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchStuff = useCallback(async () => {
    await usewallet.setDashIndex(0);
  }, [usewallet]);

  useEffect(() => {
    if (currentWalletList?.[localWalletIndex]?.address && qrCode) {
      qrCode.update({
        data: currentWalletList[localWalletIndex].address,
      });
    }
  }, [currentWalletList, localWalletIndex]);

  useEffect(() => {
    if (!isInitialized && currentWalletList?.length && currentWallet?.address) {
      const defaultIndex = currentWalletList.findIndex(
        (wallet) => wallet.address === currentWallet.address
      );
      setLocalWalletIndex(defaultIndex >= 0 ? defaultIndex : 0);
      setIsInitialized(true);
    }
  }, [currentWalletList, currentWallet?.address, isInitialized]);

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
      <Box
        className="page"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
        }}
      >
        <NetworkIndicator network={network} emulatorMode={emulatorModeOn} />
        <LLHeader title={chrome.i18n.getMessage('')} help={false} />
        <Box sx={{ padding: '0 18px', width: '100%' }}>
          {currentWalletList && (
            <SelectContainer>
              <Select
                sx={{
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: '#282828',
                  color: 'white',
                  width: '100%',
                  '&.MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                }}
                value={localWalletIndex}
                onChange={(e) => setLocalWalletIndex(Number(e.target.value))}
                displayEmpty
                inputProps={{ 'aria-label': 'Without label' }}
              >
                {currentWalletList.map((ele, index) => (
                  <MenuItem key={ele.id} value={index}>
                    {ele.name} <InlineAddress>({ele.address})</InlineAddress>
                  </MenuItem>
                ))}
              </Select>
              <CopyIconWrapper>
                <Tooltip title={chrome.i18n.getMessage('Copy__Address')} arrow>
                  <Button
                    onClick={() => {
                      const address = currentWalletList?.[localWalletIndex]?.address;
                      if (address) {
                        navigator.clipboard.writeText(address);
                      }
                    }}
                    sx={{ maxWidth: '30px', minWidth: '30px' }}
                  >
                    <IconCopy fill="icon.navi" width="16px" />
                  </Button>
                </Tooltip>
              </CopyIconWrapper>
            </SelectContainer>
          )}
          {currentWalletList && (
            <QRContainer style={{ height: network === 'testnet' ? 350 : 330 }}>
              <QRWrapper>
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
              {network === 'testnet' ? (
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
          {activeAccountType === 'evm' && (
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
        </Box>
      </Box>
    </StyledEngineProvider>
  );
};

export default Deposit;
