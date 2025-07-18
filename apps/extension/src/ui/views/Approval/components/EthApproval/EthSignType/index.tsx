import { Box, Stack, Typography } from '@mui/material';
import * as fcl from '@onflow/fcl';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  MAINNET_CHAIN_ID,
  TESTNET_CHAIN_ID,
  type UserInfoResponse,
} from '@onflow/flow-wallet-shared/types/network-types';
import { isValidEthereumAddress } from '@onflow/flow-wallet-shared/utils/address';

import {
  LLConnectLoading,
  LLLinkingLoading,
  LLPrimaryButton,
  LLSecondaryButton,
} from '@/ui/components';
import { useApproval } from '@/ui/hooks/use-approval';
import { useWallet } from '@/ui/hooks/use-wallet';
import { formatAddress } from '@/ui/utils';

import IconWithPlaceholder from '../EthApprovalComponents/IconWithPlaceholder';
interface ConnectProps {
  params: any;
}

const EthSignType = ({ params }: ConnectProps) => {
  const [, resolveApproval, rejectApproval, linkningConfirm] = useApproval();
  const { t } = useTranslation();
  const wallet = useWallet();
  const [signable, setSignable] = useState<Signable | null>(null);
  // const [payerSignable, setPayerSignable] = useState<Signable | null>(null);
  const [opener, setOpener] = useState<number | undefined>(undefined);
  const [host, setHost] = useState(null);
  const [cadenceArguments, setCadenceArguments] = useState<any[]>([]);
  const [linkingDone, setLinkingDone] = useState(false);
  const [accountLinking, setAccountLinking] = useState(false);
  const [accountArgs, setAccountArgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lilicoEnabled, setLilicoEnabled] = useState(true);
  const [messages, setMessages] = useState<any>(null);
  const [image, setImage] = useState<string>('');
  const [accountTitle, setAccountTitle] = useState<string>('');
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);

  // TODO: replace default logo
  const [logo, setLogo] = useState('');
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

  const extractData = useCallback(() => {
    let data = '';
    let address = '';

    if (isValidEthereumAddress(params.data.params[0])) {
      data = params.data.params[1];
      address = params.data.params[0];
    } else {
      data = params.data.params[0];
      address = params.data.params[1];
    }
    const jsonObject = JSON.parse(data);
    setMessages(jsonObject);
  }, [params]);

  const handleCancel = () => {
    rejectApproval('User rejected the request.');
  };

  const handleAllow = async () => {
    await checkCoa();
    const network = await wallet.getNetwork();
    resolveApproval({
      defaultChain: network === 'testnet' ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID,
      signPermission: 'MAINNET_AND_TESTNET',
    });
  };

  const checkCoa = async () => {
    setLoading(true);
    const isEnabled = await wallet.checkCoaLink();
    if (!isEnabled) {
      const result = await wallet.coaLink();
      const res = await fcl.tx(result).onceSealed();
      const transactionExecutedEvent = res.events.find((event) =>
        event.type.includes('TransactionExecuted')
      );
      if (transactionExecutedEvent) {
        setLoading(false);
        return;
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (params) {
      extractData();
    }
  }, [extractData, params]);

  const JsonRenderer = ({ data }) => {
    // Recursive function to render objects, including arrays and nested objects
    const renderMessageContent = (messageObj, isChild = false) => {
      return Object.keys(messageObj).map((key) => {
        const value = messageObj[key];

        // Check if the value is an object and not an array
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          return (
            <Box key={key} sx={{}}>
              <Box
                sx={{
                  backgroundColor: 'var(--Special-Color-Line, rgba(255, 255, 255, 0.12))',
                  height: '1px',
                  marginY: '8px',
                }}
              ></Box>
              <Typography sx={{ fontWeight: '400', color: '#FFFFFFCC', fontSize: '14px' }}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Typography>
              {renderMessageContent(value, true)}
            </Box>
          );
        } else if (Array.isArray(value)) {
          // If the value is an array, render each item
          return (
            <Box key={key} sx={{}}>
              <Box
                sx={{
                  backgroundColor: 'var(--Special-Color-Line, rgba(255, 255, 255, 0.12))',
                  height: '1px',
                  marginY: '8px',
                }}
              ></Box>
              <Typography sx={{ fontWeight: '400', color: '#FFFFFFCC', fontSize: '14px' }}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Typography>
              {value.map((item, index) => {
                // If array item is an object, render its content
                if (typeof item === 'object' && item !== null) {
                  return (
                    <Box
                      key={index}
                      sx={{
                        backgroundColor: '#2C2C2C',
                        padding: '16px',
                        borderRadius: '12px',
                        marginY: '16px',
                      }}
                    >
                      <Typography sx={{ fontWeight: '400', color: '#FFFFFF66', fontSize: '14px' }}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} Item {index + 1}
                      </Typography>
                      {renderMessageContent(item, true)}
                    </Box>
                  );
                } else {
                  // If array item is a string
                  return (
                    <Box
                      key={index}
                      sx={{
                        backgroundColor: '#2C2C2C',
                        padding: '8px',
                        borderRadius: '8px',
                        marginY: '8px',
                        wordWrap: 'break-word',
                        wordBreak: 'break-all',
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: '400',
                          color: '#FFFFFFCC',
                          fontSize: '14px',
                          whiteSpace: 'normal',
                        }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  );
                }
              })}
            </Box>
          );
        } else {
          // If it's not an object or array, render the key and value directly
          return (
            <Box key={key}>
              <Box display="flex" justifyContent="space-between" sx={{ padding: '0' }}>
                <Typography
                  sx={{
                    fontWeight: '400',
                    color: `${isChild ? '#FFFFFF66' : '#FFFFFFCC'}`,
                    fontSize: '14px',
                  }}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Typography>
                <Typography sx={{ color: '#FFFFFFCC', fontSize: '14px' }}>
                  {formatAddress(value)}
                </Typography>
              </Box>
            </Box>
          );
        }
      });
    };

    return (
      <Box sx={{ marginBottom: '8px' }}>
        <Box display="flex" justifyContent="space-between">
          <Typography sx={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFFCC' }}>
            Message
          </Typography>
          <Typography sx={{ color: '#FFFFFFCC', fontSize: '14px' }}></Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" sx={{ marginBottom: '8px' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: '400', color: '#FFFFFF66' }}>
            Primary Type
          </Typography>
          <Typography sx={{ color: '#FFFFFFCC', fontSize: '14px' }}>{data.primaryType}</Typography>
        </Box>
        {renderMessageContent(data.message)}
      </Box>
    );
  };

  return (
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
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Box
            sx={{
              margin: '18px 18px',
              padding: '18px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '12px',
              background:
                'linear-gradient(180deg, rgba(255, 255, 255, 0.10) 0%, rgba(40, 40, 40, 0.00) 88.24%)',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {params.session && (
              <Box sx={{ marginBottom: '2px', display: 'flex' }}>
                <IconWithPlaceholder imageUrl={params.session.icon} />
                <Box sx={{ marginLeft: '16px' }}>
                  <Typography sx={{ fontSize: '12px', color: '#737373' }}>
                    Sign Type Message from
                  </Typography>
                  <Typography sx={{ fontSize: '18px', color: '#FFFFFF', fontWeight: '700' }}>
                    {params.session.name}
                  </Typography>
                </Box>
              </Box>
            )}

            {messages && <JsonRenderer data={messages} />}
            <Box sx={{ flexGrow: 1 }} />
          </Box>
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              padding: '18px',
            }}
          >
            <Stack direction="row" spacing={1}>
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
    </>
  );
};

export default EthSignType;
