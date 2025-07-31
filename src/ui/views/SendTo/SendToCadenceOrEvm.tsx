import { Box, Divider, Typography } from '@mui/material';
import BN from 'bignumber.js';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { type TransactionState } from '@onflow/frw-shared/types';
import { isValidAddress, isValidEthereumAddress, consoleError } from '@onflow/frw-shared/utils';

import { EditIcon } from '@/ui/assets/icons/settings/Edit';
import { LLHeader } from '@/ui/components';
import { AccountCard } from '@/ui/components/account/account-card';
import { Button } from '@/ui/components/button';
import CancelIcon from '@/ui/components/iconfont/IconClose';
import SlideRelative from '@/ui/components/SlideRelative';
import TokenAvatar from '@/ui/components/TokenLists/TokenAvatar';
import { useCurrency } from '@/ui/hooks/preference-hooks';
import { useActiveAccounts, useMainAccount, useUserWallets } from '@/ui/hooks/use-account-hooks';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useContact } from '@/ui/hooks/useContactHook';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import {
  COLOR_WHITE_ALPHA_10_FFFFFF1A,
  COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80,
  COLOR_DARKMODE_WHITE_10pc,
  COLOR_WHITE_FFFFFF,
  COLOR_GREEN_FLOW_DARKMODE_00EF8B,
  COLOR_DARKMODE_TEXT_SECONDARY_B3B3B3,
  COLOR_BLACK_000000,
  COLOR_ERROR_RED_E54040,
} from '@/ui/style/color';

import TransferAmount from './TransferAmount';
import TransferConfirmation from './TransferConfirmation';

