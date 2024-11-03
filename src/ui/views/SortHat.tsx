import React from 'react';
import { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useWallet, getUiType, useApproval } from 'ui/utils';
import { openInternalPageInTab } from 'ui/utils/webapi';
import { Spin } from 'ui/component';

const SortHat = () => {
  const wallet = useWallet();
  const [to, setTo] = useState('');
  // eslint-disable-next-line prefer-const
  let [getApproval, , rejectApproval] = useApproval();

  const loadView = async () => {
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

    if (!(await wallet.isBooted())) {
      openInternalPageInTab('welcome');
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
  };

  useEffect(() => {
    loadView();
  }, []);

  return (
  // <Box sx={{}}>

  // </Box>
  // <LLSpinner size={40}>{to && <Redirect to={to} />}</LLSpinner>
    <Spin spinning={!to}>{to && <Redirect to={to} />}</Spin>
  // <Spin />
  );
};

export default SortHat;
