import { Box, CardMedia, Divider, Stack, Typography } from '@mui/material';
import { Contract, ethers } from 'ethers';
import React, { useCallback, useEffect, useState } from 'react';

import { EVM_ENDPOINT } from '@onflow/flow-wallet-shared/constant/domain-constants';
import { type CustomFungibleTokenInfo } from '@onflow/flow-wallet-shared/types/coin-types';
import { networkToChainId } from '@onflow/flow-wallet-shared/types/network-types';
import { withPrefix } from '@onflow/flow-wallet-shared/utils/address';
import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import { LLConnectLoading, LLPrimaryButton, LLSecondaryButton } from '@/ui/components';
import { useApproval } from '@/ui/hooks/use-approval';
import { refreshEvmToken } from '@/ui/hooks/use-coin-hooks';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useNetwork } from '@/ui/hooks/useNetworkHook';

// import EthMove from '../EthMove';

const EthSuggest = (data) => {
  const [, resolveApproval, rejectApproval] = useApproval();
  const usewallet = useWallet();
  const [isLoading, setLoading] = useState(false);
  // TODO: replace default logo
  const [logo, setLogo] = useState('');
  const [evmAddress, setEvmAddress] = useState('');
  const [isValidatingAddress, setIsValidatingAddress] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<boolean>(false);
  const [coinInfo, setCoinInfo] = useState<CustomFungibleTokenInfo | null>(null);

  const { network } = useNetwork();
  const addCustom = useCallback(
    async (address) => {
      setLoading(true);
      const contractAddress = withPrefix(address)!.toLowerCase();
      const network = await usewallet.getNetwork();
      const provider = new ethers.JsonRpcProvider(EVM_ENDPOINT[network]);
      const evmAddress = await usewallet.getEvmAddress();
      const ftContract = new Contract(
        contractAddress!,
        [
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function totalSupply() view returns (uint256)',
          'function decimals() view returns (uint8)',
          'function balanceOf(address) view returns (uint)',
        ],
        provider
      );

      // Helper function to handle contract calls
      async function getContractData(contract, method, ...args) {
        try {
          const result = await contract[method](...args);
          if (!result || result === '0x') {
            consoleError(`No data returned for method: ${method}`);
            return null;
          }
          return result;
        } catch (error) {
          consoleError(`Error calling ${method}:`, error);
          return null;
        }
      }

      const decimals = await getContractData(ftContract, 'decimals');
      const name = await getContractData(ftContract, 'name');
      const symbol = await getContractData(ftContract, 'symbol');
      const balance = await ftContract.balanceOf(evmAddress);

      if (decimals !== null && name !== null && symbol !== null) {
        const info: CustomFungibleTokenInfo = {
          chainId: networkToChainId(network),
          symbol,
          name,
          logoURI: '',
          tags: [],
          address: contractAddress?.toLowerCase(),
          decimals: Number(decimals),
          flowIdentifier: await usewallet.getAssociatedFlowIdentifier(contractAddress),
          custom: true,
        };

        setCoinInfo(info);
        setLoading(false);
      } else {
        consoleError('Failed to retrieve all required data for the token.');
        setIsValidatingAddress(false);
        setValidationError(true);
        setLoading(false);
      }
    },
    [usewallet]
  );
  const init = useCallback(async () => {
    const contractAddress = data.params.data.params.options.address;
    addCustom(contractAddress);
  }, [addCustom, data]);

  const importCustom = async () => {
    if (!coinInfo) {
      throw new Error('Coin info is not set');
    }
    try {
      setLoading(true);
      await usewallet.addCustomEvmToken(network, coinInfo);
      refreshEvmToken(network);
      setLoading(false);
    } catch (error) {
      consoleError('Failed to import custom token:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    rejectApproval(false);
  };

  const handleAllow = async () => {
    await importCustom();
    resolveApproval(true);
  };

  useEffect(() => {
    init();
  }, [init]);

  const renderContent = () => (
    <Box sx={{ padingTop: '18px', height: '100vh' }}>
      {isLoading ? (
        <LLConnectLoading logo={logo} />
      ) : (
        <Box
          sx={{
            margin: '18px 18px 0px 18px',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            height: '100%',
            background: 'linear-gradient(0deg, #121212, #11271D)',
          }}
        >
          {coinInfo?.address && (
            <Box sx={{ display: 'flex', flexDirection: 'column', margin: '18px', gap: '18px' }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '0px',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Typography
                  sx={{
                    color: 'var(--text-night-text-1, var(--Basic-foreground-White, #FFF))',
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: 700,
                    letterSpacing: '-0.252px',
                  }}
                >
                  Add Suggested Token
                </Typography>
                <Typography sx={{ fontSize: '14px', fontWeight: '400', color: '#FFFFFFCC' }}>
                  Would you like to import this token?
                </Typography>
              </Box>
              <Divider />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: '#28282A',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CardMedia
                    component="img"
                    image={
                      data.params.data.params.options.image ??
                      'https://lilico.app/placeholder-2.0.png'
                    }
                    sx={{
                      height: '40px',
                      width: '40px',
                      marginRight: '12px',
                      backgroundColor: '#282828',
                      borderRadius: '24px',
                      objectFit: 'cover',
                    }}
                  />
                  <Typography
                    sx={{
                      color: 'var(--text-night-text-1, var(--Basic-foreground-White, #FFF))',
                      fontFamily: 'Inter',
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 700,
                      letterSpacing: '-0.16px',
                    }}
                  >
                    {coinInfo.name}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '16px', fontWeight: '400', color: '#FFFFFF' }}>
                  {coinInfo.symbol}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: 'sticky',
              bottom: '32px',
              padding: '16px 0',
            }}
          >
            <LLSecondaryButton
              label={chrome.i18n.getMessage('Cancel')}
              fullWidth
              onClick={handleCancel}
            />
            <LLPrimaryButton
              label={chrome.i18n.getMessage('Import')}
              fullWidth
              type="submit"
              onClick={handleAllow}
            />
          </Stack>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <Box>{renderContent()}</Box>
    </>
  );
};

export default EthSuggest;
