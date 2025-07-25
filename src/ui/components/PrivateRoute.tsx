import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router';

import { useWallet, useWalletLoaded } from '@/ui/hooks/use-wallet';

import { getUiType } from '../utils';
import { openInternalPageInTab } from '../utils/webapi';

const PrivateRoute = ({ children }) => {
  const wallet = useWallet();
  const walletLoaded = useWalletLoaded();

  const [booted, setBooted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const uiType = getUiType();
  // Everything through the wallet controller is async, so we need to check if the wallet is booted and unlocked in a useEffect
  useEffect(() => {
    let mounted = true;

    const fetchLockState = async () => {
      const booted = await wallet.isBooted();

      if (!booted) {
        return { booted, unlocked: false };
      } else {
        const unlocked = await wallet.isUnlocked();
        return { booted, unlocked };
      }
    };
    if (walletLoaded) {
      // Initial check
      fetchLockState().then(({ booted, unlocked }) => {
        if (mounted) {
          setBooted(booted);
          setUnlocked(unlocked);
          setLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [wallet, walletLoaded]);

  if (loading) {
    // If we haven't loaded, we can't make a decision on whether to render the children
    // so we return null
    return null;
  }

  if (!booted) {
    if (uiType.isTab) {
      return <Navigate to="/welcome" replace />;
    } else {
      openInternalPageInTab('welcome');
      return null;
    }
  }

  if (!unlocked) {
    return <Navigate to="/unlock" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
