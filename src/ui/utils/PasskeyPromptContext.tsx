import React, { createContext, useState, useContext, useEffect } from 'react';

import { usePasskey } from '../hooks/usePasskey';

interface PasskeyPromptContextType {
  shouldShowPrompt: boolean;
  showPasskeyPrompt: () => void;
  hidePasskeyPrompt: () => void;
}

const PasskeyPromptContext = createContext<PasskeyPromptContextType>({
  shouldShowPrompt: false,
  showPasskeyPrompt: () => {},
  hidePasskeyPrompt: () => {},
});

export const usePasskeyPrompt = () => useContext(PasskeyPromptContext);

export const PasskeyPromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const { isSupported, isEnabled, isLoading } = usePasskey();

  // Check if we should show the prompt when the passkey status changes
  useEffect(() => {
    // Only show the prompt if passkeys are supported but not enabled
    if (isSupported && !isEnabled && !isLoading) {
      // Get the last time we showed the prompt
      const checkLastPrompt = async () => {
        try {
          const lastPrompt = await chrome.storage.local.get('lastPasskeyPrompt');
          const now = new Date().getTime();

          // If we've never shown the prompt or it's been more than 7 days
          if (
            !lastPrompt.lastPasskeyPrompt ||
            now - lastPrompt.lastPasskeyPrompt > 7 * 24 * 60 * 60 * 1000
          ) {
            setShouldShowPrompt(true);
            // Update the last prompt time
            await chrome.storage.local.set({ lastPasskeyPrompt: now });
          }
        } catch (error) {
          console.error('Error checking last passkey prompt:', error);
        }
      };

      checkLastPrompt();
    }
  }, [isSupported, isEnabled, isLoading]);

  const showPasskeyPrompt = () => {
    if (isSupported && !isEnabled) {
      setShouldShowPrompt(true);
    }
  };

  const hidePasskeyPrompt = () => {
    setShouldShowPrompt(false);
  };

  return (
    <PasskeyPromptContext.Provider
      value={{
        shouldShowPrompt,
        showPasskeyPrompt,
        hidePasskeyPrompt,
      }}
    >
      {children}
    </PasskeyPromptContext.Provider>
  );
};
