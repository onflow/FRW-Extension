import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router';

import { useWallet } from 'ui/utils';

const PrivateRoute = ({ children }) => {
  const wallet = useWallet();

  const [booted, setBooted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

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

    // Initial check
    fetchLockState().then(({ booted, unlocked }) => {
      if (mounted) {
        setBooted(booted);
        setUnlocked(unlocked);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [wallet]);

  if (loading) {
    return null;
  }

  if (!booted) {
    return <Navigate to="/welcome" replace />;
  }

  if (!unlocked) {
    return <Navigate to="/unlock" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
