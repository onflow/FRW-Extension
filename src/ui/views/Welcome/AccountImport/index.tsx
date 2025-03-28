import { Snackbar, Alert, Box } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { FLOW_BIP44_PATH } from '@/shared/utils/algo-constants';
import AllSet from '@/ui/FRWComponent/LandingPages/AllSet';
import GoogleBackup from '@/ui/FRWComponent/LandingPages/GoogleBackup';
import LandingComponents from '@/ui/FRWComponent/LandingPages/LandingComponents';
import PickUsername from '@/ui/FRWComponent/LandingPages/PickUsername';
import SetPassword from '@/ui/FRWComponent/LandingPages/SetPassword';
import { useWallet } from 'ui/utils';

import Google from './Google';
import ImportTabs from './ImportTabs';

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
  const [pk, setPk] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accounts, setAccounts] = useState<any>([]);
  const [errMessage, setErrorMessage] = useState(chrome.i18n.getMessage('No__backup__found'));
  const [showError, setShowError] = useState(false);
  const [activeTab, setActiveTab] = useState<StepType>(STEPS.IMPORT);
  const [showGoogleImport, setShowGoogleImport] = useState(false);
  const [googleAccounts, setGoogleAccounts] = useState<string[]>([]);

  // For seed phrase import
  const [path, setPath] = useState(FLOW_BIP44_PATH);
  const [phrase, setPhrase] = useState('');

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
    // Note this handles both creating a new profile and importing an existing profile
    setPassword(newPassword);
    try {
      if (pk) {
        await usewallet.importProfileUsingPrivateKey(username, newPassword, pk);
        // Go to done
        setActiveTab(STEPS.ALL_SET);
      } else if (mnemonic) {
        await usewallet.importProfileUsingMnemonic(username, newPassword, mnemonic, path, phrase);
        // Go to backup
        setActiveTab(STEPS.GOOGLE_BACKUP);
      } else {
        throw new Error('No mnemonic or private key provided');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
      setShowError(true);
    }
  };

  const goBack = () => {
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
                  path={path}
                  setPath={setPath}
                  phrase={phrase}
                  setPhrase={setPhrase}
                />
              )}

              {activeTab === STEPS.PICK_USERNAME && (
                <PickUsername
                  handleSwitchTab={() => setActiveTab(STEPS.SET_PASSWORD)}
                  username={username}
                  setUsername={setUsername}
                />
              )}

              {(activeTab === STEPS.SET_PASSWORD || activeTab === STEPS.RECOVER_PASSWORD) && (
                <SetPassword
                  handleSwitchTab={() => {}}
                  onSubmit={submitPassword}
                  isLogin={activeTab === STEPS.RECOVER_PASSWORD}
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
