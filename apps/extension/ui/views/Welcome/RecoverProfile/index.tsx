import { Alert, Snackbar } from '@mui/material';
import React, { useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router';

import { consoleError } from '@/shared/utils/console-log';
import Google from '@/ui/components/google-import';
import ImportTabs from '@/ui/components/import-components/ImportTabs';
import AllSet from '@/ui/components/LandingPages/AllSet';
import GoogleBackup from '@/ui/components/LandingPages/GoogleBackup';
import LandingComponents from '@/ui/components/LandingPages/LandingComponents';
import PickNickname from '@/ui/components/LandingPages/PickNickname';
import SetPassword from '@/ui/components/LandingPages/SetPassword';
import { useWallet } from '@/ui/hooks/use-wallet';
import {
  IMPORT_STEPS,
  importProfileReducer,
  INITIAL_IMPORT_STATE,
} from '@/ui/reducers/import-profile-reducer';

const RecoverProfile = () => {
  const navigate = useNavigate();
  const usewallet = useWallet();

  const [state, dispatch] = useReducer(importProfileReducer, INITIAL_IMPORT_STATE);
  const {
    activeTab,
    mnemonic,
    pk,
    username,
    nickname,
    password,
    errMessage,
    showError,
    showGoogleImport,
    googleAccounts,
    path,
    phrase,
    isAddWallet,
  } = state;

  useEffect(() => {
    const checkWalletStatus = async () => {
      const isBooted = await usewallet.isBooted();
      dispatch({ type: 'SET_IS_ADD_WALLET', payload: isBooted });
    };

    checkWalletStatus();
  }, [usewallet]);

  const handleErrorClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch({ type: 'SET_ERROR', payload: { message: '', show: false } });
  };

  const submitPassword = async (newPassword: string) => {
    dispatch({ type: 'SET_PASSWORD', payload: newPassword });
    // Check the password first so we can show the error message
    if (isAddWallet) {
      try {
        await usewallet.verifyPasswordIfBooted(newPassword);
      } catch (err) {
        consoleError(err);
        dispatch({
          type: 'SET_ERROR',
          payload: { message: chrome.i18n.getMessage('Incorrect__Password'), show: true },
        });
        return;
      }
    }
    try {
      if (pk) {
        await usewallet.importProfileUsingPrivateKey(nickname, newPassword, pk);
        dispatch({ type: 'SET_ACTIVE_TAB', payload: IMPORT_STEPS.ALL_SET });
      } else if (mnemonic) {
        await usewallet.importProfileUsingMnemonic(nickname, newPassword, mnemonic, path, phrase);
        dispatch({ type: 'SET_ACTIVE_TAB', payload: IMPORT_STEPS.GOOGLE_BACKUP });
      } else {
        throw new Error('No mnemonic or private key provided');
      }

      // Now get the proper username
      const userInfo = await usewallet.getUserInfo();
      if (!userInfo) {
        throw new Error('User info not found');
      }
      dispatch({ type: 'SET_USERNAME', payload: userInfo.username });
    } catch (error) {
      consoleError(error);
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: 'An error occured importing your account. Please contact support.',
          show: true,
        },
      });
    }
  };

  const goBack = () => {
    if (activeTab === IMPORT_STEPS.GOOGLE_BACKUP || activeTab === IMPORT_STEPS.ALL_SET) {
      navigate(-1);
      return;
    }
    dispatch({ type: 'GO_BACK' });
  };

  const handleGoogleAccountsFound = (accounts: string[]) => {
    dispatch({ type: 'SET_GOOGLE_IMPORT', payload: { show: true, accounts } });
  };

  if (showGoogleImport) {
    return (
      <Google
        accounts={googleAccounts}
        onBack={() =>
          dispatch({
            type: 'SET_GOOGLE_IMPORT',
            payload: { show: false, accounts: [] },
          })
        }
      />
    );
  }
  return (
    <LandingComponents
      activeIndex={Object.values(IMPORT_STEPS).indexOf(activeTab)}
      direction="right"
      showBackButton={activeTab !== IMPORT_STEPS.ALL_SET}
      onBack={goBack}
      showConfetti={activeTab === IMPORT_STEPS.ALL_SET}
      showRegisterHeader={true}
      stepCount={Object.values(IMPORT_STEPS).length}
    >
      {activeTab === IMPORT_STEPS.IMPORT && (
        <ImportTabs
          setMnemonic={(m) => dispatch({ type: 'SET_MNEMONIC', payload: m })}
          setPk={(k) => dispatch({ type: 'SET_PK', payload: k })}
          setAccounts={(a) => dispatch({ type: 'SET_ACCOUNTS', payload: a })}
          goPassword={() =>
            dispatch({
              type: 'SET_ACTIVE_TAB',
              payload: IMPORT_STEPS.RECOVER_PASSWORD,
            })
          }
          handleSwitchTab={() =>
            dispatch({
              type: 'SET_ACTIVE_TAB',
              payload: IMPORT_STEPS.PICK_USERNAME,
            })
          }
          setErrorMessage={(msg) =>
            dispatch({
              type: 'SET_ERROR',
              payload: { message: msg, show: true },
            })
          }
          setShowError={(show) => dispatch({ type: 'SET_ERROR', payload: { message: '', show } })}
          handleGoogleAccountsFound={handleGoogleAccountsFound}
          path={path}
          setPath={(p) => dispatch({ type: 'SET_DERIVATION_PATH', payload: p })}
          phrase={phrase}
          setPhrase={(p) => dispatch({ type: 'SET_PASSPHRASE', payload: p })}
        />
      )}

      {activeTab === IMPORT_STEPS.PICK_USERNAME && (
        <PickNickname
          handleSwitchTab={() =>
            dispatch({
              type: 'SET_ACTIVE_TAB',
              payload: IMPORT_STEPS.SET_PASSWORD,
            })
          }
          nickname={nickname}
          setNickname={(u) => dispatch({ type: 'SET_NICKNAME', payload: u })}
        />
      )}

      {(activeTab === IMPORT_STEPS.SET_PASSWORD || activeTab === IMPORT_STEPS.RECOVER_PASSWORD) && (
        <SetPassword onSubmit={submitPassword} isLogin={isAddWallet} />
      )}
      {activeTab === IMPORT_STEPS.GOOGLE_BACKUP && username && password && (
        <GoogleBackup
          handleSwitchTab={() =>
            dispatch({
              type: 'SET_ACTIVE_TAB',
              payload: IMPORT_STEPS.ALL_SET,
            })
          }
          mnemonic={mnemonic}
          username={username}
          password={password}
        />
      )}

      {activeTab === IMPORT_STEPS.ALL_SET && <AllSet handleSwitchTab={() => window.close()} />}

      <Snackbar
        open={showError}
        onClose={handleErrorClose}
        autoHideDuration={5_000}
        data-testid="snackbar"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleErrorClose} variant="filled" severity="error" sx={{ width: '100%' }}>
          {errMessage}
        </Alert>
      </Snackbar>
    </LandingComponents>
  );
};

export default RecoverProfile;
