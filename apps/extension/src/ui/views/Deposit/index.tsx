import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import QRCodeStyling from 'qr-code-styling';
import React, { useEffect, useRef } from 'react';

import { LLHeader } from '@/ui/components';
import { NetworkIndicator } from '@/ui/components/NetworkIndicator';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';

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
  const ref = useRef<HTMLDivElement>(null);
  const { currentWallet, activeAccountType } = useProfiles();
  const { emulatorModeOn, network } = useNetwork();

  useEffect(() => {
    if (currentWallet?.address && qrCode) {
      qrCode.update({
        data: currentWallet.address,
      });
    }
  }, [currentWallet?.address]);

  useEffect(() => {
    if (ref.current) {
      qrCode.append(ref.current);
    }
  });

  return (
    <Box sx={{ backgroundColor: 'black', paddingBottom: '16px', width: '100%', height: '100%' }}>
      <NetworkIndicator network={network} emulatorMode={emulatorModeOn} />
      <LLHeader title={chrome.i18n.getMessage('')} help={false} />

      <Box
        sx={{
          backgroundColor: '#121212',
          borderRadius: '16px',
          margin: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'start',
        }}
      >
        <Box
          sx={{
            width: '170px',
            height: '170px',
            background: '#333333',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div ref={ref} />
        </Box>
        <Typography
          variant="body1"
          sx={{
            marginTop: '16px',
            textAlign: 'center',
          }}
        >
          {chrome.i18n.getMessage('QR__Code')}
        </Typography>

        {network !== 'testnet' && (
          <Typography
            color="grey.600"
            sx={{
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            {chrome.i18n.getMessage('Shown__your__QR__code__to__receive__transactions')}
          </Typography>
        )}
      </Box>
      {(activeAccountType === 'evm' || network === 'testnet') && (
        <Alert
          severity="warning"
          sx={{
            margin: '16px 16px 0 16px',
            borderRadius: '16px',
            backgroundColor: '#222',
          }}
        >
          <AlertTitle>Warning</AlertTitle>
          {activeAccountType === 'evm' && chrome.i18n.getMessage('Deposit_warning_content')}
          {activeAccountType === 'evm' && network === 'testnet' && ' '}
          {network === 'testnet' &&
            chrome.i18n.getMessage('Make__sure__you__are__using__the__correct__network')}
        </Alert>
      )}
    </Box>
  );
};

export default Deposit;
