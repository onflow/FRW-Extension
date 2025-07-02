import { Stack, Box } from '@mui/material';
import * as fcl from '@onflow/fcl';
import dedent from 'dedent';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type UserInfoResponse } from '@/shared/types/network-types';
import {
  LLPrimaryButton,
  LLSecondaryButton,
  LLConnectLoading,
  LLLinkingLoading,
} from '@/ui/components';
import { useApproval } from '@/ui/hooks/use-approval';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useWallet } from '@/ui/utils/WalletContext';

// import { CHAINS_ENUM } from 'consts';

import './github-dark-dimmed.css';

import { DefaultBlock } from './DefaultBlock';
import { LinkingBlock } from './LinkingBlock';
import ShowSwitch from './ShowSwitch';

interface ConnectProps {
  params: any;
  // onChainChange(chain: CHAINS_ENUM): void;
  // defaultChain: CHAINS_ENUM;
}

const Confirmation = ({ params: { icon, origin, tabId, type } }: ConnectProps) => {
  const [, resolveApproval, rejectApproval, linkningConfirm] = useApproval();
  const { t } = useTranslation();
  const wallet = useWallet();
  const [signable, setSignable] = useState<Signable | null>(null);
  // const [payerSignable, setPayerSignable] = useState<Signable | null>(null);
  const [opener, setOpener] = useState<number | undefined>(undefined);
  const [host, setHost] = useState(null);
  const [cadenceArguments, setCadenceArguments] = useState<any[]>([]);
  const [cadenceScript, setCadenceScript] = useState<string>('');
  const [approval, setApproval] = useState(false);
  const [windowId, setWindowId] = useState<number | undefined>(undefined);
  const [expanded, setExpanded] = useState(false);
  const [linkingDone, setLinkingDone] = useState(false);
  const [accountLinking, setAccountLinking] = useState(false);
  const [accountArgs, setAccountArgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lilicoEnabled, setLilicoEnabled] = useState(true);
  const [auditor, setAuditor] = useState<any>(null);
  const [image, setImage] = useState<string>('');
  const [accountTitle, setAccountTitle] = useState<string>('');
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [title, setTitle] = useState('');

  // TODO: replace default logo
  const [logo, setLogo] = useState('');
  const { network: currentNetwork } = useNetwork();
  const [msgNetwork, setMsgNetwork] = useState('testnet');
  const [showSwitch, setShowSwitch] = useState(false);

  interface Roles {
    authorizer: boolean;
    payer: boolean;
    proposer: boolean;
  }
  interface Signable {
    cadence: string;
    message: string;
    addr: string;
    keyId: number;
    roles: Roles;
    voucher: Voucher;
    f_type: string;
  }
  interface Voucher {
    refBlock: string;
    payloadSigs: Signature;
  }
  interface Signature {
    address: string;
    keyId: number;
    sig: string | null;
  }

  const getUserInfo = useCallback(async () => {
    const userResult = await wallet.getUserInfo(false);
    await setUserInfo(userResult);
  }, [wallet]);

  const fetchTxInfo = useCallback(
    async (cadence: string) => {
      // const account = await wallet.getCurrentAccount();
      const network = await wallet.getNetwork();
      const result = await wallet.openapi.getTransactionTemplate(cadence, network);
      if (result !== null) {
        setAuditor(result);
        setExpanded(false);
      }
    },
    [wallet]
  );

  const handleCancel = useCallback(() => {
    if (opener) {
      if (windowId) {
        chrome.windows.update(windowId, { focused: true });
        chrome.tabs.update(opener, { active: true });
      }
      chrome.tabs.sendMessage(opener, {
        f_type: 'PollingResponse',
        f_vsn: '1.0.0',
        status: 'DECLINED',
        reason: 'User rejected the request.',
      });
      chrome.tabs.sendMessage(opener, { type: 'FCL:VIEW:CLOSE' });
      setApproval(false);
      rejectApproval('User rejected the request.');
    }
  }, [opener, windowId, rejectApproval]);

  const fclCallback = useCallback(
    (data) => {
      if (typeof data !== 'object') return;
      if (data.type !== 'FCL:VIEW:READY:RESPONSE') return;
      const newSignable: Signable = data.body;
      const hostname = data.config?.client?.hostname;
      if (hostname) {
        setHost(hostname);
      }
      setImage(data.config.app.icon);
      setAccountTitle(data.config.app.title);
      const firstLine = newSignable.cadence.trim().split('\n')[0];

      const isAccountLinking = firstLine.includes('#allowAccountLinking');
      setAccountLinking(isAccountLinking);
      if (isAccountLinking) {
        setAccountArgs(newSignable['args']);
      }
      setSignable(newSignable);
      getUserInfo();

      fetchTxInfo(newSignable.cadence);
    },
    [fetchTxInfo, getUserInfo]
  );

  const sendAuthzToFCL = async () => {
    if (!signable) {
      return;
    }

    setApproval(true);
    const signedMessage = await wallet.signMessage(signable.message);
    if (opener) {
      sendSignature(signable, signedMessage);
      const value = await sessionStorage.getItem('pendingRefBlockId');
      // consoleLog('pendingRefBlockId ->', value);
      if (value !== null) {
        return;
      }
      sessionStorage.setItem('pendingRefBlockId', signable.voucher.refBlock);

      if (lilicoEnabled) {
        chrome.tabs.sendMessage(opener, { type: 'FCL:VIEW:READY' });
      } else {
        setApproval(true);
        resolveApproval();
      }
    }
  };

  const sendSignature = useCallback(
    (signable, signedMessage) => {
      if (opener) {
        chrome.tabs.sendMessage(opener, {
          f_type: 'PollingResponse',
          f_vsn: '1.0.0',
          status: 'APPROVED',
          reason: null,
          data: new fcl.WalletUtils.CompositeSignature(
            signable.addr,
            signable.keyId,
            signedMessage
          ),
        });
      }
    },
    [opener]
  );

  const signPayer = useCallback(
    async (signable) => {
      setIsLoading(true);
      const value = await sessionStorage.getItem('pendingRefBlockId');

      if (signable.roles.payer !== true) {
        return;
      }

      if (signable.voucher.refBlock !== value) {
        return;
      }

      try {
        const signedMessage = await wallet.signPayer(signable);
        sendSignature(signable, signedMessage);
        setApproval(true);

        resolveApproval();
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        handleCancel();
      }
    },
    [wallet, sendSignature, resolveApproval, handleCancel, setIsLoading]
  );

  const loadPayer = useCallback(async () => {
    const isEnabled = await wallet.allowLilicoPay();
    setLilicoEnabled(isEnabled);
  }, [wallet]);

  const checkNetwork = useCallback(async () => {
    if (msgNetwork !== currentNetwork && msgNetwork) {
      setShowSwitch(true);
    } else {
      setShowSwitch(false);
    }
  }, [msgNetwork, currentNetwork]);

  useEffect(() => {
    loadPayer();
    checkNetwork();

    return () => {
      sessionStorage.removeItem('pendingRefBlockId');

      // @ts-ignore
      chrome.storage.session?.remove('pendingRefBlockId');
    };
  }, [loadPayer, checkNetwork]);

  useEffect(() => {
    if (lilicoEnabled && signable && signable.message && approval) {
      signPayer(signable);
    }
  }, [approval, lilicoEnabled, signPayer, signable]);

  useEffect(() => {
    if (chrome.tabs) {
      chrome.tabs
        .query({
          active: true,
          currentWindow: false,
        })
        .then((tabs) => {
          const targetTab = tabs.filter((item) => item.id === tabId);

          let host = '';
          if (targetTab[0].url) {
            host = new URL(targetTab[0].url).host;
          }
          setWindowId(targetTab[0].windowId);
          //  setTabId(tabs[0].index)
          setLogo(targetTab[0].favIconUrl || '');
          setTitle(targetTab[0].title || '');
          setOpener(targetTab[0].id);
          chrome.tabs.sendMessage(targetTab[0].id || 0, { type: 'FCL:VIEW:READY' });
        });
    }

    const extMessageHandler = (msg, sender, sendResponse) => {
      if (msg.type === 'FCL:VIEW:READY:RESPONSE') {
        if (msg.host) {
          setHost(msg.host);
        }
        if (msg.config?.app?.title) {
          setTitle(msg.config.app.title);
        }
        if (msg.config?.app?.icon) {
          setLogo(msg.config.app.icon);
        }
        if (msg.body?.cadence) {
          setCadenceScript(msg.body.cadence);
        }
        if (msg.body?.args?.length > 0) {
          setCadenceArguments(msg.body.args);
        }
        if (msg.config?.client?.network) {
          setMsgNetwork(msg.config.client.network);
        }
        fclCallback(JSON.parse(JSON.stringify(msg || {})));
      }

      sendResponse({ status: 'ok' });
      return true;
    };

    chrome.runtime?.onMessage.addListener(extMessageHandler);

    return () => {
      chrome.runtime?.onMessage.removeListener(() => {});
    };
  }, [fclCallback, tabId]);

  window.onbeforeunload = () => {
    if (!approval) {
      handleCancel();
    }
  };

  return (
    <>
      {showSwitch ? (
        <ShowSwitch
          currentNetwork={currentNetwork}
          msgNetwork={msgNetwork}
          onCancel={handleCancel}
        />
      ) : (
        <>
          {isLoading ? (
            <Box>
              {accountLinking ? (
                <LLLinkingLoading
                  linkingDone={linkingDone}
                  image={image}
                  accountTitle={accountTitle}
                  userInfo={userInfo}
                />
              ) : (
                <LLConnectLoading logo={logo} />
              )}
              {/* <LLConnectLoading logo={logo} /> */}
            </Box>
          ) : (
            <Box
              sx={{
                margin: '18px 18px 0px 18px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '12px',
                height: '100%',
                background: accountLinking
                  ? 'linear-gradient(0deg, #121212, #32484C)'
                  : 'linear-gradient(0deg, #121212, #11271D)',
              }}
            >
              {accountLinking ? (
                <LinkingBlock image={image} accountTitle={accountTitle} userInfo={userInfo} />
              ) : (
                <DefaultBlock
                  title={title}
                  host={host}
                  auditor={auditor}
                  expanded={expanded}
                  lilicoEnabled={lilicoEnabled}
                  cadenceArguments={cadenceArguments}
                  logo={logo}
                  cadenceScript={cadenceScript}
                  setExpanded={setExpanded}
                  dedent={dedent}
                />
              )}
              <Box sx={{ flexGrow: 1 }} />
              <Stack direction="row" spacing={1} sx={{ paddingBottom: '32px' }}>
                <LLSecondaryButton
                  label={chrome.i18n.getMessage('Cancel')}
                  fullWidth
                  onClick={handleCancel}
                />
                <LLPrimaryButton
                  label={chrome.i18n.getMessage('Approve')}
                  fullWidth
                  type="submit"
                  onClick={sendAuthzToFCL}
                />
              </Stack>
            </Box>
          )}
        </>
      )}
    </>
  );
};

export default Confirmation;
