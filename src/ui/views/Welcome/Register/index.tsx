import { Box } from '@mui/material';
import * as bip39 from 'bip39';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { getAccountKey } from '@/shared/utils/address';
import AllSet from '@/ui/FRWComponent/LandingPages/AllSet';
import GoogleBackup from '@/ui/FRWComponent/LandingPages/GoogleBackup';
import LandingComponents from '@/ui/FRWComponent/LandingPages/LandingComponents';
import PickUsername from '@/ui/FRWComponent/LandingPages/PickUsername';
import RecoveryPhrase from '@/ui/FRWComponent/LandingPages/RecoveryPhrase';
import RepeatPhrase from '@/ui/FRWComponent/LandingPages/RepeatPhrase';
import SetPassword from '@/ui/FRWComponent/LandingPages/SetPassword';
import { storage } from 'background/webapi';
import { useWallet } from 'ui/utils';

const STEPS = {
  USERNAME: 'username',
  RECOVERY: 'recovery',
  REPEAT: 'repeat',
  PASSWORD: 'password',
  BACKUP: 'backup',
  ALL_SET: 'all_set',
} as const;

type StepType = (typeof STEPS)[keyof typeof STEPS];

const Register = () => {
  const history = useHistory();
  const usewallet = useWallet();

  const [activeTab, setActiveTab] = useState<StepType>(STEPS.USERNAME);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mnemonic] = useState(bip39.generateMnemonic());
  const [isAddWallet, setIsAddWallet] = useState<boolean>(false);

  useEffect(() => {
    const checkWalletStatus = async () => {
      const isBooted = await usewallet.isBooted();
      setIsAddWallet(isBooted);
    };

    checkWalletStatus();
  }, [usewallet]);

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

  const submitPassword = useCallback(
    async (newPassword: string) => {
      setPassword(newPassword);
      // We're registering the new profile with the password, username, and mnemonic
      await usewallet.registerNewProfile(username, newPassword, mnemonic);

      // But after all this, we haven't updated loggedInAccounts so if we close the window before the account refreshes, we won't be able to login
      setActiveTab(STEPS.BACKUP);
    },
    [username, mnemonic, usewallet]
  );

  const goBack = () => {
    switch (activeTab) {
      case STEPS.RECOVERY:
        setActiveTab(STEPS.USERNAME);
        break;
      case STEPS.REPEAT:
        setActiveTab(STEPS.RECOVERY);
        break;
      case STEPS.PASSWORD:
        setActiveTab(STEPS.REPEAT);
        break;
      case STEPS.BACKUP:
        setActiveTab(STEPS.PASSWORD);
        break;
      default:
        history.goBack();
    }
  };

  useEffect(() => {
    loadView();
  }, [loadView]);

  return (
    <LandingComponents
      activeIndex={Object.values(STEPS).indexOf(activeTab)}
      direction="right"
      showBackButton={activeTab !== STEPS.BACKUP && activeTab !== STEPS.ALL_SET}
      onBack={goBack}
      showConfetti={activeTab === STEPS.ALL_SET}
      showRegisterHeader={true}
    >
      <Box>
        {activeTab === STEPS.USERNAME && (
          <PickUsername
            handleSwitchTab={() => setActiveTab(STEPS.RECOVERY)}
            username={username}
            setUsername={setUsername}
          />
        )}

        {activeTab === STEPS.RECOVERY && (
          <RecoveryPhrase handleSwitchTab={() => setActiveTab(STEPS.REPEAT)} mnemonic={mnemonic} />
        )}

        {activeTab === STEPS.REPEAT && (
          <RepeatPhrase handleSwitchTab={() => setActiveTab(STEPS.PASSWORD)} mnemonic={mnemonic} />
        )}

        {activeTab === STEPS.PASSWORD && (
          <SetPassword
            handleSwitchTab={() => setActiveTab(STEPS.BACKUP)}
            onSubmit={submitPassword}
            username={username}
            showTerms={true}
            autoFocus={true}
            isLogin={isAddWallet}
          />
        )}

        {activeTab === STEPS.BACKUP && (
          <GoogleBackup
            handleSwitchTab={() => setActiveTab(STEPS.ALL_SET)}
            mnemonic={mnemonic}
            username={username}
            password={password}
          />
        )}

        {activeTab === STEPS.ALL_SET && (
          <AllSet handleSwitchTab={() => window.close()} variant="add" />
        )}
      </Box>
    </LandingComponents>
  );
};

export default Register;
