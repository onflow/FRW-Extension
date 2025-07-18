import React from 'react';

export const NetworkIndicator = ({
  network,
  emulatorMode,
}: {
  network: string;
  emulatorMode: boolean;
}) => {
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

  const foregroundColor = emulatorMode ? '#ff3d00' : '#FF8A00';
  const backgroundColor = emulatorMode ? '#ff4c0029' : '#FF8A0029';

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
        {networkName}
      </div>
    </div>
  );
};
