import React from 'react';

import { usePasskeyPrompt } from '@/ui/utils/PasskeyPromptContext';

import PasskeyPrompt from './PasskeyPrompt';

/**
 * A global component that displays the passkey prompt when needed.
 * This component should be mounted at the root level of the application.
 */
const GlobalPasskeyPrompt: React.FC = () => {
  const { shouldShowPrompt, hidePasskeyPrompt } = usePasskeyPrompt();

  if (!shouldShowPrompt) {
    return null;
  }

  return <PasskeyPrompt onClose={hidePasskeyPrompt} />;
};

export default GlobalPasskeyPrompt;
