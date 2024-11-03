import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useWallet, useApproval } from 'ui/utils';
import * as ApprovalComponent from './components';
import { Box } from '@mui/system';
// import ApprovalHeader from './ApprovalHeader';
import Header from '../Dashboard/Header';

const Approval = () => {
  const history = useHistory();
  // const [account, setAccount] = useState('');
  const wallet = useWallet();
  const [getApproval, resolveApproval, rejectApproval] = useApproval();
  const [approval, setApproval] = useState<any>(null);

  const init = async () => {
    const approval = await getApproval();
    if (!approval) {
      history.replace('/');
      return null;
    }
    console.log('approval ', approval)
    setApproval(approval);
    if (approval.origin || approval.params.origin) {
      document.title = approval.origin || approval.params.origin;
    } else if (approval['lock']){
      history.replace('/unlock');
      return;
    }
    const account = await wallet.getCurrentAccount();
    if (!account) {
      rejectApproval();
      return;
    } else if (!approval.approvalComponent) {
      rejectApproval();
      return;
    }
  };



  const handleCancel = () => {
    rejectApproval();
  };

  const handleAllow = async () => {
    resolveApproval();
  };

  useEffect(() => {
    init();
  }, []);

  if (!approval) return <></>;
  const { approvalComponent, params, origin, requestDefer } = approval;
  const CurrentApprovalComponent = ApprovalComponent[approvalComponent];

  return (
    <Box sx={{
      // height: 'calc(100vh - 56px)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header loading={false} />
      {approval && (
        <CurrentApprovalComponent
          params={params}
          origin={origin}
          requestDefer={requestDefer}
        />
      )}
    </Box>
  );
};

export default Approval;
