import { Snackbar, Alert, Box } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { getHashAlgo, getSignAlgo } from '@/shared/utils/algo';
import AllSet from '@/ui/FRWComponent/LandingPages/AllSet';
import GoogleBackup from '@/ui/FRWComponent/LandingPages/GoogleBackup';
import LandingComponents from '@/ui/FRWComponent/LandingPages/LandingComponents';
import PickUsername from '@/ui/FRWComponent/LandingPages/PickUsername';
import SetPassword from '@/ui/FRWComponent/LandingPages/SetPassword';
import { storage } from 'background/webapi';
import { useWallet } from 'ui/utils';

import Google from './Google';
import ImportTabs from './ImportTabs';
import RecoveryPassword from './RecoveryPassword';

const STEPS = {
  IMPORT: 'import',
  PICK_USERNAME: 'pick_username',
  SET_PASSWORD: 'set_password',
  RECOVER_PASSWORD: 'recover_password',
  GOOGLE_BACKUP: 'google_backup',
  ALL_SET: 'all_set',
} as const;

type StepType = (typeof STEPS)[keyof typeof STEPS];

const AccountImport = () => {
  const history = useHistory();
  const usewallet = useWallet();

  const [mnemonic, setMnemonic] = useState('');
  const [pk, setPk] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accounts, setAccounts] = useState<any>([]);
  const [errMessage, setErrorMessage] = useState(chrome.i18n.getMessage('No__backup__found'));
  const [showError, setShowError] = useState(false);
  const [activeTab, setActiveTab] = useState<StepType>(STEPS.IMPORT);
  const [showGoogleImport, setShowGoogleImport] = useState(false);
  const [googleAccounts, setGoogleAccounts] = useState<string[]>([]);

  const getUsername = (username: string) => {
    setUsername(username.toLowerCase());
  };

  const loadView = useCallback(async () => {
    usewallet
      .getCurrentAccount()
      .then((res) => {
        if (res) {
          history.push('/');
        }
      })
      .catch(() => {
        return;
      });
  }, [usewallet, history]);

  useEffect(() => {
    loadView();
  }, [loadView]);

  const handleErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setShowError(false);
  };

  const submitPassword = async (newPassword: string) => {
    setPassword(newPassword);
    const accountKeyStruct = {
      public_key: accounts[0].pubK,
      sign_algo: getSignAlgo(accounts[0].signAlgo),
      hash_algo: getHashAlgo(accounts[0].hashAlgo),
      weight: 1000,
    };

    const installationId = await usewallet.openapi.getInstallationId();

    const device_info = {
      device_id: installationId,
      device_name: navigator.userAgent,
      device_type: 'extension',
      push_token: '',
      platform: 'chrome',
    };

    const address = accounts[0].address.replace(/^0x/, '');
    await usewallet.openapi.importKey(accountKeyStruct, device_info, username, {}, address);
    await usewallet.boot(newPassword);
    storage.remove('premnemonic');
    await usewallet.saveIndex(username);
    if (pk) {
      await usewallet.importPrivateKey(pk);
      setActiveTab(STEPS.ALL_SET);
    } else {
      await usewallet.createKeyringWithMnemonics(mnemonic);
      setActiveTab(STEPS.GOOGLE_BACKUP);
    }
  };

  const goBack = () => {
    console.log('activeTab', activeTab);
    switch (activeTab) {
      case STEPS.PICK_USERNAME:
        setActiveTab(STEPS.IMPORT);
        break;
      case STEPS.SET_PASSWORD:
        setActiveTab(STEPS.PICK_USERNAME);
        break;
      case STEPS.RECOVER_PASSWORD:
        setActiveTab(STEPS.IMPORT);
        break;
      case STEPS.GOOGLE_BACKUP:
        history.goBack();
      default:
        history.goBack();
    }
  };

  const handleGoogleAccountsFound = (accounts: string[]) => {
    setGoogleAccounts(accounts);
    setShowGoogleImport(true);
  };

  return (
    <Box>
      {!showGoogleImport ? (
        <LandingComponents
          activeIndex={Object.values(STEPS).indexOf(activeTab)}
          direction="right"
          showBackButton={activeTab !== STEPS.ALL_SET}
          onBack={goBack}
          showConfetti={activeTab === STEPS.ALL_SET}
          showRegisterHeader={true}
        >
          <Box>
            <>
              {activeTab === STEPS.IMPORT && (
                <ImportTabs
                  setMnemonic={setMnemonic}
                  setPk={setPk}
                  setAccounts={setAccounts}
                  accounts={accounts}
                  mnemonic={mnemonic}
                  pk={pk}
                  setUsername={setUsername}
                  goPassword={() => setActiveTab(STEPS.RECOVER_PASSWORD)}
                  handleSwitchTab={() => setActiveTab(STEPS.PICK_USERNAME)}
                  setErrorMessage={setErrorMessage}
                  setShowError={setShowError}
                  handleGoogleAccountsFound={handleGoogleAccountsFound}
                />
              )}

              {activeTab === STEPS.PICK_USERNAME && (
                <PickUsername
                  handleSwitchTab={() => setActiveTab(STEPS.SET_PASSWORD)}
                  savedUsername={username}
                  getUsername={getUsername}
                />
              )}

              {activeTab === STEPS.SET_PASSWORD && (
                <SetPassword
                  handleSwitchTab={() => setActiveTab(STEPS.GOOGLE_BACKUP)}
                  onSubmit={submitPassword}
                  isLogin={true}
                />
              )}

              {activeTab === STEPS.RECOVER_PASSWORD && (
                <RecoveryPassword
                  handleSwitchTab={() => setActiveTab(STEPS.GOOGLE_BACKUP)}
                  mnemonic={mnemonic}
                  pk={pk}
                  goLast={() => setActiveTab(STEPS.ALL_SET)}
                  accountKey={accounts}
                />
              )}

              {activeTab === STEPS.GOOGLE_BACKUP && (
                <GoogleBackup
                  handleSwitchTab={() => setActiveTab(STEPS.ALL_SET)}
                  mnemonic={mnemonic}
                  username={username}
                  password={password}
                />
              )}

              {activeTab === STEPS.ALL_SET && <AllSet handleSwitchTab={() => window.close()} />}
            </>
          </Box>

          <Snackbar open={showError} autoHideDuration={3000} onClose={handleErrorClose}>
            <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
              {errMessage}
            </Alert>
          </Snackbar>
        </LandingComponents>
      ) : (
        <Google accounts={googleAccounts} onBack={() => setShowGoogleImport(false)} />
      )}
    </Box>
  );
};

export default AccountImport;
