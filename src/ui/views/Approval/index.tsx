import { Box } from '@mui/system';
import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

// import { useInitHook } from '@/ui/hooks';
import { useWallet, useApproval, useWalletLoaded } from 'ui/utils';

// import Header from '../Dashboard/Header';

import * as ApprovalComponent from './components';
// import ApprovalHeader from './ApprovalHeader';

const Approval = () => {
  const history = useHistory();
  // const [account, setAccount] = useState('');
  const usewallet = useWallet();
  // const { initializeStore } = useInitHook();
  const [getApproval, resolveApproval, rejectApproval] = useApproval();
  const [approval, setApproval] = useState<null | Awaited<ReturnType<typeof getApproval>>>(null);

  const init = useCallback(async () => {
    // initializeStore();
    const approval = await getApproval();
    if (!approval) {
      history.replace('/');
      return null;
    }
    setApproval(approval);
    if (approval.origin || approval.params.origin) {
      document.title = approval.origin || approval.params.origin;
    } else if (approval['lock']) {
      history.replace('/unlock');
      return;
    }
    const account = await usewallet.getCurrentAccount();
    if (!account) {
      rejectApproval();
      return;
    } else if (!approval.approvalComponent) {
      rejectApproval();
      return;
    }
  }, [history, getApproval, setApproval, usewallet, rejectApproval]);

  useEffect(() => {
    init();
  }, [init]);

  if (!approval) return <></>;
  const { approvalComponent, params, origin, requestDefer } = approval;
  const CurrentApprovalComponent = ApprovalComponent[approvalComponent];

  return (
    <Box
      sx={{
        // height: 'calc(100vh - 56px)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* <Header loading={false} /> */}
      {approval && (
        <CurrentApprovalComponent params={params} origin={origin} requestDefer={requestDefer} />
      )}
    </Box>
  );
};

export default Approval;
