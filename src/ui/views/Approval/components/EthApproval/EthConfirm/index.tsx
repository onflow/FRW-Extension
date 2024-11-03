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
import * as secp from '@noble/secp256k1';
import { SHA3 } from 'sha3';
import { DefaultBlock } from './DefaultBlock';
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

const EthConfirm = ({ params }: ConnectProps) => {
  const [, resolveApproval, rejectApproval, linkningConfirm] = useApproval();
  const { t } = useTranslation();
  const wallet = useWallet();
  const [signable, setSignable] = useState<Signable | null>(null);
  // const [payerSignable, setPayerSignable] = useState<Signable | null>(null);
  const [opener, setOpener] = useState<number | undefined>(undefined)
  const [host, setHost] = useState(null)
  const [cadenceArguments, setCadenceArguments] = useState<any[]>([]);
  const [requestParams, setParams] = useState<any>({
    method: "",
    data: [],
    origin: "",
    name: "",
    icon: ""
  })
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
  const [loading, setLoading] = useState(false);

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


  const extractData = (obj) => {
    console.log('obj ', obj)
    try {
      const {
        method = "",
        data = [],
        session: {
          origin = "",
          name = "",
          icon = ""
        } = {}
      } = obj;

      const params = { origin, name, icon, method, data };
      setParams(params);
    } catch (error) {
      console.error("Error extracting data:", error);
      setParams({ origin: "", name: "", icon: "", method: "", data: [] });
    }
  };

  const handleCancel = () => {
    rejectApproval('User rejected the request.');
  };

  const handleAllow = async () => {
    await checkCoa();
    resolveApproval({
      defaultChain: 646,
      signPermission: 'MAINNET_AND_TESTNET',
    });
  };

  const loadPayer = async () => {
    const isEnabled = await wallet.allowLilicoPay()
    setLilicoEnabled(isEnabled)
  }


  const checkCoa = async () => {
    setLoading(true);
    const isEnabled = await wallet.checkCoaLink();
    if (!isEnabled) {
      const result = await wallet.coaLink();
      const res = await fcl.tx(result).onceSealed();
      const transactionExecutedEvent = res.events.find(event => event.type.includes("TransactionExecuted"));
      if (transactionExecutedEvent) {
        setLoading(false);
        return
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    if (params) {
      loadPayer();
      extractData(params);
    }
  }, []);


  return (
    <ThemeProvider theme={theme}>
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
            overflowY: 'auto', // Enable scrolling
            scrollbarWidth: 'none', // Hide scrollbar for Firefox
            '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar for Chrome, Safari, and Edge
          }}
        >
          <DefaultBlock
            title={requestParams.name || ''}
            host={requestParams.origin || ''}
            auditor={auditor}
            expanded={expanded}
            data={requestParams.data || []}
            method={requestParams.method || ''}
            logo={requestParams.icon || ''}
            setExpanded={setExpanded}
            dedent={dedent}
            lilicoEnabled={lilicoEnabled}
          />

          {/* Push the button stack to the bottom */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Sticky button group at the bottom */}
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              padding: '16px 0 0',
            }}
          >
            <Stack direction="row" spacing={1} sx={{ paddingBottom: '32px' }}>
              <LLSecondaryButton
                label={chrome.i18n.getMessage('Cancel')}
                fullWidth
                onClick={handleCancel}
              />
              {!loading ? (
                <LLPrimaryButton
                  label={chrome.i18n.getMessage('Approve')}
                  fullWidth
                  type="submit"
                  onClick={handleAllow}
                />
              ) : (
                <LLSecondaryButton label={chrome.i18n.getMessage('Loading')} fullWidth />
              )}
            </Stack>
          </Box>
        </Box>
      )}
    </ThemeProvider>


  );
};

export default EthConfirm;
