import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, MenuItem, Typography, IconButton, Drawer } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { storage } from '@/background/webapi';
import type { CoinItem } from '@/shared/types/coin-types';
import type { PriceProvider } from '@/shared/types/network-types';
import { type ActiveAccountType } from '@/shared/types/wallet-types';
import { consoleWarn } from '@/shared/utils/console-log';
import SecurityCard from '@/ui/components/SecurityCard';
import StorageUsageCard from '@/ui/components/StorageUsageCard';
import { refreshEvmToken } from '@/ui/hooks/use-coin-hooks';
import { useCoins } from '@/ui/hooks/useCoinHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import tips from 'ui/assets/svg/tips.svg';
import WarningIcon from 'ui/assets/svg/warning.svg';
import { useWallet } from 'ui/utils';

import PriceCard from '../../components/TokenLists/PriceCard';
import OnRampList from '../Wallet/OnRampList';

import ClaimTokenCard from './ClaimTokenCard';
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
    gap: '8px',
    padding: '0 18px',
    paddingTop: '0px',
    width: '100%',
    paddingBottom: '18px',
  },
}));

const TokenDetail = () => {
  const classes = useStyles();
  const usewallet = useWallet();
  const history = useHistory();
  const { currentWallet } = useProfiles();
  const { coins, coinsLoaded } = useCoins();
  const [price, setPrice] = useState('');
  const [accessible, setAccessible] = useState(true);
  const token = useParams<{ name: string }>().name.toLowerCase();
  const tokenId = useParams<{ id: string }>().id;
  const [network, setNetwork] = useState('mainnet');
  const [walletName, setCurrentWallet] = useState({ name: '' });
  const [tokenInfo, setTokenInfo] = useState<CoinItem | undefined>(undefined);
  const [providers, setProviders] = useState<PriceProvider[]>([]);
  const [accountType, setAccountType] = useState<ActiveAccountType>('main');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnRamp, setIsOnRamp] = useState(false);
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
      (token) => token.address.toLowerCase() !== tokenInfo?.address?.toLowerCase()
    );

    await storage.set(`${network}evmCustomToken`, evmCustomToken);
    await usewallet.clearCoinList();
    refreshEvmToken(network);
    history.replace({ pathname: history.location.pathname, state: { refreshed: true } });
    history.goBack();
  };

  const Header = () => {
    return (
      <Box sx={{ display: 'flex', mx: '-12px', position: 'relative', mb: '4px' }}>
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
    if (!coinsLoaded) {
      return;
    }

    // First try to find by ID
    let tokenResult = coins?.find((coin) => coin.id === tokenId);

    // If not found by ID, try to find by token name (case insensitive)
    if (!tokenResult) {
      consoleWarn(`Token not found by ID ${tokenId}, trying to find by name ${token}`);
      tokenResult = coins?.find(
        (coin) =>
          coin.symbol?.toLowerCase() === token.toLowerCase() ||
          coin.name?.toLowerCase() === token.toLowerCase()
      );
    }

    const result = await usewallet.openapi.getPriceProvider(token);
    if (tokenResult) {
      setTokenInfo(tokenResult);
    } else {
      consoleWarn(`Could not find token with ID ${tokenId} or name ${token}`);
    }

    setProviders(result);
    if (result.length === 0) {
      setPrice(tokenResult?.price || '');
    }
  }, [usewallet, token, tokenId, coins, coinsLoaded]);

  const loadNetwork = useCallback(async () => {
    const network = await usewallet.getNetwork();
    setCurrentWallet(currentWallet ?? { name: '' });
    setNetwork(network);
  }, [usewallet, currentWallet]);

  const requestChildType = useCallback(async () => {
    const result = await usewallet.getActiveAccountType();
    setAccountType(result);
  }, [usewallet]);

  const handleMoveOpen = () => {
    history.push(`/dashboard/token/${token}/send`);
  };

  useEffect(() => {
    if (coinsLoaded) {
      loadNetwork();
      getProvider();
      requestChildType();
    }
  }, [loadNetwork, getProvider, requestChildType, coinsLoaded]);

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
                Flow Wallet doesn't have access to {`${token}`} in
                {`${walletName.name}`} Account, please check your linked account settings.
              </Typography>
            </Box>
          )}
          <TokenInfoCard
            tokenInfo={tokenInfo}
            accountType={accountType}
            tokenId={tokenId}
            setIsOnRamp={setIsOnRamp}
          />

          {tokenInfo && !tokenInfo.isVerified && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <img src={WarningIcon} alt="Verified" style={{ width: '32px', height: '32px' }} />
              </Box>
              <Typography
                sx={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.80)' }}
              >
                This is an unverified token, only interact with tokens you trust.{' '}
                <Typography
                  component="a"
                  href="https://wallet.flow.com/post/verified-tokens-on-flow-wallet"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: 'rgba(255, 255, 255, 0.80)',
                  }}
                >
                  View more.
                </Typography>
              </Typography>
            </Box>
          )}
          {token === 'flow' && <StackingCard />}
          {network === 'testnet' && token === 'flow' && <ClaimTokenCard token={token} />}
          {providers?.length > 0 && (
            <PriceCard token={token} price={price} setPrice={setPrice} providers={providers} />
          )}

          {token === 'flow' && <StorageUsageCard />}
          {tokenInfo && <SecurityCard tokenInfo={tokenInfo} />}
          {isOnRamp && (
            <Drawer
              anchor="bottom"
              open={isOnRamp}
              transitionDuration={300}
              PaperProps={{
                sx: {
                  width: '100%',
                  height: '65%',
                  bgcolor: 'background.default',
                  borderRadius: '18px 18px 0px 0px',
                },
              }}
            >
              <OnRampList close={() => setIsOnRamp(false)} />
            </Drawer>
          )}
        </div>
      </div>
    </StyledEngineProvider>
  );
};

export default TokenDetail;
