import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Typography,
  Box,
  IconButton,
  Stack,
  InputBase,
  CircularProgress,
  FormControl,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Contract, ethers } from 'ethers';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';

import { type CustomFungibleTokenInfo } from '@/shared/types/coin-types';
import { networkToChainId } from '@/shared/types/network-types';
import { consoleError } from '@/shared/utils/console-log';
import { refreshEvmToken } from '@/ui/hooks/use-coin-hooks';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { EVM_ENDPOINT } from 'consts';
import { useWallet } from 'ui/utils';

import { withPrefix, isValidEthereumAddress } from '../../../../shared/utils/address';
import { LLPrimaryButton, LLFormHelperText } from '../../../components';

import AddCustomEvmForm from './CustomEvmForm';

const StyledInput = styled(InputBase)(({ theme }) => ({
  zIndex: 1,
  color: theme.palette.text,
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.spacing(2),
  marginTop: '8px',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(2),
    width: '100%',
  },
}));

const AddCustomEvmToken = () => {
  const usewallet = useWallet();
  const history = useHistory();
  const {
    register,
    watch,
    formState: { errors, dirtyFields, isValid },
  } = useForm({
    mode: 'all',
  });
  const enteredAddress = watch('address');
  const [isValidatingAddress, setIsValidatingAddress] = useState<boolean>(false);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [fungibleTokenInfo, setFungibleTokenInfo] = useState<CustomFungibleTokenInfo | undefined>(
    undefined
  );
  const [validationError, setValidationError] = useState<boolean>(false);
  const { network } = useNetwork();

  const checkAddress = async (address: string) => {
    //usewallet controller api
    setIsValidatingAddress(true);
    const validatedResult = isValidEthereumAddress(address);
    setIsValidatingAddress(false);
    return validatedResult;
  };

  const addCustom = async (address: string) => {
    setLoading(true);
    const contractAddress = withPrefix(address)!.toLowerCase();
    const network = await usewallet.getNetwork();
    const provider = new ethers.JsonRpcProvider(EVM_ENDPOINT[network]);

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

      setFungibleTokenInfo(info);
      setLoading(false);
    } else {
      consoleError('Failed to retrieve all required data for the token.');
      setIsValidatingAddress(false);
      setValidationError(true);
      setLoading(false);
    }
  };

  const importCustom = async () => {
    if (!fungibleTokenInfo) {
      throw new Error('Coin info is not set');
    }
    try {
      setLoading(true);
      await usewallet.addCustomEvmToken(network, fungibleTokenInfo);
      refreshEvmToken(network);
    } catch (error) {
      consoleError('Failed to import custom token:', error);
    } finally {
      setLoading(false);
      history.replace({ pathname: history.location.pathname, state: { refreshed: true } });
      history.goBack();
    }
  };

  const Header = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <IconButton onClick={history.goBack} sx={{ height: '40px', padding: '0' }}>
          <ArrowBackIcon sx={{ color: 'icon.navi' }} />
        </IconButton>
        <Typography
          variant="h1"
          sx={{
            py: '14px',
            alignSelf: 'center',
            fontSize: '20px',
          }}
        >
          Add Custom Token
        </Typography>
        <Box sx={{ width: '24px' }}></Box>
      </Box>
    );
  };

  return (
    <Box
      px="18px"
      sx={{
        width: 'auto',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.5)',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Header />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            paddingBottom: '100px',
          }}
        >
          <Stack spacing={2} sx={{ flexGrow: 1 }}>
            {/* Contract Address Input */}
            <FormControl sx={{ width: '100%' }}>
              <Typography
                sx={{
                  color: 'var(--Basic-foreground-White, var(--Basic-foreground-White, #FFF))',
                  fontFamily: 'Inter',
                  fontSize: '14px',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  lineHeight: '24px',
                  letterSpacing: '-0.084px',
                }}
              >
                Token contract address
              </Typography>
              <StyledInput
                autoComplete="off"
                placeholder="Contract Address"
                sx={{ height: '64px' }}
                {...register('address', {
                  required: 'Address is required',
                  validate: {
                    check: async (v) => await checkAddress(v!),
                  },
                })}
              />
              <LLFormHelperText
                inputValue={dirtyFields.address}
                isValid={!errors.address && !validationError}
                isValidating={isValidatingAddress}
                errorMsg={`Invalid ERC20 address`}
                successMsg={chrome.i18n.getMessage('Validated__address')}
              />
            </FormControl>
          </Stack>
          {fungibleTokenInfo?.address && !isLoading && (
            <AddCustomEvmForm coinInfo={fungibleTokenInfo} />
          )}
        </Box>

        {/* Button Container */}
        {fungibleTokenInfo?.address ? (
          <Box
            sx={{
              position: 'sticky',
              bottom: '0px',
              padding: '16px 0 48px',
              backgroundColor: 'rgba(0, 0, 0, 1)', // Optional for a clearer UI
            }}
          >
            <LLPrimaryButton
              label={
                isLoading ? (
                  <CircularProgress
                    color="primary"
                    size={22}
                    style={{ fontSize: '14px', margin: '8px' }}
                  />
                ) : (
                  chrome.i18n.getMessage('Import')
                )
              }
              fullWidth
              onClick={() => importCustom()}
              disabled={isLoading || !isValid}
            />
          </Box>
        ) : (
          <Box
            sx={{
              position: 'sticky',
              bottom: '0px',
              padding: '16px 0 48px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)', // Optional for a clearer UI
            }}
          >
            <LLPrimaryButton
              label={
                isLoading ? (
                  <CircularProgress
                    color="primary"
                    size={22}
                    style={{ fontSize: '14px', margin: '8px' }}
                  />
                ) : (
                  chrome.i18n.getMessage('Add')
                )
              }
              fullWidth
              onClick={() => addCustom(enteredAddress)}
              disabled={isLoading || !isValid}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AddCustomEvmToken;
