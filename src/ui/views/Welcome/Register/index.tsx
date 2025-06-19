import { Box } from '@mui/material';
import React, { useCallback, useEffect, useReducer } from 'react';

import AllSet from '@/ui/components/LandingPages/AllSet';
import GoogleBackup from '@/ui/components/LandingPages/GoogleBackup';
import LandingComponents from '@/ui/components/LandingPages/LandingComponents';
import LandingTab from '@/ui/components/LandingPages/LandingTab';
import PickUsername from '@/ui/components/LandingPages/PickUsername';
import RecoveryPhrase from '@/ui/components/LandingPages/RecoveryPhrase';
import RepeatPhrase from '@/ui/components/LandingPages/RepeatPhrase';
import SetPassword from '@/ui/components/LandingPages/SetPassword';
import {
  INITIAL_REGISTER_STATE,
  initRegisterState,
  registerReducer,
  STEPS,
} from '@/ui/reducers/register-reducer';
import { useWallet } from 'ui/utils';

const Register = () => {
  const usewallet = useWallet();

  const [state, dispatch] = useReducer(registerReducer, INITIAL_REGISTER_STATE, initRegisterState);
  const { activeTab, username, password, mnemonic, isAddWallet } = state;

  useEffect(() => {
    const checkWalletStatus = async () => {
      const isBooted = await usewallet.isBooted();
      dispatch({ type: 'SET_IS_ADD_WALLET', payload: isBooted });
    };

    checkWalletStatus();
  }, [usewallet]);

  const submitPassword = useCallback(
    async (newPassword: string) => {
      dispatch({ type: 'SET_PASSWORD', payload: newPassword });
      // We're registering the new profile with the password, username, and mnemonic
      await usewallet.registerNewProfile(username, newPassword, mnemonic);

      dispatch({ type: 'GO_NEXT' });
    },
    [username, mnemonic, usewallet]
  );

  return (
    <LandingComponents
      activeIndex={Object.values(STEPS).indexOf(activeTab)}
      direction="right"
      showBackButton={activeTab !== STEPS.ALL_SET}
      onBack={() => dispatch({ type: 'GO_BACK' })}
      showConfetti={activeTab === STEPS.ALL_SET}
      showRegisterHeader={true}
    >
      <Box>
        <LandingTab activeTab={activeTab} tab={STEPS.USERNAME}>
          <PickUsername
            handleSwitchTab={() => dispatch({ type: 'GO_NEXT' })}
            username={username}
            setUsername={(name: string) => dispatch({ type: 'SET_USERNAME', payload: name })}
          />
        </LandingTab>

        <LandingTab activeTab={activeTab} tab={STEPS.RECOVERY}>
          <RecoveryPhrase
            handleSwitchTab={() => dispatch({ type: 'GO_NEXT' })}
            mnemonic={mnemonic}
          />
        </LandingTab>

        <LandingTab activeTab={activeTab} tab={STEPS.REPEAT}>
          <RepeatPhrase handleSwitchTab={() => dispatch({ type: 'GO_NEXT' })} mnemonic={mnemonic} />
        </LandingTab>

        <LandingTab activeTab={activeTab} tab={STEPS.PASSWORD}>
          <SetPassword
            onSubmit={submitPassword}
            showTerms={true}
            autoFocus={true}
            isLogin={isAddWallet}
          />
        </LandingTab>

        <LandingTab activeTab={activeTab} tab={STEPS.BACKUP}>
          <GoogleBackup
            handleSwitchTab={() => dispatch({ type: 'GO_NEXT' })}
            mnemonic={mnemonic}
            username={username}
            password={password}
          />
        </LandingTab>

        <LandingTab activeTab={activeTab} tab={STEPS.ALL_SET}>
          <AllSet handleSwitchTab={() => window.close()} variant="add" />
        </LandingTab>
      </Box>
    </LandingComponents>
  );
};

export default Register;
