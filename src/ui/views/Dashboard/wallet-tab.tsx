import { Tab, Tabs, Typography } from '@mui/material';
import { Box } from '@mui/system';
import React, { useState } from 'react';
import { useLocation } from 'react-router';

import CoinsIcon from '@/ui/components/CoinsIcon';
import { IconActivity, IconNfts } from '@/ui/components/iconfont';
import { useChildAccountFt } from '@/ui/hooks/use-coin-hooks';
import { useProfiles } from '@/ui/hooks/useProfileHook';

import CoinList from '../CoinList';
import NFTTab from '../NFT';
import NftEvm from '../NftEvm';
import TransferList from '../TransferList';

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
  const location = useLocation();
  // This should be set to 2 if the activity tab is selected and should only be set once
  const [currentTab, setCurrentTab] = useState(location.search.includes('activity') ? 2 : 0);

  const { currentWallet, parentWallet, activeAccountType } = useProfiles();

  const isMainOrEvmActive = activeAccountType === 'main' || activeAccountType === 'evm';

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

  return (
    <Box
      test-id="wallet-tab"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'black',
        width: '100%',
        minHeight: '100%',
      }}
    >
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
          <CoinList
            ableFt={childAccountAccessible ?? []}
            isActive={isMainOrEvmActive}
            activeAccountType={activeAccountType}
          />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          {activeAccountType === 'evm' ? <NftEvm /> : <NFTTab />}
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <TransferList />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default WalletTab;
