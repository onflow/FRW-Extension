import { Typography, Button, Skeleton, Drawer, Tabs, Tab } from '@mui/material';
import { Box } from '@mui/system';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

import eventBus from '@/eventBus';
import { type ActiveAccountType } from '@/shared/types/wallet-types';
import { consoleError } from '@/shared/utils/console-log';
import { ButtonRow } from '@/ui/components/ButtonRow';
import CoinsIcon from '@/ui/components/CoinsIcon';
import { IconActivity, IconNfts } from '@/ui/components/iconfont';
import LLComingSoon from '@/ui/components/LLComingSoonWarning';
import { useCurrency } from '@/ui/hooks/preference-hooks';
import { useChildAccountFt } from '@/ui/hooks/use-coin-hooks';
import { useCoins } from '@/ui/hooks/useCoinHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useWallet } from '@/ui/utils';

import { withPrefix } from '../../../shared/utils/address';
import { CurrencyValue } from '../../components/TokenLists/CurrencyValue';
import MoveBoard from '../MoveBoard';
import NFTTab from '../NFT';
import NftEvm from '../NftEvm';

import CoinList from './Coinlist';
import OnRampList from './OnRampList';
import TransferList from './TransferList';

const TabPanel = ({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      style={{ height: '100%', display: value === index ? 'block' : 'none' }}
    >
      {children}
    </div>
  );
};
const WalletTab = ({ network }) => {
  const wallet = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const currency = useCurrency();
  const { balance, coinsLoaded } = useCoins();

  const {
    currentWallet,
    parentWallet,
    activeAccountType,
    noAddress,
    registerStatus,
    canMoveToOtherAccount,
  } = useProfiles();

  // This should be set to 2 if the activity tab is selected and should only be set once
  const [currentTab, setCurrentTab] = useState(location.search.includes('activity') ? 2 : 0);

  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [showOnRamp, setShowOnRamp] = useState(false);
  const [showMoveBoard, setShowMoveBoard] = useState(false);

  const isMainOrEvmActive = activeAccountType === 'main' || activeAccountType === 'evm';
  const swapLink =
    activeAccountType === 'evm'
      ? network === 'mainnet'
        ? 'https://swap.kittypunch.xyz/swap'
        : 'https://swap.kittypunch.xyz/swap'
      : network === 'mainnet'
        ? 'https://app.increment.fi/swap'
        : 'https://demo.increment.fi/swap';

  // Note that if any of the arguments are undefined, the hook will return undefined
  // So can safely pass undefined for the childAccount argument if the activeAccountType is not 'child'
  const childAccountAccessible = useChildAccountFt(
    network,
    parentWallet?.address,
    activeAccountType === 'child' ? currentWallet?.address : undefined
  );

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const goMoveBoard = () => {
    setShowMoveBoard(true);
  };

  const handleAddAddress = () => {
    wallet.createNewAccount(network);
  };

  useEffect(() => {
    // Add event listener for opening onramp
    const onRampHandler = () => setShowOnRamp(true);
    eventBus.addEventListener('openOnRamp', onRampHandler);

    // Clean up listener
    return () => {
      eventBus.removeEventListener('openOnRamp', onRampHandler);
    };
  }, []);

  return (
    <Box
      test-id="wallet-tab"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'black',
        width: '100%',
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          // Fix the height to prevent small pixel scrolling issue
          height: '151px',
          backgroundColor: 'background.default',
        }}
      >
        <Typography
          variant="body1"
          sx={{
            py: '8px',
            alignSelf: 'center',
            fontSize: '32px',
            fontWeight: 'semi-bold',
          }}
        >
          {noAddress ? (
            registerStatus ? (
              <Typography
                variant="body1"
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#777E90',
                  height: '51px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {chrome.i18n.getMessage('Address_creation_in_progress')}
              </Typography>
            ) : (
              <Button variant="contained" onClick={handleAddAddress}>
                {chrome.i18n.getMessage('Add_address')}
              </Button>
            )
          ) : coinsLoaded ? (
            <CurrencyValue
              value={balance}
              currencyCode={currency?.code ?? ''}
              currencySymbol={currency?.symbol ?? ''}
            />
          ) : (
            <Skeleton variant="text" width={100} />
          )}
        </Typography>

        <ButtonRow
          onSendClick={() => navigate('/dashboard/token/flow/send')}
          onReceiveClick={() => navigate('/dashboard/wallet/deposit')}
          onSwapClick={() => window.open(swapLink, '_blank', 'noopener,noreferrer')}
          onBuyClick={() => setShowOnRamp(true)}
          onMoveClick={() => goMoveBoard()}
          canMoveChild={canMoveToOtherAccount ?? false}
        />
      </Box>
      <Tabs
        value={currentTab}
        sx={{
          width: '100%',
          position: 'sticky',
          top: '0',
          zIndex: 1100,
          backgroundColor: 'black',
          '& .MuiTab-root': {
            minHeight: '48px',
            color: '#777E90',
            opacity: 1,
            position: 'relative',
            gap: '8px',
            '&.Mui-selected': {
              color: '#FFFFFF',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '2px',
                backgroundColor: '#FFFFFF',
              },
            },
          },
        }}
        onChange={handleChangeTab}
        TabIndicatorProps={{
          style: {
            display: 'none',
          },
        }}
        variant="fullWidth"
        aria-label="full width tabs example"
      >
        <Tab
          icon={
            <CoinsIcon
              width="20px"
              height="20px"
              color={currentTab === 0 ? '#FFFFFF' : '#777E90'}
            />
          }
          iconPosition="start"
          label={
            <Typography
              variant="body1"
              sx={{
                textTransform: 'capitalize',
                fontSize: '14px',
                fontWeight: 500,
                color: currentTab === 0 ? '#FFFFFF' : '#777E90',
              }}
            >
              {chrome.i18n.getMessage('coins')}
            </Typography>
          }
        />
        <Tab
          icon={
            <IconNfts
              sx={{
                width: '20px',
                height: '20px',
              }}
              color={currentTab === 1 ? '#FFFFFF' : '#777E90'}
            />
          }
          iconPosition="start"
          label={
            <Typography
              variant="body1"
              sx={{
                textTransform: 'capitalize',
                fontSize: '14px',
                fontWeight: 500,
                color: currentTab === 1 ? '#FFFFFF' : '#777E90',
              }}
            >
              {chrome.i18n.getMessage('NFTs')}
            </Typography>
          }
        />
        <Tab
          icon={
            <IconActivity
              sx={{
                width: '20px',
                height: '20px',
              }}
              color={currentTab === 2 ? '#FFFFFF' : '#777E90'}
            />
          }
          iconPosition="start"
          label={
            <Typography
              variant="body1"
              sx={{
                textTransform: 'capitalize',
                fontSize: '14px',
                fontWeight: 500,
                color: currentTab === 2 ? '#FFFFFF' : '#777E90',
              }}
            >
              {chrome.i18n.getMessage('Activity')}
            </Typography>
          }
        />
      </Tabs>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {currentTab === 0 && (
              <CoinList
                ableFt={childAccountAccessible ?? []}
                isActive={isMainOrEvmActive}
                activeAccountType={activeAccountType}
              />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {currentTab === 1 && (activeAccountType === 'evm' ? <NftEvm /> : <NFTTab />)}
          </Box>
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            {currentTab === 2 && <TransferList />}
          </Box>
        </TabPanel>
      </Box>
      <LLComingSoon alertOpen={alertOpen} handleCloseIconClicked={() => setAlertOpen(false)} />

      <Drawer
        anchor="bottom"
        open={showOnRamp}
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
        <OnRampList close={() => setShowOnRamp(false)} />
      </Drawer>
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
    </Box>
  );
};

export default WalletTab;
