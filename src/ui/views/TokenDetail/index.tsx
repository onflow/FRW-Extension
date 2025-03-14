import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, MenuItem, Typography, IconButton } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import type { TokenInfo } from 'flow-native-token-registry';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { storage } from '@/background/webapi';
import type { PriceProvider } from '@/shared/types/network-types';
import { type ActiveChildType } from '@/shared/types/wallet-types';
import StorageUsageCard from '@/ui/FRWComponent/StorageUsageCard';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import tips from 'ui/FRWAssets/svg/tips.svg';
import { useWallet } from 'ui/utils';

import ClaimTokenCard from './ClaimTokenCard';
import PriceCard from './PriceCard';
import StackingCard from './StackingCard';
import TokenInfoCard from './TokenInfoCard';

const useStyles = makeStyles(() => ({
  page: {
    width: '100%',
    height: '100%',
    overflow: 'auto',
    backgroundColor: 'black',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '0 18px',
    paddingTop: '4px',
    width: '100%',
    paddingBottom: '18px',
  },
}));

const TokenDetail = () => {
  const classes = useStyles();
  const usewallet = useWallet();
  const history = useHistory();
  const { currentWallet } = useProfiles();
  const [price, setPrice] = useState(0);
  const [accessible, setAccessible] = useState(true);
  const token = useParams<{ id: string }>().id.toLowerCase();
  const [network, setNetwork] = useState('mainnet');
  const [walletName, setCurrentWallet] = useState({ name: '' });
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | undefined>(undefined);
  const [providers, setProviders] = useState<PriceProvider[]>([]);
  const [childType, setChildType] = useState<ActiveChildType>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleDeleteEFT = async () => {
    const network = await usewallet.getNetwork();

    let evmCustomToken = (await storage.get(`${network}evmCustomToken`)) || [];

    // Filter out any empty objects from evmCustomToken
    evmCustomToken = evmCustomToken.filter((token) => Object.keys(token).length > 0);

    // Filter out the token with the matching address
    evmCustomToken = evmCustomToken.filter(
      (token) => token.address.toLowerCase() !== tokenInfo?.address.toLowerCase()
    );

    await storage.set(`${network}evmCustomToken`, evmCustomToken);
    await usewallet.clearCoinList();
    await usewallet.openapi.refreshCustomEvmToken(network);
    history.replace({ pathname: history.location.pathname, state: { refreshed: true } });
    history.goBack();
  };

  const Header = () => {
    return (
      <Box sx={{ display: 'flex', mx: '-12px', position: 'relative' }}>
        <IconButton onClick={history.goBack}>
          <ArrowBackIcon sx={{ color: 'icon.navi' }} />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        {tokenInfo &&
          (tokenInfo as any).custom && ( // potential type error here. custom is not a property of TokenInfo
            <IconButton onClick={handleMenuToggle}>
              <MoreHorizIcon sx={{ color: 'icon.navi' }} />
            </IconButton>
          )}
        {menuOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              right: 0,
              bgcolor: '#222222',
              color: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
            }}
          >
            <MenuItem onClick={handleDeleteEFT} sx={{ fontSize: '12px', fontWeight: 400 }}>
              Delete EFT
            </MenuItem>
          </Box>
        )}
      </Box>
    );
  };

  const getProvider = useCallback(async () => {
    const result = await usewallet.openapi.getPriceProvider(token);
    const tokenResult = await usewallet.openapi.getTokenInfo(token);
    if (tokenResult) {
      setTokenInfo(tokenResult);
    }
    setProviders(result);
    if (result.length === 0) {
      const data = await usewallet.openapi.getTokenPrices('pricesMap');
      const price = await usewallet.openapi.getPricesByAddress(tokenResult!.address, data);
      if (price) {
        setPrice(price);
      }
      // TokenInfo does have evmAddress, sometimes, check first
      const addressToCheck =
        'evmAddress' in tokenResult! ? (tokenResult as any).evmAddress : tokenResult!.address;
      const evmPrice = await usewallet.openapi.getPricesByEvmaddress(addressToCheck, data);
      if (evmPrice) {
        setPrice(evmPrice);
      }
    }
  }, [usewallet, token]);

  const loadNetwork = useCallback(async () => {
    const network = await usewallet.getNetwork();
    setCurrentWallet(currentWallet);
    setNetwork(network);
  }, [usewallet, currentWallet]);

  const requestChildType = useCallback(async () => {
    const result = await usewallet.getActiveWallet();
    setChildType(result);
  }, [usewallet]);

  const handleMoveOpen = () => {
    history.push(`/dashboard/token/${token}/send`);
  };

  useEffect(() => {
    loadNetwork();
    getProvider();
    requestChildType();
  }, [loadNetwork, getProvider, requestChildType]);

  return (
    <StyledEngineProvider injectFirst>
      <div className={`${classes.page} page`}>
        <div className={classes.container}>
          <Header />
          {!accessible && (
            <Box
              sx={{
                display: 'flex',
                marginBottom: '12px',
                borderRadius: '8px',
                padding: '8px 11px',
                backgroundColor: 'error.light',
              }}
            >
              <img style={{ height: '16px', width: '16px', borderRadius: '16px' }} src={tips}></img>
              <Typography
                sx={{
                  fontSize: '12px',
                  marginLeft: '5px',
                  color: 'error.main',
                }}
              >
                Flow Wallet doesn’t have access to {`${token}`} in
                {`${walletName.name}`} Account, please check your linked account settings.
              </Typography>
            </Box>
          )}
          {tokenInfo && (
            <TokenInfoCard
              price={price}
              token={token}
              setAccessible={setAccessible}
              accessible={accessible}
              tokenInfo={tokenInfo}
              childType={childType}
            />
          )}
          {token === 'flow' && <StackingCard />}
          {network === 'testnet' && token === 'flow' && <ClaimTokenCard token={token} />}
          {providers?.length > 0 && (
            <PriceCard token={token} price={price} setPrice={setPrice} providers={providers} />
          )}

          {token === 'flow' && <StorageUsageCard />}
        </div>
      </div>
    </StyledEngineProvider>
  );
};

export default TokenDetail;
