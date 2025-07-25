import { Drawer } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { ButtonRow } from '@/ui/components';
import { BuildIndicator } from '@/ui/components/build-indicator';
import { NetworkIndicator } from '@/ui/components/NetworkIndicator';
import { OnRampList } from '@/ui/components/TokenLists/OnRampList';
import { useCurrency } from '@/ui/hooks/preference-hooks';
import { useCoins } from '@/ui/hooks/useCoinHook';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { getSwapLink } from '@/ui/utils/url-constants';

import { DashboardTotal } from './dashboard-total';
import WalletTab from './wallet-tab';
import MoveBoard from '../MoveBoard';

const Dashboard = () => {
  const { network, emulatorModeOn } = useNetwork();
  const { balance, coinsLoaded } = useCoins();
  const currency = useCurrency();
  const { noAddress, registerStatus, canMoveToOtherAccount, activeAccountType } = useProfiles();
  const navigate = useNavigate();
  const location = useLocation();
  // Use this to show the onramp drawer. Navigate to dashboard?onramp=true
  const [showOnRamp, setShowOnRamp] = useState(location.search.includes('onramp'));
  const [showMoveBoard, setShowMoveBoard] = useState(false);

  const swapLink = getSwapLink(network, activeAccountType);

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
      }}
    >
      <BuildIndicator />
      <NetworkIndicator network={network} emulatorMode={emulatorModeOn} />
      <div test-id="x-overflow" style={{ overflowX: 'hidden', height: '100%', width: '100%' }}>
        <DashboardTotal
          network={network}
          balance={coinsLoaded ? balance : undefined}
          currencyCode={coinsLoaded ? currency?.code : undefined}
          currencySymbol={coinsLoaded ? currency?.symbol : undefined}
          noAddress={noAddress}
          addressCreationInProgress={registerStatus}
        />
        {/* Button Row */}
        <ButtonRow
          onSendClick={() => navigate('/dashboard/token/flow/send')}
          onReceiveClick={() => navigate('/dashboard/wallet/deposit')}
          onSwapClick={() => window.open(swapLink, '_blank', 'noopener,noreferrer')}
          onBuyClick={() => setShowOnRamp(true)}
          onMoveClick={() => setShowMoveBoard(true)}
          canMoveChild={canMoveToOtherAccount}
        />
        {/* Wallet Tab */}
        <WalletTab network={network} />
        {/* OnRamp Drawer */}
        <Drawer
          anchor="bottom"
          open={showOnRamp}
          transitionDuration={300}
          slotProps={{
            paper: {
              sx: {
                width: '100%',
                height: '65%',
                bgcolor: 'background.default',
                borderRadius: '18px 18px 0px 0px',
              },
            },
          }}
        >
          <OnRampList close={() => setShowOnRamp(false)} />
        </Drawer>
        {/* Move Board */}
        {showMoveBoard && (
          <MoveBoard
            showMoveBoard={showMoveBoard}
            handleCloseIconClicked={() => setShowMoveBoard(false)}
            handleCancelBtnClicked={() => setShowMoveBoard(false)}
            handleAddBtnClicked={() => {
              setShowMoveBoard(false);
            }}
          />
        )}
      </div>
    </Box>
  );
};

export default Dashboard;
