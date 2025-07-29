import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Box, FormControl, Input, Typography } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { type TransactionState } from '@onflow/frw-shared/types';

import ArrowIcon from '@/ui/assets/svg/arrow.svg';
import IconCheckmark from '@/ui/components/iconfont/IconCheckmark';
import CancelIcon from '@/ui/components/iconfont/IconClose';
import IconSwitch from '@/ui/components/iconfont/IconSwitch';
import { ContactCard } from '@/ui/components/Send/ContactCard';
import SlideRelative from '@/ui/components/SlideRelative';
import TokenAvatar from '@/ui/components/TokenLists/TokenAvatar';
import { useCurrency } from '@/ui/hooks/preference-hooks';
import { useCoins } from '@/ui/hooks/useCoinHook';
import { useContact } from '@/ui/hooks/useContactHook';
import {
  COLOR_WHITE_ALPHA_10_FFFFFF1A,
  COLOR_WHITE_FFFFFF,
  COLOR_SUCCESS_GREEN_41CC5D,
  COLOR_GREEN_FLOW_DARKMODE_00EF8B,
  COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80,
} from '@/ui/style/color';

import TokenSelector from './TokenSelector';

const TransferAmount = ({
  transactionState,
  handleAmountChange,
  handleTokenChange,
  handleSwitchFiatOrCoin,
  handleMaxClick,
}: {
  transactionState: TransactionState;
  handleAmountChange: (amount: string) => void;
  handleTokenChange: (tokenAddress: string) => void;
  handleSwitchFiatOrCoin: () => void;
  handleMaxClick: () => void;
}) => {
  const { amount, fiatAmount } = transactionState;
  const { coins } = useCoins();
  const currency = useCurrency();
  const navigate = useNavigate();
  const params = useParams();
  const toAddress = params.toAddress;
  const [showTokenSelector, setShowTokenSelector] = useState(false);

  // Get contact data for To Account section
  const contactData =
    useContact(transactionState.toContact?.address || '') || transactionState.toContact || null;

  const handleTokenSelect = useCallback(
    (token: any) => {
      handleTokenChange(token.unit);
      setShowTokenSelector(false);
    },
    [handleTokenChange]
  );

  const openTokenSelector = useCallback(() => {
    setShowTokenSelector(true);
  }, []);

  const closeTokenSelector = useCallback(() => {
    setShowTokenSelector(false);
  }, []);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            px: '4px',
            zIndex: 1000,
            alignItems: 'center',
            mb: 2,
          }}
        >
          {transactionState.fiatOrCoin === 'fiat' ? (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TokenAvatar
                    symbol={transactionState.tokenInfo.symbol}
                    src={transactionState.tokenInfo.logoURI}
                    width={35}
                    height={35}
                  />
                  <FormControl sx={{ display: 'flex', minWidth: '120px' }}>
                    <Input
                      id="textfield"
                      sx={{
                        height: '26px',
                        py: '0',
                        zIndex: '999',
                        fontSize: '28px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        boxSizing: 'border-box',
                        color: '#ffffff',
                        fontWeight: '500',
                        '& .MuiInput-input': {
                          padding: '0',
                          fontSize: '28px',
                          fontWeight: '500',
                        },
                      }}
                      placeholder={chrome.i18n.getMessage('Amount')}
                      autoFocus
                      fullWidth
                      disableUnderline
                      autoComplete="off"
                      value={fiatAmount}
                      type="number"
                      onChange={(event) => handleAmountChange(event.target.value)}
                    />
                  </FormControl>
                </Box>
                <Box
                  sx={{
                    backgroundColor: 'neutral.main',
                    borderRadius: '39px',
                    px: 2.5,
                    py: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    minHeight: '35px',
                  }}
                  onClick={openTokenSelector}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: COLOR_WHITE_FFFFFF, fontSize: '12px', fontWeight: '600' }}
                  >
                    $
                  </Typography>
                  <IconCheckmark size={10} color={COLOR_SUCCESS_GREEN_41CC5D} />
                  <ChevronRightRoundedIcon
                    sx={{ color: COLOR_WHITE_FFFFFF, fontSize: 14, transform: 'rotate(90deg)' }}
                  />
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: 'neutral.main',
                      borderRadius: '56px',
                      p: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '25px',
                      height: '25px',
                    }}
                  >
                    <IconSwitch size={11} />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}
                  >
                    ${fiatAmount || '0'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}
                  >
                    {amount || '0'} {transactionState.tokenInfo.symbol}
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: COLOR_WHITE_ALPHA_10_FFFFFF1A,
                      borderRadius: '39px',
                      px: 2.5,
                      py: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                      },
                    }}
                    onClick={handleMaxClick}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: COLOR_WHITE_FFFFFF,
                        fontSize: '12px',
                        fontWeight: '600',
                        letterSpacing: '-0.072px',
                      }}
                    >
                      MAX
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TokenAvatar
                    symbol={transactionState.tokenInfo.symbol}
                    src={transactionState.tokenInfo.logoURI}
                    width={35}
                    height={35}
                  />
                  <FormControl sx={{ display: 'flex', minWidth: '120px' }}>
                    <Input
                      id="textfield"
                      sx={{
                        height: '26px',
                        py: '0',
                        zIndex: '999',
                        fontSize: '28px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        boxSizing: 'border-box',
                        color: '#ffffff',
                        fontWeight: '500',
                        '& .MuiInput-input': {
                          padding: '0',
                          fontSize: '28px',
                          fontWeight: '500',
                        },
                      }}
                      placeholder={chrome.i18n.getMessage('Amount')}
                      autoFocus
                      fullWidth
                      disableUnderline
                      autoComplete="off"
                      value={amount}
                      onChange={(event) => handleAmountChange(event.target.value)}
                    />
                  </FormControl>
                </Box>
                <Box
                  sx={{
                    backgroundColor: COLOR_WHITE_ALPHA_10_FFFFFF1A,
                    borderRadius: '39px',
                    px: 2.5,
                    py: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    minHeight: '35px',
                  }}
                  onClick={openTokenSelector}
                >
                  <TokenAvatar
                    symbol={transactionState.tokenInfo.symbol}
                    src={transactionState.tokenInfo.logoURI}
                    width={16}
                    height={16}
                  />
                  <Typography
                    variant="body2"
                    sx={{ color: COLOR_WHITE_FFFFFF, fontSize: '12px', fontWeight: '600' }}
                  >
                    {transactionState.tokenInfo.symbol}
                  </Typography>
                  <IconCheckmark size={10} color={COLOR_SUCCESS_GREEN_41CC5D} />
                  <ChevronRightRoundedIcon
                    sx={{ color: COLOR_WHITE_FFFFFF, fontSize: 14, transform: 'rotate(90deg)' }}
                  />
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: COLOR_WHITE_ALPHA_10_FFFFFF1A,
                      borderRadius: '56px',
                      p: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '25px',
                      height: '25px',
                    }}
                  >
                    <IconSwitch size={11} />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}
                  >
                    ${fiatAmount || '0'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}
                  >
                    {amount || '0'} {transactionState.tokenInfo.symbol}
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: COLOR_WHITE_ALPHA_10_FFFFFF1A,
                      borderRadius: '39px',
                      px: 2.5,
                      py: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                      },
                    }}
                    onClick={handleMaxClick}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: COLOR_WHITE_FFFFFF,
                        fontSize: '12px',
                        fontWeight: '600',
                        letterSpacing: '-0.072px',
                      }}
                    >
                      MAX
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Send Button */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 2,
            mb: 1,
          }}
        >
          <Box
            sx={{
              backgroundColor: COLOR_GREEN_FLOW_DARKMODE_00EF8B,
              borderRadius: '100px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              width: '48px',
              height: '48px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img src={ArrowIcon} alt="Send" width="24" height="24" />
            </Box>
          </Box>
        </Box>

        {/* To Account Section */}
        <Box
          sx={{
            backgroundColor: COLOR_WHITE_ALPHA_10_FFFFFF1A,
            borderRadius: '16px',
            pb: 3,
            pt: 2,
            px: 2,
            mt: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              mb: 1.5,
              color: COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80,
              fontSize: '12px',
            }}
          >
            To account
          </Typography>
          {contactData && (
            <ContactCard contact={contactData} tokenInfo={transactionState.tokenInfo} />
          )}
        </Box>

        <SlideRelative direction="down" show={transactionState.balanceExceeded}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: '95%',
              backgroundColor: 'error.light',
              mx: 'auto',
              borderRadius: '0 0 12px 12px',
            }}
          >
            <CancelIcon size={24} color={'#E54040'} style={{ margin: '8px' }} />
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: transactionState.tokenInfo.unit === 'flow' ? '0.7rem' : '1rem' }}
            >
              {transactionState.tokenInfo.unit === 'flow'
                ? chrome.i18n.getMessage('Insufficient_balance_on_Flow')
                : chrome.i18n.getMessage('Insufficient_balance')}
            </Typography>
          </Box>
        </SlideRelative>
      </Box>

      <TokenSelector
        open={showTokenSelector}
        onClose={closeTokenSelector}
        onTokenSelect={handleTokenSelect}
        currentToken={transactionState.tokenInfo}
      />
    </>
  );
};

export default TransferAmount;
