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
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isAddWallet = params.get('add') === 'true';

  const [activeTab, setActiveTab] = useState<StepType>(STEPS.USERNAME);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mnemonic] = useState(bip39.generateMnemonic());

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

  const submitPassword = useCallback(
    async (newPassword: string) => {
      setPassword(newPassword);

      // We're saving currentAccountIndex - which is a legacy way of storing the index of the account in the keyring array
      // currentId always takes precedence
      // The problem is that we don't yet have an id for the account.
      await usewallet.saveIndex(username);
      // the account is the public key of the account. It's derived from the mnemonic
      const accountKey = getAccountKey(mnemonic);

      // We're booting the keyring with the new password
      // This does not update the vault, it simply sets the password / cypher methods we're going to use to store our private keys in the vault

      await usewallet.boot(newPassword);
      // We're then registering the account with the public key
      // This calls our backend API which gives us back an account id
      // This register call ALSO sets the currentId in local storage
      // In addition, it will sign us in to the new account with our auth (Firebase) on our backend
      // Note this auth is different to unlocking the wallet with the password.
      await usewallet.openapi.register(accountKey, username);
      // We're removing the pre-mnemonic from storage (TB: I have no idea why this is here)
      storage.remove('premnemonic');
      // We're creating the keyring with the mnemonic. This will encypt the private keys and store them in the keyring vault and deepVault
      await usewallet.createKeyringWithMnemonics(mnemonic);
      // We're creating the Flow address for the account
      // Only after this, do we have a valid wallet with a Flow address
      await usewallet.openapi.createFlowAddress();

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
            savedUsername={username}
            getUsername={getUsername}
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
