import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, MenuItem, Typography, IconButton, Drawer } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import type {
  CoinItem,
  CustomFungibleTokenInfo,
  EvmCustomTokenInfo,
} from '@/shared/types/coin-types';
import { getPriceProvider } from '@/shared/types/network-types';
import { consoleError, consoleWarn } from '@/shared/utils/console-log';
import SecurityCard from '@/ui/components/SecurityCard';
import StorageUsageCard from '@/ui/components/StorageUsageCard';
import { useAllTokenInfo, useEvmCustomTokens } from '@/ui/hooks/use-coin-hooks';
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

const TokenDetail = () => {
  const usewallet = useWallet();
  const history = useHistory();
  // Get the token name and id from the url
  const token = useParams<{ name: string }>().name.toLowerCase();
  const tokenId = useParams<{ id: string }>().id;

  // Get the network, current wallet, and active account type
  const { network, currentWallet, activeAccountType } = useProfiles();
  // Get the coins and whether the coins are loaded
  const { coins, coinsLoaded } = useCoins();

  // Get all token info
  const allTokenInfo = useAllTokenInfo(network, activeAccountType === 'evm' ? 'evm' : 'flow');

  // Get EVM Custom Token Info
  const evmCustomTokens = useEvmCustomTokens(network);

  // Child account FT access
  const [canAccessFt, setCanAccessFt] = useState(true);
  // Get the token info from the coin list
  const tokenInfo: CoinItem | CustomFungibleTokenInfo | EvmCustomTokenInfo | undefined =
    useMemo(() => {
      // check if the coins are loaded
      if (!coins || !coinsLoaded || !token || !tokenId || !activeAccountType) {
        return undefined;
      }
      // find the token by id
      const coinItem = coins.find((coin) => coin.id === tokenId);
      if (coinItem) {
        return coinItem;
      }

      consoleWarn(`Token not found by ID ${tokenId}, trying to find by name ${token}`);

      const lowerCaseToken = token.toLowerCase();
      // find the token by name
      const coinFoundByName = coins.find(
        (coin) =>
          coin.symbol?.toLowerCase() === lowerCaseToken ||
          coin.name?.toLowerCase() === lowerCaseToken
      );
      if (coinFoundByName) {
        return coinFoundByName;
      }
      consoleWarn(`Token not found by in coin list, trying to find in token list by name ${token}`);

      // find the token by
      const coinFoundByAddress: CustomFungibleTokenInfo | undefined = allTokenInfo?.find(
        (customToken) =>
          customToken.symbol?.toLowerCase() === lowerCaseToken ||
          customToken.name?.toLowerCase() === lowerCaseToken
      );
      if (coinFoundByAddress) {
        return coinFoundByAddress;
      }
      if (activeAccountType !== 'evm') {
        consoleError(`Token not found ${token} for account type ${activeAccountType}`);
        return undefined;
      }

      consoleWarn(
        `Token not found in token list, trying to find in custom token list by name ${token}`
      );

      // Find custom token by address
      const customTokenInfo: EvmCustomTokenInfo | undefined = evmCustomTokens?.find(
        (customToken) => customToken.unit?.toLowerCase() === lowerCaseToken
      );
      if (customTokenInfo) {
        return customTokenInfo;
      }
      consoleError(`Token not found ${token}`);
      return undefined;
    }, [coins, tokenId, coinsLoaded, token, allTokenInfo, evmCustomTokens, activeAccountType]);

  // Get the price providers
  const priceProviders = useMemo(() => {
    return getPriceProvider(token);
  }, [token]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnRamp, setIsOnRamp] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  // Handle the delete EFT button to remove an EVM Custom Token
  const handleDeleteEFT = async () => {
    if (!tokenInfo?.address) {
      throw new Error('Token address is required');
    }
    await usewallet.removeCustomEvmToken(network, tokenInfo.address);

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
        {tokenInfo?.custom && (
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

  // Check if the token is accessible
  useEffect(() => {
    if (activeAccountType === 'child' && tokenInfo && 'flowIdentifier' in tokenInfo) {
      usewallet.checkAccessibleFt(currentWallet.address).then((accessibleFt) => {
        if (accessibleFt) {
          setCanAccessFt(accessibleFt.some((ft) => ft.id === tokenInfo.flowIdentifier));
        }
      });
    }
  }, [activeAccountType, currentWallet.address, tokenInfo, usewallet]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: 'black',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '0 18px',
          paddingTop: '0px',
          width: '100%',
          paddingBottom: '18px',
        }}
      >
        <Header />
        {!canAccessFt && (
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
              {`${currentWallet.name}`} Account, please check your linked account settings.
            </Typography>
          </Box>
        )}
        <TokenInfoCard
          tokenInfo={tokenInfo}
          accountType={activeAccountType}
          tokenId={tokenId}
          setIsOnRamp={setIsOnRamp}
        />

        {tokenInfo && 'isVerified' in tokenInfo && !tokenInfo.isVerified && (
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
        {priceProviders?.length > 0 && <PriceCard token={token} />}

        {token === 'flow' && activeAccountType === 'main' && (
          <StorageUsageCard network={network} address={currentWallet.address} />
        )}
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
      </Box>
    </Box>
  );
};

export default TokenDetail;
