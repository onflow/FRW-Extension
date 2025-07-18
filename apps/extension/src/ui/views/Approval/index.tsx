import { Box } from '@mui/system';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { useApproval } from '@/ui/hooks/use-approval';
import { useWallet } from '@/ui/hooks/use-wallet';

// import Header from '../Dashboard/Header';

import * as ApprovalComponent from './components';
// import ApprovalHeader from './ApprovalHeader';

const Approval = () => {
  const navigate = useNavigate();
  // const [account, setAccount] = useState('');
  const usewallet = useWallet();
  const [getApproval, , rejectApproval] = useApproval();
  const [approval, setApproval] = useState<null | Awaited<ReturnType<typeof getApproval>>>(null);

  const init = useCallback(async () => {
    // initializeStore();
    const approval = await getApproval();
    if (!approval) {
      navigate('/', { replace: true });
      return null;
    }
    setApproval(approval);
    if (approval.origin || approval.params.origin) {
      document.title = approval.origin || approval.params.origin;
    } else if (approval['lock']) {
      navigate('/unlock', { replace: true });
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
  }, [navigate, getApproval, setApproval, usewallet, rejectApproval]);

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
