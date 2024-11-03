import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApproval, useWallet } from 'ui/utils';
// import { CHAINS_ENUM } from 'consts';
import { ThemeProvider } from '@mui/system';
import { Stack, Box, Typography, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import theme from 'ui/style/LLTheme';
import * as fcl from '@onflow/fcl';
import {
  LLPrimaryButton,
  LLSecondaryButton,
} from 'ui/FRWComponent';
import Highlight from 'react-highlight';
import './github-dark-dimmed.css';
import * as secp from '@noble/secp256k1';
import { SHA3 } from 'sha3';
import IconFlow from '../../../../components/iconfont/IconFlow';
import { DefaultBlock } from './DefaultBlock';
import { LinkingBlock } from './LinkingBlock';
import { LLConnectLoading, LLLinkingLoading } from '@/ui/FRWComponent';
import { UserInfoResponse } from 'background/service/networkModel';
import dedent from 'dedent';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import { Presets } from 'react-component-transition';

interface ConnectProps {
  params: any;
  // onChainChange(chain: CHAINS_ENUM): void;
  // defaultChain: CHAINS_ENUM;
}

const Confimation = ({ params: { icon, origin, tabId, type } }: ConnectProps) => {
  const [, resolveApproval, rejectApproval, linkningConfirm] = useApproval();
  const { t } = useTranslation();
  const wallet = useWallet();
  const [signable, setSignable] = useState<Signable | null>(null);
  // const [payerSignable, setPayerSignable] = useState<Signable | null>(null);
  const [opener, setOpener] = useState<number | undefined>(undefined)
  const [host, setHost] = useState(null)
  const [cadenceArguments, setCadenceArguments] = useState<any[]>([]);
  const [cadenceScript, setCadenceScript] = useState<string>('')
  const [approval, setApproval] = useState(false)
  const [windowId, setWindowId] = useState<number | undefined>(undefined)
  const [expanded, setExpanded] = useState(false);
  const [linkingDone, setLinkingDone] = useState(false);
  const [accountLinking, setAccountLinking] = useState(false);
  const [accountArgs, setAccountArgs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false);
  const [lilicoEnabled, setLilicoEnabled] = useState(true);
  const [auditor, setAuditor] = useState<any>(null);
  const [image, setImage] = useState<string>('')
  const [accountTitle, setAccountTitle] = useState<string>('')
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null)
  const [title, setTitle] = useState('')

  // TODO: replace default logo
  const [logo, setLogo] = useState('')
  interface Roles {
    authorizer: boolean,
    payer: boolean,
    proposer: boolean,
  }
  interface Signable {
    cadence: string,
    message: string,
    addr: string,
    keyId: number,
    roles: Roles,
    voucher: Voucher
    f_type: string,
  }
  interface Voucher {
    refBlock: string
    payloadSigs: Signature
  }
  interface Signature {
    address: string,
    keyId: number,
    sig: string | null
  }



  const getUserInfo = async () => {
    const userResult = await wallet.getUserInfo(false);
    await setUserInfo(userResult);
  }

  // useEffect(() => {
  //   getUserInfo();
  //   const index = accountArgs.findIndex(item => item.value.includes('.jpg'));
  //   console.log(' accountArgs ', data);
  //   if (accountArgs[index]) {
  //     setImage(accountArgs[index].value)
  //     setAccountTitle(accountArgs[4].value)
  //   }
  // }, [accountArgs])


  const fetchTxInfo = async (cadence: string) => {
    // const account = await wallet.getCurrentAccount();
    const network = await wallet.getNetwork();
    const result = await wallet.openapi.getTransactionTemplate(cadence, network)
    if (result != null) {
      setAuditor(result)
      setExpanded(false)
    }
  };

  const handleCancel = () => {
    if (opener) {
      if (windowId) {
        chrome.windows.update(windowId, { focused: true })
        chrome.tabs.update(opener, { active: true })
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
  };

  const fclCallback = (data) => {
    if (typeof data != 'object') return;
    if (data.type !== 'FCL:VIEW:READY:RESPONSE') return;
    const newSignable: Signable = data.body;
    const hostname = data.config?.client?.hostname;
    hostname && setHost(hostname);
    setImage(data.config.app.icon)
    setAccountTitle(data.config.app.title)
    const firstLine = newSignable.cadence.trim().split('\n')[0];

    const isAccountLinking = firstLine.includes('#allowAccountLinking');
    setAccountLinking(isAccountLinking);
    if (isAccountLinking) {
      setAccountArgs(newSignable['args']);

    }
    setSignable(newSignable);
    getUserInfo();

    fetchTxInfo(newSignable.cadence);
  }


  const sendAuthzToFCL = async () => {
    console.log('sendAuthzToFCL ==>', signable)
    if (!signable) {
      return
    }

    setApproval(true);
    const signedMessage = await wallet.signMessage(signable.message);

    // console.log('signedMessage ->', opener, lilicoEnabled)
    // console.log('signedMessage ->', signedMessage)
    if (opener) {
      sendSignature(signable, signedMessage)
      const value = await sessionStorage.getItem('pendingRefBlockId')
      // console.log('pendingRefBlockId ->', value);
      if (value !== null) {
        return
      }
      sessionStorage.setItem('pendingRefBlockId', signable.voucher.refBlock)

      if (lilicoEnabled) {
        chrome.tabs.sendMessage(opener, { type: 'FCL:VIEW:READY' })
        // const tx = signable.voucher
        // tx.payloadSigs[0].sig = signedMessage
        // const message = sdk.encodeTransactionEnvelope(tx)
        // const payer = await wallet.getPayerAddressAndKeyId()
        // const mockSignable = {voucher: tx, message: message, addr: payer.address, keyId: payer.keyId}
        // // console.log('mockSignable ->', mockSignable)
        // signPayer(mockSignable)
        // sendSignature(mockSignable, payerSig)
        // setApproval(true);
        // resolveApproval();
      } else {
        setApproval(true);
        resolveApproval();
      }
    }
  }

  const sendSignature = (signable, signedMessage) => {
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
  }

  const signPayer = async (signable) => {
    setIsLoading(true);
    const value = await sessionStorage.getItem('pendingRefBlockId')

    console.log('signPayer ->', signable.voucher.refBlock, value, signable.roles.payer);

    if (signable.roles.payer !== true) {
      return;
    }

    if (signable.voucher.refBlock !== value) {
      return
    }

    try {
      const signedMessage = await wallet.signPayer(signable)
      sendSignature(signable, signedMessage)
      setApproval(true);
      // if (accountLinking) {
      //   await linkningConfirm();
      // } else {
      //   resolveApproval();
      //   setIsLoading(false);
      // }
      resolveApproval();
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      handleCancel();
    }
  }

  const loadPayer = async () => {
    const isEnabled = await wallet.allowLilicoPay()
    setLilicoEnabled(isEnabled)
  }

  useEffect(() => {
    loadPayer()

    return () => {
      sessionStorage.removeItem('pendingRefBlockId')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore 
      chrome.storage.session?.remove('pendingRefBlockId')
    }
  }, [])


  useEffect(() => {
    console.log('pendingRefBlockId ->', lilicoEnabled, signable, approval)
    if (lilicoEnabled && signable && signable.message && approval) {
      signPayer(signable)
    }
  }, [signable])

  useEffect(() => {
    chrome.tabs &&
      chrome.tabs.query(
        {
          active: true,
          currentWindow: false,
        }
      ).then((tabs) => {

        const targetTab = tabs.filter(item => item.id == tabId)

        let host = ''
        if (targetTab[0].url) {
          host = new URL(targetTab[0].url).host
        }
        setWindowId(targetTab[0].windowId)
        //  setTabId(tabs[0].index)
        setLogo(targetTab[0].favIconUrl || '')
        setTitle(targetTab[0].title || '')
        setOpener(targetTab[0].id)
        chrome.tabs.sendMessage(targetTab[0].id || 0, { type: 'FCL:VIEW:READY' })
      })

    const extMessageHandler = (msg, sender, sendResponse) => {

      // console.log('extMessageHandler -->', msg);

      if (msg.type === 'FCL:VIEW:READY:RESPONSE') {

        console.log('extMessageHandler -->', msg.type, msg);

        msg.host && setHost(msg.host)
        if (msg.config?.app?.title) {
          setTitle(msg.config.app.title)
        }
        if (msg.config?.app?.icon) {
          setLogo(msg.config.app.icon)
        }
        setCadenceScript(msg.body.cadence)
        if (msg.body?.args?.length > 0) {
          setCadenceArguments(msg.body.args)
        }
        fclCallback(JSON.parse(JSON.stringify(msg || {})))
      }

      // if (msg.msg === 'transferListReceived') {
      //   // DO NOT LISTEN
      //   console.log('FLOW::TX -->', msg.type, msg);
      //   setLinkingDone(true);
      // }
      // if (msg.type === 'FLOW::TX') {
      //   // DO NOT LISTEN
      //   console.log('FLOW::TX -->', msg.type, msg);
      //   // fcl.tx(msg.txId).subscribe(txStatus => {})
      // }
      sendResponse({ status: 'ok' });
      return true
    }

    chrome.runtime?.onMessage.addListener(extMessageHandler)

    return () => {
      chrome.runtime?.onMessage.removeListener(() => {
        console.log('removeListener')
      })
    }
  }, [])

  window.onbeforeunload = () => {
    if (!approval) {
      handleCancel()
    }
  }

  return (
    <ThemeProvider theme={theme}>
      {isLoading ?
        <Box>
          {accountLinking ?
            <LLLinkingLoading
              linkingDone={linkingDone}
              image={image}
              accountTitle={accountTitle}
              userInfo={userInfo}
            /> :
            <LLConnectLoading logo={logo} />
          }
          {/* <LLConnectLoading logo={logo} /> */}
        </Box> :
        <Box sx={{
          margin: '18px 18px 0px 18px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          height: '100%',
          background: accountLinking ? 'linear-gradient(0deg, #121212, #32484C)' : 'linear-gradient(0deg, #121212, #11271D)'
        }}>
          {accountLinking ?
            <LinkingBlock
              image={image}
              accountTitle={accountTitle}
              userInfo={userInfo}
            />
            :
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
          }
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
      }
    </ThemeProvider>
  );
};

export default Confimation;
