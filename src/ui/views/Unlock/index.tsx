// import { useTranslation } from 'react-i18next';
import KeyIcon from '@mui/icons-material/Key';
import { Input, Typography, Box, FormControl, Button, Divider } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { makeStyles } from '@mui/styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import lilo from '@/ui/FRWAssets/image/lilo.png';
import { LLPrimaryButton, LLResetPopup } from '@/ui/FRWComponent';
import PasskeyPrompt from '@/ui/FRWComponent/PasskeyPrompt';
import SlideRelative from '@/ui/FRWComponent/SlideRelative';
import { ErrorSnackbar } from '@/ui/FRWComponent/Snackbar';
import { usePasskey } from '@/ui/hooks/usePasskey';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useWallet, useApproval, useWalletRequest, useWalletLoaded } from '@/ui/utils';
import { usePasskeyPrompt } from '@/ui/utils/PasskeyPromptContext';
import { openInternalPageInTab } from '@/ui/utils/webapi';

import CancelIcon from '../../../components/iconfont/IconClose';
import './style.css';

const useStyles = makeStyles(() => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    height: '64px',
    padding: '16px',
    magrinBottom: '64px',
    zIndex: '999',
    backgroundColor: '#282828',
    border: '2px solid #4C4C4C',
    borderRadius: '12px',
    boxSizing: 'border-box',
    '&.Mui-focused': {
      border: '2px solid #FAFAFA',
      boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
    },
  },
  passkeyButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: 'success.main',
    color: '#fff',
    '&:hover': {
      backgroundColor: 'success.dark',
    },
  },
  orDivider: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    margin: '16px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#4C4C4C',
  },
  orText: {
    padding: '0 16px',
    color: '#777',
  },
}));

const UsernameError: React.FC = () => (
  <Box display="flex" flexDirection="row" alignItems="center">
    <CancelIcon size={24} color={'#E54040'} style={{ margin: '8px' }} />
    <Typography variant="body1" color="text.secondary">
      {chrome.i18n.getMessage('Incorrect__Password')}
    </Typography>
  </Box>
);

if (process.env.NODE_ENV !== 'development') {
  if (!!process.env.DEV_PASSWORD) {
    throw new Error('DEV_PASSWORD should only be set in development environment');
  }
}

const DEFAULT_PASSWORD =
  process.env.NODE_ENV === 'development' ? process.env.DEV_PASSWORD || '' : '';

