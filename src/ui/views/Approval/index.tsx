import { Box } from '@mui/system';
import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { LLConnectLoading } from '@/ui/FRWComponent/LLConnectLoading';
import { isDomainBlocked } from '@/ui/views/Approval/blockList';
import { useWallet, useApproval, useWalletLoaded } from 'ui/utils';

// import Header from '../Dashboard/Header';

import * as ApprovalComponent from './components';
import Block from './components/Block';

// import ApprovalHeader from './ApprovalHeader';

const Approval = () => {
  const history = useHistory();
  // const [account, setAccount] = useState('');
  const usewallet = useWallet();
  const [getApproval, resolveApproval, rejectApproval] = useApproval();
  const [approval, setApproval] = useState<null | Awaited<ReturnType<typeof getApproval>>>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [host, setHost] = useState('');
  const init = useCallback(async () => {
    // initializeStore();
    const approval = await getApproval();
    setIsLoading(true);
    if (!approval) {
      history.replace('/');
      return null;
    }

    // First check if the domain is blocked
    let domainBlocked = false;
    let blockedHost = '';
    if (approval.origin || approval.params.origin) {
      const originHost = approval.origin || approval.params.origin || '';
      const isBlocked = await isDomainBlocked(originHost);

      if (isBlocked) {
        domainBlocked = true;
        blockedHost = originHost;
      }
    } else if (!domainBlocked && chrome.tabs) {
      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: false,
        });

        const targetTab = tabs.filter((item) => item.id === approval.params.tabId);

        if (targetTab[0]?.url) {
          const tabHost = new URL(targetTab[0].url).host;
          const isBlocked = await isDomainBlocked(tabHost);

          if (isBlocked) {
            domainBlocked = true;
            blockedHost = tabHost;
          }
        }
      } catch (error) {
        console.error('Error checking tabs:', error);
      }
    }

    if (domainBlocked) {
      setIsBlocked(true);
      setHost(blockedHost);
    }

    setIsLoading(false);

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
      {isLoading ? (
        <LLConnectLoading logo={approval?.params?.icon} />
      ) : isBlocked ? (
        <Block host={host} />
      ) : (
        <>
          {approval && (
            <CurrentApprovalComponent params={params} origin={origin} requestDefer={requestDefer} />
          )}
        </>
      )}
    </Box>
  );
};

export default Approval;