const SendToCadenceOrEvm = ({
  transactionState,
  handleAmountChange,
  handleTokenChange,
  handleSwitchFiatOrCoin,
  handleMaxClick,
  handleFinalizeAmount,
}: {
  transactionState: TransactionState;
  handleAmountChange: (amountString: string) => void;
  handleTokenChange: (tokenAddress: string) => void;
  handleSwitchFiatOrCoin: () => void;
  handleMaxClick: () => void;
  handleFinalizeAmount: () => void;
}) => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { network } = useNetwork();
  const currency = useCurrency();
  const contactData =
    useContact(transactionState.toContact?.address || '') || transactionState.toContact || null;
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [validated, setValidated] = useState<boolean | null>(null);

  // Get current account data for From Account section
  const userWallets = useUserWallets();
  const activeAccounts = useActiveAccounts(network, userWallets?.currentPubkey);
  const currentAccount = useMainAccount(network, activeAccounts?.currentAddress);
  const parentAccount = useMainAccount(network, activeAccounts?.parentAddress);

  useEffect(() => {
    // validate the address when the to address changes
    let mounted = true;
    const checkAddress = async () => {
      //wallet controller api
      try {
        if (transactionState.toAddressType === 'Evm') {
          // We're sending to an EVM network. Check the address format
          setValidated(!!isValidEthereumAddress(transactionState.toAddress));
        } else {
          // We're sending to a Flow network. Check the network itself
          const isValidFlowAddress = await wallet.checkAddress(transactionState.toAddress);
          if (mounted) {
            setValidated(!!isValidFlowAddress);
          }
        }
      } catch (err) {
        consoleError('checkAddress error', err);
        setValidated(false);
      }
    };
    if (isValidAddress(transactionState.toAddress)) {
      checkAddress();
    }
    return () => {
      mounted = false;
    };
  }, [transactionState.toAddress, transactionState.toAddressType, wallet]);

  return (
    <div className="page">
      <>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px' }}>
          <LLHeader
            title={chrome.i18n.getMessage('Send_to')}
            help={true}
            onBackClick={() => {
              // Navigate back to the token detail page based on token info
              const tokenUnit = transactionState.tokenInfo?.unit;
              const tokenId = transactionState.tokenInfo?.id;
              if (tokenUnit && tokenId) {
                navigate(`/dashboard/tokendetail/${tokenUnit.toLowerCase()}/${tokenId}`);
              } else {
                navigate('/dashboard');
              }
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box>
              <Box
                sx={{
                  backgroundColor: COLOR_WHITE_ALPHA_10_FFFFFF1A,
                  px: '16px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                }}
              >
                {/* From Account Section */}
                {currentAccount && (
                  <Box
                    sx={{
                      pb: 3,
                      pt: 2,
                      mb: 0,
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
                      From Account
                    </Typography>
                    <AccountCard
                      network={network}
                      account={currentAccount}
                      parentAccount={parentAccount}
                      active={true}
                      showCard={false}
                    />
                  </Box>
                )}

                <Divider sx={{ backgroundColor: COLOR_DARKMODE_WHITE_10pc, margin: '12px 0' }} />

                {/* Send Tokens Section */}
                <Box
                  sx={{
                    pb: 3,
                    pt: 0.5,
                    height: '168px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80,
                      fontSize: '12px',
                      mb: 1.5,
                    }}
                  >
                    Send Tokens
                  </Typography>
                  {transactionState.tokenInfo.unit && (
                    <TransferAmount
                      transactionState={transactionState}
                      handleAmountChange={handleAmountChange}
                      handleTokenChange={handleTokenChange}
                      handleSwitchFiatOrCoin={handleSwitchFiatOrCoin}
                      handleMaxClick={handleMaxClick}
                    />
                  )}
                </Box>
              </Box>
              {/* To Account Section */}
              <Box
                sx={{
                  backgroundColor: COLOR_WHITE_ALPHA_10_FFFFFF1A,
                  borderRadius: '16px',
                  pb: 2,
                  pt: 2,
                  px: 2,
                  mt: '4px',
                  mb: 3,
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  position: 'relative',
                  zIndex: 1,
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
                  <AccountCard
                    network={network}
                    account={{
                      id: parseInt(contactData.id?.toString() || '0'),
                      name: contactData.contact_name || contactData.username || 'Unknown',
                      address: contactData.address,
                      icon: contactData.avatar || '👤',
                      color: '#484848',
                      chain: 747,
                    }}
                    showCard={false}
                    showLink={false}
                    hideThirdLine={true}
                    secondaryIcon={<EditIcon width={16} height={16} />}
                    // TODO: Open address book selector
                    onClickSecondary={() => {}}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Transaction Fee Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', mb: '10px' }}>
            <Box
              sx={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'flex-start' }}
            >
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: COLOR_WHITE_FFFFFF,
                    fontSize: '14px',
                    fontWeight: '400',
                  }}
                >
                  Transaction Fee
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '14px',
                    fontWeight: '400',
                    textDecoration: 'line-through',
                  }}
                >
                  0.001
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: COLOR_WHITE_FFFFFF,
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  0.00
                </Typography>
                <TokenAvatar
                  symbol={transactionState.tokenInfo.symbol}
                  src={transactionState.tokenInfo.logoURI}
                  width={18}
                  height={18}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '14px',
                  fontWeight: '400',
                }}
              >
                Covered by Flow Wallet
              </Typography>
            </Box>
          </Box>

          {/* Error Message */}
          <SlideRelative direction="down" show={transactionState.balanceExceeded}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '4px',
                mt: '16px',
                px: '16px',
                py: '12px',
                backgroundColor: `${COLOR_ERROR_RED_E54040}1A`,
                borderRadius: '12px',
                border: `1px solid ${COLOR_ERROR_RED_E54040}4D`,
                width: '100%',
              }}
            >
              <CancelIcon size={20} color={'#E54040'} />
              <Typography
                variant="body2"
                sx={{
                  fontSize: '14px',
                  color: '#E54040',
                  fontWeight: '400',
                }}
              >
                {transactionState.tokenInfo.unit === 'flow'
                  ? chrome.i18n.getMessage('Insufficient_balance_on_Flow')
                  : chrome.i18n.getMessage('Insufficient_balance')}
              </Typography>
            </Box>
          </SlideRelative>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', gap: '8px', mb: '35px', mt: '10px' }}>
            <Button
              onClick={() => {
                // Finalize the transfer amount
                handleFinalizeAmount();
                setConfirmationOpen(true);
              }}
              disabled={
                validated === null ||
                transactionState.balanceExceeded === true ||
                transactionState.amount === null ||
                new BN(transactionState.amount || '-1').isLessThanOrEqualTo(0)
              }
              sx={{
                height: '48px',
                flexGrow: 1,
                borderRadius: '8px',
                backgroundColor: COLOR_WHITE_FFFFFF,
                color: COLOR_BLACK_000000,
                '&:hover': {
                  backgroundColor: COLOR_GREEN_FLOW_DARKMODE_00EF8B,
                  opacity: 0.8,
                },
                '&:disabled': {
                  backgroundColor: COLOR_DARKMODE_WHITE_10pc,
                  color: COLOR_DARKMODE_TEXT_SECONDARY_B3B3B3,
                },
              }}
            >
              {chrome.i18n.getMessage('Send')}
            </Button>
          </Box>
          {validated !== null && validated && (
            <TransferConfirmation
              isConfirmationOpen={isConfirmationOpen}
              transactionState={transactionState}
              handleCloseIconClicked={() => setConfirmationOpen(false)}
            />
          )}
        </Box>
      </>
    </div>
  );
};

export default SendToCadenceOrEvm;
