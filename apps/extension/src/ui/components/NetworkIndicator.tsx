import { useTheme } from '@mui/material/styles';
import React from 'react';

export const NetworkIndicator = ({
  network,
  emulatorMode,
}: {
  network: string;
  emulatorMode: boolean;
}) => {
  const theme = useTheme();
  if (network !== 'testnet' && !emulatorMode) {
    // Don't show anything
    return null;
  }

  const networkName = emulatorMode
    ? network === 'testnet'
      ? chrome.i18n.getMessage('Emulate_Testnet')
      : chrome.i18n.getMessage('Emulate_Mainnet')
    : network === 'testnet'
      ? chrome.i18n.getMessage('Testnet')
      : chrome.i18n.getMessage('Mainnet');

  const foregroundColor = emulatorMode
    ? theme.palette.orange.emulator
    : theme.palette.orange.warning;
  const backgroundColor = emulatorMode
    ? theme.palette.orange.emulatorAlpha
    : theme.palette.orange.testnetAlpha;

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 282,
          height: 26,
          borderRadius: '0 0 26px 26px',
          background: backgroundColor,
          color: foregroundColor,
          fontFamily: 'Inter,sans-serif',
        }}
      >
        {(network === 'testnet' || emulatorMode) && networkName}
      </div>
    </div>
  );
};
