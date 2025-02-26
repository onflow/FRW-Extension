import { useState, useEffect, useCallback } from 'react';

import { useWallet } from './index';

/**
 * Custom hook to check if passkeys are supported by the browser and enabled for the user
 *
 * @returns {Object} An object containing:
 *   - isSupported: boolean indicating if passkeys are supported by the browser
 *   - isEnabled: boolean indicating if passkeys are enabled for the user
 *   - isLoading: boolean indicating if the check is in progress
 *   - error: string containing any error message
 *   - checkPasskeyStatus: function to manually trigger a status check
 */
export const usePasskey = () => {
  const wallet = useWallet();
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const checkPasskeyStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const debug: any = {
        browserChecks: {},
        walletChecks: {},
      };

      // First check browser support using the WebAuthn API directly
      const browserSupported =
        typeof window !== 'undefined' &&
        typeof window.PublicKeyCredential !== 'undefined' &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
          'function';

      debug.browserChecks.hasPublicKeyCredential =
        typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined';
      debug.browserChecks.hasIsUserVerifyingPlatformAuthenticatorAvailable =
        debug.browserChecks.hasPublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
          'function';
      debug.browserChecks.browserSupported = browserSupported;

      let platformAuthenticatorAvailable = false;

      if (browserSupported) {
        try {
          platformAuthenticatorAvailable =
            await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          debug.browserChecks.platformAuthenticatorAvailable = platformAuthenticatorAvailable;
        } catch (err) {
          console.error('Error checking platform authenticator availability:', err);
          debug.browserChecks.platformAuthenticatorError =
            err instanceof Error ? err.message : String(err);
          // If there's an error checking, we'll assume it's not available
          platformAuthenticatorAvailable = false;
        }
      }

      // Set support status based on browser capabilities
      const supported = browserSupported && platformAuthenticatorAvailable;
      setIsSupported(supported);
      debug.supported = supported;

      // Only check if passkeys are enabled if the browser supports them
      if (supported) {
        try {
          // Check if there are any available passkeys
          const availablePasskeys = await wallet.getAvailablePasskeys();
          debug.walletChecks.availablePasskeys = availablePasskeys
            ? { count: availablePasskeys.length }
            : null;

          const enabled = Array.isArray(availablePasskeys) && availablePasskeys.length > 0;
          setIsEnabled(enabled);
          debug.enabled = enabled;
        } catch (err) {
          console.error('Error checking if passkeys are enabled:', err);
          debug.walletChecks.error = err instanceof Error ? err.message : String(err);
          setIsEnabled(false);
        }
      } else {
        setIsEnabled(false);
      }

      setDebugInfo(debug);
      console.log('Passkey debug info:', debug);
    } catch (err) {
      console.error('Error checking passkey status:', err);
      setError('Failed to check passkey status');
      setIsSupported(false);
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    checkPasskeyStatus();
  }, [checkPasskeyStatus]);

  return {
    isSupported,
    isEnabled,
    isLoading,
    error,
    checkPasskeyStatus,
    debugInfo,
  };
};
