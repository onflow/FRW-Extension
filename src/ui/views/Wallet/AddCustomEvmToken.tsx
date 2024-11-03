import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  IconButton,
  Grid,
  Stack,
  InputBase,
  CircularProgress,
  FormControl
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useHistory, useParams } from 'react-router-dom';
import {
  LLPrimaryButton,
  LLSecondaryButton,
  LLFormHelperText,
} from '../../FRWComponent';
import { useWallet } from 'ui/utils';
import { useForm, FieldValues } from 'react-hook-form';
import { withPrefix, isValidEthereumAddress } from '../../utils/address';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Contract, ethers } from 'ethers'
import { storage } from '@/background/webapi';


const StyledInput = styled(InputBase)(({ theme }) => ({
  zIndex: 1,
  color: (theme.palette as any).text,
  backgroundColor: (theme.palette as any).background.default,
  borderRadius: theme.spacing(2),
  marginTop: theme.spacing(2),
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
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields, isValid, isDirty, isSubmitting },
  } = useForm({
    mode: 'all',
  });
  const address = watch('address');
  const [isValidatingAddress, setIsValidatingAddress] =
    useState<boolean>(false);
  const [isLoading, setLoading] =
    useState<boolean>(false);

  const checkAddress = async (address: string) => {
    //wallet controller api
    setIsValidatingAddress(true);
    const validatedResult = await isValidEthereumAddress(address);
    setIsValidatingAddress(false);
    return validatedResult;
  };

  const addCustom = async (address) => {
    setLoading(true)
    const contractAddress = withPrefix(address)!.toLowerCase();
    const evmCustomToken = await storage.get('evmCustomToken') || [];

    // Check if the token already exists in evmCustomToken
    const exists = evmCustomToken.some((token) => token.address === contractAddress);
    if (exists) {
      console.log("Token already exists in evmCustomToken");
      return; // Skip fetching and exit early
    }
    const provider = new ethers.JsonRpcProvider("https://mainnet.evm.nodes.onflow.org/");

    const ftContract = new Contract(
      contractAddress!,
      [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function balanceOf(address) view returns (uint)"
      ],
      provider
    );

    // Helper function to handle contract calls
    async function getContractData(contract, method, ...args) {
      try {
        const result = await contract[method](...args);
        if (!result || result === '0x') {
          console.error(`No data returned for method: ${method}`);
          return null;
        }
        return result;
      } catch (error) {
        console.error(`Error calling ${method}:`, error);
        return null;
      }
    }

    const decimals = await getContractData(ftContract, 'decimals');
    const name = await getContractData(ftContract, 'name');
    const symbol = await getContractData(ftContract, 'symbol');

    if (decimals !== null && name !== null && symbol !== null) {
      const coinInfo = {
        coin: name,
        unit: symbol,
        icon: "",
        price: 0,
        change24h: 0,
        total: 0,
        address: contractAddress?.toLowerCase(),
        decimals,
      };

      // Add new coinInfo to evmCustomToken and save to storage
      evmCustomToken.push(coinInfo);
      await storage.set('evmCustomToken', evmCustomToken);
      console.log("New token added:", coinInfo);
      setLoading(false);
      history.replace({ pathname: history.location.pathname, state: { refreshed: true } });
      history.goBack();
    } else {
      console.error("Failed to retrieve all required data for the token.");
      setLoading(false);
    }

  };



  const Header = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <IconButton onClick={history.goBack}>
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
        <Box></Box>
      </Box>
    );
  };

  const renderContent = () => (
    <Box
      px="18px"
      sx={{
        width: 'auto',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.5)',
        flexDirection: 'column',
        justifyContent: 'space-between'
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
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Stack spacing={2} sx={{ flexGrow: 1 }}>

            {/* Contract Address Input */}
            <FormControl sx={{ width: '100%' }}>
              <StyledInput
                autoComplete="off"
                placeholder='Contract Address'
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
                isValid={!errors.address}
                isValidating={isValidatingAddress}
                errorMsg={`${errors.address?.message}`}
                successMsg={chrome.i18n.getMessage('Validated__address')}
              />
            </FormControl>

          </Stack>

          {/* Button Container */}
          <Box
            sx={{
              position: 'sticky',
              bottom: '39px',
              padding: '16px',
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
                ) : chrome.i18n.getMessage('Add')
              }
              fullWidth
              onClick={() => addCustom(address)} 
              disabled={isLoading || !isValid}
            />
          </Box>
        </Box>

      </Box>

    </Box>
  );

  return (
    <Box>
      {renderContent()}
    </Box>
  );
};

export default AddCustomEvmToken;