const Unlock = () => {
  const wallet = useWallet();
  const walletIsLoaded = useWalletLoaded();
  const classes = useStyles();
  const [, resolveApproval] = useApproval();
  const inputEl = useRef<any>(null);
  const location = useLocation();
  const history = useHistory();
  // const { t } = useTranslation();
  const [showError, setShowError] = useState(false);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [resetPop, setResetPop] = useState<boolean>(false);
  const { clearProfileData } = useProfiles();

  // Use our new passkey hook
  const {
    isSupported: isPasskeySupported,
    isEnabled: isPasskeyEnabled,
    isLoading: isPasskeyStatusLoading,
  } = usePasskey();

  // Passkey authentication state
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');
  const [showPasskeyError, setShowPasskeyError] = useState(false);

  // State for showing the passkey prompt
  const { showPasskeyPrompt } = usePasskeyPrompt();

  // Check if we should force showing the password field
  const searchParams = new URLSearchParams(location.search);
  const forcePasswordLogin = searchParams.get('login') === 'password';

  // Check passkey status on component mount
  useEffect(() => {
    console.log('Passkey status:', {
      isPasskeySupported,
      isPasskeyEnabled,
      isPasskeyStatusLoading,
    });
  }, [isPasskeySupported, isPasskeyEnabled, isPasskeyStatusLoading]);

  // Monitor the showPasskeyPrompt state
  useEffect(() => {
    console.log('showPasskeyPrompt state changed:', showPasskeyPrompt);
  }, [showPasskeyPrompt]);

  useEffect(() => {
    if (!inputEl.current) return;
    inputEl.current.focus();
  }, []);

  const restPass = useCallback(async () => {
    // setResetPop(true);
    await wallet.lockWallet();
    clearProfileData();
    // If we're already using passkeys, navigate to the forgot page with a parameter
    // to indicate we might want to use password login when we return
    if (isPasskeyEnabled && isPasskeySupported && !forcePasswordLogin) {
      openInternalPageInTab('forgot?return=password');
    } else {
      openInternalPageInTab('forgot');
    }
  }, [wallet, clearProfileData, isPasskeyEnabled, isPasskeySupported, forcePasswordLogin]);

  const [run] = useWalletRequest(wallet.unlock, {
    onSuccess() {
      // If passkeys are supported but not enabled, trigger the global prompt
      // Make sure to check this regardless of forcePasswordLogin
      if (isPasskeySupported && !isPasskeyEnabled && !isPasskeyStatusLoading) {
        console.log('Triggering global passkey setup prompt after successful login');
        showPasskeyPrompt();
      } else {
        console.log('Not showing passkey prompt:', {
          isPasskeySupported,
          isPasskeyEnabled,
          isPasskeyStatusLoading,
        });
      }
      resolveApproval('unlocked');
    },
    onError(err) {
      console.error('onError', err);
      setShowError(true);
    },
  });

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        run(password);
      }
    },
    [run, password]
  );

  const handleUnlock = useCallback(() => {
    run(password);
  }, [run, password]);

  // Handle passkey sign-in
  const handlePasskeySignIn = async () => {
    try {
      setIsPasskeyLoading(true);
      setShowPasskeyError(false);

      // Get available passkeys from the wallet controller (background)
      const passkeyInfo = await wallet.getAvailablePasskeys();
      console.log('Available passkeys:', passkeyInfo);

      if (!passkeyInfo || passkeyInfo.length === 0) {
        throw new Error('No passkeys available for this account');
      }

      // Generate a random challenge in the UI context
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Get the domain for the RP ID - use the effective domain
      const rpId = window.location.hostname;
      console.log('Using RP ID for authentication:', rpId);

      // Prepare allowed credentials from stored credentials
      const allowCredentials = passkeyInfo.map((cred) => ({
        type: 'public-key' as const,
        id: Uint8Array.from(atob(cred.rawId), (c) => c.charCodeAt(0)),
        transports: ['internal'] as AuthenticatorTransport[],
      }));

      // Create credential request options
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials,
        timeout: 60000,
        userVerification: 'required',
        rpId: rpId,
      };

      console.log(
        'Requesting passkey authentication with options:',
        publicKeyCredentialRequestOptions
      );

      try {
        // Request credential in the UI context (WebAuthn API)
        const credential = (await navigator.credentials.get({
          publicKey: publicKeyCredentialRequestOptions,
        })) as PublicKeyCredential;

        if (!credential) {
          throw new Error('Failed to get passkey');
        }

        console.log('Passkey authentication successful in UI context:', credential);

        // Verify the credential with the wallet service in the background
        // This will also decrypt and store the password if available, and unlock the wallet
        console.log('Verifying credential with ID:', credential.id);
        const success = await wallet.verifyPasskeyCredential(credential.id);
        console.log('Verification result:', success);

        if (success) {
          console.log('Passkey authentication complete, wallet unlocked');
          // Successful login - the wallet is already unlocked by verifyPasskeyCredential
          resolveApproval('unlocked');
        } else {
          console.error('Passkey verification failed in the background');
          setPasskeyError('Failed to verify passkey. Please try again or use your password.');
          setShowPasskeyError(true);
        }
      } catch (credentialError: any) {
        console.error('Error getting credential:', credentialError);

        // Provide more specific error messages based on the error
        if (credentialError.name === 'NotAllowedError') {
          setPasskeyError(
            'Permission denied. You may have cancelled the authentication or your device denied the request.'
          );
        } else if (credentialError.name === 'SecurityError') {
          setPasskeyError(
            'Security error. The operation is not allowed in this context or with these parameters.'
          );
        } else {
          setPasskeyError(
            `Failed to authenticate with passkey: ${credentialError.message || 'Unknown error'}`
          );
        }
        setShowPasskeyError(true);
      }
    } catch (error) {
      console.error('Error signing in with passkey:', error);
      setPasskeyError(
        'An error occurred during passkey authentication. Please try again or use your password.'
      );
      setShowPasskeyError(true);
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        backgroundColor: '#282828',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* <Logo size={90} style={{marginTop:'120px'}}/> */}

      <Box className="logoContainer" sx={{ marginTop: '60px' }}>
        <img src={lilo} style={{ height: '100%', width: '100%' }} />
      </Box>

      {/* <img  style={{paddingTop:'108px' }} src={lilicoIcon} /> */}
      <Box sx={{ width: '100%', textAlign: 'center' }}>
        <Typography
          sx={{
            fontWeight: '700',
            fontSize: '26px',
            fontFamily: 'Inter',
            fontStyle: 'normal',
            pt: '30px',
            pb: '30px',
          }}
        >
          {chrome.i18n.getMessage('Welcome__Back__Unlock')}
        </Typography>
      </Box>

      <Box sx={{ width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Passkey authentication button - only show if supported and enabled and not forcing password login */}
        {isPasskeySupported && isPasskeyEnabled && !forcePasswordLogin && (
          <>
            <Button
              variant="contained"
              color="success"
              className={classes.passkeyButton}
              onClick={handlePasskeySignIn}
              disabled={isPasskeyLoading || !walletIsLoaded}
              fullWidth
            >
              {isPasskeyLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <KeyIcon /> Unlock with Passkey
                </>
              )}
            </Button>

            {/* Add a small link to switch to password login */}
            <Typography
              onClick={() => history.push('/unlock?login=password')}
              sx={{
                fontSize: '14px',
                fontFamily: 'Inter',
                fontStyle: 'normal',
                color: 'neutral1.main',
                textAlign: 'center',
                marginTop: '8px',
                marginBottom: '16px',
                cursor: 'pointer',
              }}
            >
              Use password instead
            </Typography>
          </>
        )}
      </Box>

      {/* Show password input if passkeys are not enabled or we're forcing password login */}
      {(!isPasskeyEnabled || !isPasskeySupported || forcePasswordLogin) && (
        <>
          <FormControl
            sx={{
              flexGrow: 1,
              width: '90%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <Input
              id="textfield"
              type="password"
              className={classes.inputBox}
              placeholder={chrome.i18n.getMessage('Enter__Your__Password')}
              autoFocus
              fullWidth
              disableUnderline
              value={password}
              onChange={(event) => {
                setShowError(false);
                setPassword(event.target.value);
              }}
              onKeyDown={handleKeyDown}
            />

            <SlideRelative direction="down" show={showError}>
              <Box
                sx={{
                  width: '95%',
                  backgroundColor: 'error.light',
                  mx: 'auto',
                  borderRadius: '0 0 12px 12px',
                }}
              >
                <Box display="flex" flexDirection="row" sx={{ p: '4px' }}>
                  <UsernameError />
                </Box>
              </Box>
            </SlideRelative>
          </FormControl>

          <Box sx={{ width: '90%', marginBottom: '32px' }}>
            <LLPrimaryButton
              color="success"
              type="submit"
              onClick={handleUnlock}
              fullWidth
              label={chrome.i18n.getMessage('Unlock_Wallet')}
              disabled={!walletIsLoaded}
            />
            <Typography
              onClick={restPass}
              sx={{
                fontSize: '14px',
                fontFamily: 'Inter',
                fontStyle: 'normal',
                color: 'neutral1.main',
                textAlign: 'center',
                marginTop: '16px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              {chrome.i18n.getMessage('Forgot_password')}
            </Typography>
          </Box>
        </>
      )}

      {/* Show "Forgot password" link even when using passkey, but only if not already showing password login */}
      {isPasskeyEnabled && isPasskeySupported && !forcePasswordLogin && (
        <Box sx={{ width: '90%', marginBottom: '32px', textAlign: 'center' }}>
          <Typography
            onClick={restPass}
            sx={{
              fontSize: '14px',
              fontFamily: 'Inter',
              fontStyle: 'normal',
              color: 'neutral1.main',
              marginTop: '16px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            {chrome.i18n.getMessage('Forgot_password')}
          </Typography>
        </Box>
      )}

      <LLResetPopup
        resetPop={resetPop}
        handleCloseIconClicked={() => setResetPop(false)}
        handleCancelBtnClicked={() => setResetPop(false)}
        handleAddBtnClicked={() => {
          setResetPop(false);
        }}
      />

      {/* Error snackbar for passkey errors */}
      <ErrorSnackbar
        open={showPasskeyError}
        message={passkeyError}
        onClose={() => setShowPasskeyError(false)}
      />
    </Box>
  );
};

export default Unlock;
