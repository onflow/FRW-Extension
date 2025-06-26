import { Box, Tabs, Tab, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { type PublicKeyAccount } from '@/shared/types/wallet-types';
import { QrCodeIcon } from '@/ui/assets/icons/QrCodeIcon';
import ErrorModel from '@/ui/components/PopupModal/errorModel';
import {
  COLOR_GREEN_FLOW_DARKMODE_00EF8B,
  COLOR_GREEN_FLOW_DARKMODE_00EF8B_10pc,
} from '@/ui/style/color';
import { useWallet } from '@/ui/utils/WalletContext';
import Googledrive from '@/ui/views/Welcome/AccountImport/ImportComponents/Googledrive';
import JsonImport from '@/ui/views/Welcome/AccountImport/ImportComponents/JsonImport';
import KeyImport from '@/ui/views/Welcome/AccountImport/ImportComponents/KeyImport';
import SeedPhraseImport from '@/ui/views/Welcome/AccountImport/ImportComponents/SeedPhraseImport';

import MobileAppImportSteps from './ImportComponents/mobile-app-import-steps';
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

const ImportTabs = ({
  setMnemonic,
  setPk,
  setAccounts,

  goPassword,
  handleSwitchTab,
  setErrorMessage,
  setShowError,
  handleGoogleAccountsFound,
  path,
  setPath,
  phrase,
  setPhrase,
}: {
  setMnemonic: (mnemonic: string) => void;
  setPk: (pk: string) => void;
  setAccounts: (accounts: PublicKeyAccount[]) => void;
  goPassword: () => void;
  handleSwitchTab: () => void;
  setErrorMessage: (errorMessage: string) => void;
  setShowError: (showError: boolean) => void;
  handleGoogleAccountsFound: (accounts: string[]) => void;
  path: string;
  setPath: (path: string) => void;
  phrase: string;
  setPhrase: (phrase: string) => void;
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isSignLoading, setSignLoading] = useState(false);
  const [addressFound, setAddressFound] = useState(true);
  const [newKey, setKeyNew] = useState(true);
  const [isLogin, setIsLogin] = useState(false);
  const usewallet = useWallet();
  useEffect(() => {
    const checkIsBooted = async () => {
      const isBooted = await usewallet.isBooted();
      setIsLogin(isBooted);
    };
    checkIsBooted();
  }, [usewallet]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleImport = async (accounts: PublicKeyAccount[]) => {
    setAccounts(accounts);
    const result = await usewallet.openapi.checkImport(accounts[0].publicKey);
    if (result.status === 409) {
      // The account has been previously imported, so just retrieve the current user name
      goPassword();
    } else {
      // The key has never been imported before, we need to set a username and confirm / create a password
      if (!accounts[0].address) {
        handleNotFoundPopup();
        return;
      }
      handleSwitchTab();
    }
  };

  const handleNotFoundPopup = async () => {
    setAddressFound(!addressFound);
  };

  const sxStyles = {
    fontFamily: 'Inter',
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 600,
    padding: '0px 16px',
    lineHeight: '120%',
    letterSpacing: '-0.6%',
    textTransform: 'none',
  };

  return (
    <Box sx={{ padding: '0 16px 16px' }}>
      <Box sx={{ padding: '20px 24px' }}>
        <Typography variant="h4">{chrome.i18n.getMessage('Import__Profile')}</Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Support_Flow_Wallet_Blocto')}
        </Typography>
      </Box>

      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        aria-label="simple tabs example"
        sx={{
          padding: '0px 24px',
          '& .Mui-selected': {
            borderRadius: '16px',
            color: COLOR_GREEN_FLOW_DARKMODE_00EF8B,
            background: COLOR_GREEN_FLOW_DARKMODE_00EF8B_10pc,
            border: 'none',
          },
          '& .MuiTab-root': {
            minHeight: '12px',
            padding: '12px 10px',
          },
          '& .MuiTabs-indicator': {
            background: 'transparent',
          },
        }}
        textColor="primary"
      >
        <Tab sx={sxStyles} label={chrome.i18n.getMessage('Google__Drive')} />
        <Tab sx={sxStyles} label={chrome.i18n.getMessage('Keystore')} />
        <Tab sx={sxStyles} label={chrome.i18n.getMessage('Recovery_Phrase')} />
        <Tab sx={sxStyles} label={chrome.i18n.getMessage('Private_Key')} />
        <Tab
          sx={{
            ...sxStyles,
            justifyContent: 'flex-end',
            marginLeft: 'auto',
            padding: '0px',
            gap: '10px',
          }}
          label={chrome.i18n.getMessage('Mobile_app')}
          icon={<QrCodeIcon />}
          iconPosition="start"
        />
      </Tabs>
      <TabPanel value={selectedTab} index={0}>
        <Googledrive
          setErrorMessage={setErrorMessage}
          setShowError={setShowError}
          handleGoogleAccountsFound={handleGoogleAccountsFound}
        />
      </TabPanel>
      <TabPanel value={selectedTab} index={1}>
        <JsonImport
          onOpen={handleNotFoundPopup}
          onImport={handleImport}
          setPk={setPk}
          isSignLoading={isSignLoading}
        />
      </TabPanel>
      <TabPanel value={selectedTab} index={2}>
        <SeedPhraseImport
          onOpen={handleNotFoundPopup}
          onImport={handleImport}
          setMnemonic={setMnemonic}
          isSignLoading={isSignLoading}
          path={path}
          setPath={setPath}
          phrase={phrase}
          setPhrase={setPhrase}
        />
      </TabPanel>
      <TabPanel value={selectedTab} index={3}>
        <KeyImport
          onOpen={handleNotFoundPopup}
          onImport={handleImport}
          setPk={setPk}
          isSignLoading={isSignLoading}
        />
      </TabPanel>
      <TabPanel value={selectedTab} index={4}>
        <MobileAppImportSteps isLogin={isLogin} />
      </TabPanel>
      {!addressFound && (
        <ErrorModel
          isOpen={setAddressFound}
          onOpenChange={setAddressFound}
          errorName={chrome.i18n.getMessage('No_Account_found')}
          errorMessage={chrome.i18n.getMessage('We_cant_find')}
        />
      )}
      {!newKey && (
        <ErrorModel
          isOpen={setKeyNew}
          onOpenChange={setKeyNew}
          errorName={chrome.i18n.getMessage('Publickey_already_exist')}
          errorMessage={chrome.i18n.getMessage('Please_import_or_register_a_new_key')}
          isGoback={true}
        />
      )}
    </Box>
  );
};

export default ImportTabs;
