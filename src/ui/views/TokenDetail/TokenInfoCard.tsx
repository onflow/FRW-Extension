import { Typography, Box, ButtonBase, CardMedia } from '@mui/material';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { type ExtendedTokenInfo } from '@/shared/types/coin-types';
import { type ActiveAccountType } from '@/shared/types/wallet-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import buyIcon from '@/ui/FRWAssets/svg/buyIcon.svg';
import receiveIcon from '@/ui/FRWAssets/svg/receiveIcon.svg';
import sendIcon from '@/ui/FRWAssets/svg/sendIcon.svg';
import swapIcon from '@/ui/FRWAssets/svg/swapIcon.svg';
import { LLPrimaryButton } from '@/ui/FRWComponent';
import { IconButton } from '@/ui/FRWComponent/IconButton';
import iconMove from 'ui/FRWAssets/svg/move.svg';
import { useCoins } from 'ui/hooks/useCoinHook';
import { useWallet } from 'ui/utils';

import IconChevronRight from '../../../components/iconfont/IconChevronRight';
import VerifiedIcon from '../../FRWAssets/svg/verfied-check.svg';

import { CurrencyValue } from './CurrencyValue';

// import tips from 'ui/FRWAssets/svg/tips.svg';

const TokenInfoCard = ({
  price,
  token,
  setAccessible,
  accessible,
  tokenInfo,
  accountType,
  tokenId,
  setIsOnRamp,
}: {
  price: string;
  token: string;
  setAccessible: (accessible: boolean) => void;
  accessible: boolean;
  tokenInfo: any;
  accountType: ActiveAccountType;
  tokenId: string;
  setIsOnRamp: (isOnRamp: boolean) => void;
}) => {
  const wallet = useWallet();
  const history = useHistory();
  const isMounted = useRef(true);
  const { coins } = useCoins();
  const [balance, setBalance] = useState<string>('0');
  const [data, setData] = useState<ExtendedTokenInfo | undefined>(undefined);

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
    const timerId = setTimeout(async () => {
      if (!isMounted.current) return; // Early exit if component is not mounted
      setAccessible(true);
      let thisCoin = coins.find((coin) => coin.id.toLowerCase() === tokenId.toLowerCase());

      // If not found by ID, try to find by unit and token
      if (!thisCoin && token) {
        thisCoin = coins.find((coin) => coin.unit?.toLowerCase() === token.toLowerCase());
      }
      setData(thisCoin!);
      const balance = thisCoin?.balance;
      if (balance) {
        setBalance(balance);
      }
    }, 400);

    return () => {
      isMounted.current = false; // Mark component as unmounted
      clearTimeout(timerId); // Clear the timer
    };
  }, [setAccessible, token, tokenId, coins]);

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
        px: '11px',
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
            <Box sx={{ display: 'flex', alignItems: 'end' }}>
              <ButtonBase onClick={() => window.open(getUrl(data), '_blank')}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    px: '8px',
                    py: '4px',
                    marginRight: '2px',
                    borderRadius: '8px',
                    alignSelf: 'end',
                    background: 'linear-gradient(to right, #000000, #282828)',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: '550',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '90px',
                    }}
                  >
                    {data.name}
                  </Typography>
                  <IconChevronRight size={20} />
                </Box>
              </ButtonBase>
              {data.isVerified && (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', height: '40px', marginRight: '4px' }}
                >
                  <img
                    src={VerifiedIcon}
                    alt="Verified"
                    style={{ width: '24px', height: '24px' }}
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ flex: 1 }} />
            {canMoveChild && (
              <ButtonBase data-testid="tokeninfo-move-button" onClick={() => toSend()}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '46px' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(65, 204, 93, 0.16)',
                      gap: '4px',
                      px: '8px',
                      // py: '4px',
                      height: '24px',
                      borderRadius: '8px',
                      alignSelf: 'end',
                    }}
                  >
                    <Typography sx={{ fontWeight: '400', fontSize: '12px', color: '#41CC5D' }}>
                      {chrome.i18n.getMessage('Move')}
                    </Typography>
                    <img
                      src={iconMove}
                      alt="Move Icon"
                      style={{
                        width: '14px',
                        height: '14px',
                        marginLeft: '4px',
                        filter:
                          'invert(54%) sepia(78%) saturate(366%) hue-rotate(85deg) brightness(95%) contrast(92%)',
                      }}
                    />
                  </Box>
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
              <CurrencyValue value={tokenInfo?.total} />
            </Box>
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between',
              mt: '24px',
              width: '100%',
            }}
          >
            {(accountType === 'main' || accountType === 'evm') && (
              <IconButton
                testId="tokeninfo-send-button"
                messageKey="Send"
                onClick={toSend}
                icon={sendIcon}
                customSx={{ width: '42px', height: '42px' }}
              />
            )}
            <IconButton
              testId="tokeninfo-receive-button"
              messageKey="Receive"
              onClick={() => history.push('/dashboard/wallet/deposit')}
              icon={receiveIcon}
              customSx={{ width: '42px', height: '42px' }}
            />
            <IconButton
              testId="tokeninfo-swap-button"
              messageKey="Swap"
              onClick={() => window.open('https://app.increment.fi/swap', '_blank')}
              icon={swapIcon}
              customSx={{ width: '42px', height: '42px' }}
            />
            <IconButton
              testId="tokeninfo-buy-button"
              messageKey="Buy"
              onClick={() => setIsOnRamp(true)}
              icon={buyIcon}
              customSx={{ width: '42px', height: '42px' }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default TokenInfoCard;
