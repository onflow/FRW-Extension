import { Stack, Box } from '@mui/material';
import * as fcl from '@onflow/fcl';
import React, { useCallback, useEffect, useState } from 'react';

import { MAINNET_CHAIN_ID } from '@/shared/types/network-types';
import { consoleError } from '@/shared/utils/console-log';
import { LLPrimaryButton, LLSecondaryButton } from '@/ui/components';
import { useApproval } from '@/ui/hooks/use-approval';
import { useWallet } from '@/ui/utils/WalletContext';

import { DefaultBlock } from './DefaultBlock';
import { TransactionBlock } from './TransactionBlock';
interface ConnectProps {
  params: any;
}

const EthConfirm = ({ params }: ConnectProps) => {
  const [, resolveApproval, rejectApproval] = useApproval();
  const usewallet = useWallet();
  const [requestParams, setParams] = useState<any>({
    method: '',
    data: [],
    origin: '',
    name: '',
    icon: '',
  });

  const [lilicoEnabled, setLilicoEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [decodedCall, setDecodedCall] = useState<DecodedCall | null>(null);

  interface DecodedParam {
    name?: string;
    value: string;
  }

  interface DecodedFunction {
    function: string;
    params: string[];
  }

  interface DecodedData {
    name?: string;
    params?: DecodedParam[];
    allPossibilities?: DecodedFunction[];
  }

  interface DecodedCall {
    abi: any[];
    name: string;
    is_verified: boolean;
    decodedData: DecodedData;
    status?: number;
  }

  const extractData = useCallback(
    async (obj) => {
      if (!obj) return;
      const { method = '', data = [], session: { origin = '', name = '', icon = '' } = {} } = obj;
      const params = { origin, name, icon, method, data };
      setParams(params);
      try {
        if (!data[0]?.data) return;

        const res = await usewallet.decodeEvmCall(data[0].data, data[0].to);
        if (res.status === 200) {
          const { abi, status, ...decodedData } = res;
          setDecodedCall(decodedData);
        }
      } catch (error) {
        consoleError('Error extracting data:', error);
      }
    },
    [usewallet]
  );

  const handleCancel = () => {
    rejectApproval('User rejected the request.');
  };

  const handleAllow = async () => {
    await checkCoa();
    resolveApproval({
      defaultChain: MAINNET_CHAIN_ID,
      signPermission: 'MAINNET_AND_TESTNET',
    });
  };

  const loadPayer = useCallback(async () => {
    const isEnabled = await usewallet.allowLilicoPay();
    setLilicoEnabled(isEnabled);
  }, [usewallet]);

  const checkCoa = async () => {
    setLoading(true);
    try {
      const isEnabled = await usewallet.checkCoaLink();
      if (isEnabled) return;

      const result = await usewallet.coaLink();
      const res = await fcl.tx(result).onceSealed();
      const transactionExecutedEvent = res.events.find((event) =>
        event.type.includes('TransactionExecuted')
      );
      if (transactionExecutedEvent) return;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params) {
      loadPayer();
      extractData(params);
    }
  }, [loadPayer, extractData, params]);

  return (
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
        {requestParams.method === 'personal_sign' ? (
          <DefaultBlock
            title={requestParams.name || ''}
            host={requestParams.origin || ''}
            data={requestParams.data || []}
            logo={requestParams.icon || ''}
          />
        ) : (
          <TransactionBlock
            title={requestParams.name || ''}
            data={requestParams.data || []}
            logo={requestParams.icon || ''}
            lilicoEnabled={lilicoEnabled}
            decodedCall={decodedCall}
          />
        )}

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
  );
};

export default EthConfirm;
