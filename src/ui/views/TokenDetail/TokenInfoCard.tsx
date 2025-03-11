import { Typography, Box, ButtonBase, CardMedia } from '@mui/material';
import { type TokenInfo } from 'flow-native-token-registry';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { isValidEthereumAddress } from '@/shared/utils/address';
import { LLPrimaryButton } from '@/ui/FRWComponent';
import iconMove from 'ui/FRWAssets/svg/moveIcon.svg';
import { useWallet } from 'ui/utils';

import IconChevronRight from '../../../components/iconfont/IconChevronRight';

import { TokenValue } from './TokenValue';

// import tips from 'ui/FRWAssets/svg/tips.svg';

const TokenInfoCard = ({ price, token, setAccessible, accessible, tokenInfo, childType }) => {
  const wallet = useWallet();
  const history = useHistory();
  const isMounted = useRef(true);
  const [balance, setBalance] = useState<string>('0');
  const [data, setData] = useState<TokenInfo | undefined>(undefined);

  const [canMoveChild, setCanMoveChild] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      const result = await wallet.checkCanMoveChild();
      if (Number(balance) > 0 || !tokenInfo.custom) {
        setCanMoveChild(result);
      } else {
        setCanMoveChild(false);
      }
    };

    checkPermission();
  }, [balance, tokenInfo.custom, wallet]);

  const toSend = () => {
    history.push(`/dashboard/token/${tokenInfo.symbol}/send`);
  };

  const getActive = useCallback(async () => {
    const isChild = await wallet.getActiveWallet();

    const timerId = setTimeout(async () => {
      if (!isMounted.current) return; // Early exit if component is not mounted
      setData(tokenInfo!);
      setAccessible(true);
      if (isChild === 'evm') {
        const coins = await wallet.getCoinList();
        const thisCoin = coins.filter((coin) => coin.unit.toLowerCase() === token);
        const balance = thisCoin[0].balance;
        setBalance(balance);
      } else {
        wallet.openapi
          .getWalletTokenBalance(token)
          .then((response) => {
            if (isMounted.current) {
              setBalance(response);
            }
          })
          .catch((err) => {
            console.error('err ', err);
          });
      }
    }, 400);

    return () => {
      isMounted.current = false; // Mark component as unmounted
      clearTimeout(timerId); // Clear the timer
    };
  }, [setAccessible, token, tokenInfo, wallet]);

  const getUrl = (data) => {
    if (data.extensions?.website?.trim()) {
      return data.extensions.website;
    }
    if (isValidEthereumAddress(data.address)) {
      return `https://evm.flowscan.io/token/${data.address}`;
    } else if (data.symbol.toLowerCase() === 'flow') {
      return 'https://flow.com/';
    }
    return `https://flowscan.io/account/${data.address}/tokens`;
  };

  useEffect(() => {
    isMounted.current = true;
    getActive();

    return () => {
      isMounted.current = false;
    };
  }, [token, getActive]);

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#121212',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
        px: '18px',
        pb: '30px',
        mt: '12px',
        minHeight: '230px',
        borderRadius: '12px',
      }}
    >
      {data && (
        <>
          <Box
            sx={{ mt: '-12px', display: 'flex', justifyContent: 'space-between', width: '100%' }}
          >
            <img
              style={{
                height: '64px',
                width: '64px',
                backgroundColor: '#282828',
                borderRadius: '32px',
              }}
              src={
                data.logoURI ||
                'https://cdn.jsdelivr.net/gh/FlowFans/flow-token-list@main/token-registry/A.1654653399040a61.FlowToken/logo.svg'
              }
            ></img>
            <ButtonBase onClick={() => window.open(getUrl(data), '_blank')}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  px: '8px',
                  py: '4px',
                  marginRight: '4px',
                  borderRadius: '8px',
                  alignSelf: 'end',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: '550',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '130px',
                  }}
                >
                  {data.name}
                </Typography>
                <IconChevronRight size={20} />
              </Box>
            </ButtonBase>

            <Box sx={{ flex: 1 }} />
            {canMoveChild && (
              <ButtonBase onClick={() => toSend()}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(65, 204, 93, 0.16)',
                    gap: '4px',
                    px: '8px',
                    py: '4px',
                    borderRadius: '8px',
                    alignSelf: 'end',
                  }}
                >
                  <Typography sx={{ fontWeight: 'normal', color: '#41CC5D' }}>
                    {chrome.i18n.getMessage('Move')}
                  </Typography>
                  <CardMedia
                    sx={{ width: '12px', height: '12px', marginLeft: '4px' }}
                    image={iconMove}
                  />
                </Box>
              </ButtonBase>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px',
              pt: '18px',
              width: '100%',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: '700',
                fontSize: 'clamp(16px, 5vw, 32px)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {balance}
            </Typography>
            <Typography
              variant="caption"
              color="neutral2.main"
              sx={{
                fontWeight: 'medium',
                fontSize: '14px',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              {data.symbol}
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '16px' }}>
            <Box component="span" sx={{ marginRight: '0.25rem' }}>
              <TokenValue
                value={String(Number(balance) * price)}
                prefix="$"
                postFix={chrome.i18n.getMessage('USD')}
              />
            </Box>
          </Typography>
          <Box sx={{ display: 'flex', gap: '12px', height: '36px', mt: '24px', width: '100%' }}>
            {(!childType || childType === 'evm') && (
              <LLPrimaryButton
                sx={{
                  borderRadius: '8px',
                  height: '36px',
                  fontSize: '14px',
                  color: 'primary.contrastText',
                  fontWeight: '600',
                }}
                disabled={!accessible}
                onClick={toSend}
                label={chrome.i18n.getMessage('Send')}
                fullWidth
              />
            )}
            <LLPrimaryButton
              sx={{
                borderRadius: '8px',
                height: '36px',
                fontSize: '14px',
                color: 'primary.contrastText',
                fontWeight: '600',
              }}
              disabled={!accessible}
              onClick={() => history.push('/dashboard/wallet/deposit')}
              label={chrome.i18n.getMessage('Deposit')}
              fullWidth
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default TokenInfoCard;
