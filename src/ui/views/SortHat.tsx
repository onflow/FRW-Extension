import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router';

import Spin from '@/ui/components/Spin';
import { useApproval } from '@/ui/hooks/use-approval';
import { useWallet, useWalletLoaded } from '@/ui/hooks/use-wallet';
import { getUiType } from '@/ui/utils';
import { openInternalPageInTab } from '@/ui/utils/webapi';

const SortHat = () => {
  const wallet = useWallet();
  const walletLoaded = useWalletLoaded();
  const [to, setTo] = useState('');
  // eslint-disable-next-line prefer-const
  let [getApproval, , rejectApproval] = useApproval();

  const loadView = useCallback(async () => {
    const UIType = getUiType();
    const isInNotification = UIType.isNotification;
    const isInTab = UIType.isTab;

    let approval = await getApproval();
    if (!wallet) {
      setTo('/unlock');
    }

    if (isInNotification && !approval) {
      window.close();
      return;
    }

    if (!isInNotification) {
      // chrome.window.windowFocusChange won't fire when
      // click popup in the meanwhile notification is present
      await rejectApproval();
      approval = undefined;
    }

    // For fresh installation, go to welcome page regardless of popup/tab mode
    if (!(await wallet.isBooted())) {
      if (isInTab) {
        setTo('/welcome');
      } else {
        openInternalPageInTab('welcome');
      }
      return;
    }

    if (!(await wallet.isUnlocked())) {
      setTo('/unlock');
      return;
    }

    // if ((await wallet.hasPageStateCache()) && !isInNotification && !isInTab) {
    //   const cache = await wallet.getPageStateCache()!;
    //   setTo(cache.path);
    //   return;
    // }

    const currentAccount = await wallet.getCurrentAccount();

    if (!currentAccount) {
      setTo('/welcome');
    } else if (approval) {
      setTo('/approval');
    } else {
      setTo('/dashboard');
    }
  }, [getApproval, rejectApproval, wallet]);

  useEffect(() => {
    if (walletLoaded) {
      loadView();
    }
  }, [loadView, walletLoaded]);

  return (
    // <Box sx={{}}>

    // </Box>
    // <LLSpinner size={40}>{to && <Redirect to={to} />}</LLSpinner>
    <Spin spinning={!to}>{to && <Navigate to={to} replace />}</Spin>
    // <Spin />
  );
};

export default SortHat;
