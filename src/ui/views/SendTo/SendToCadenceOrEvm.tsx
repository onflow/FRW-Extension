import { Box, Button, Divider, Typography } from '@mui/material';
import BN from 'bignumber.js';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { type TransactionState } from '@onflow/frw-shared/types';
import { isValidAddress, isValidEthereumAddress, consoleError } from '@onflow/frw-shared/utils';

import { LLHeader } from '@/ui/components';
import { AccountCard } from '@/ui/components/account/account-card';
import { CurrencyValue } from '@/ui/components/TokenLists/CurrencyValue';
import TokenAvatar from '@/ui/components/TokenLists/TokenAvatar';
import { TokenBalance } from '@/ui/components/TokenLists/TokenBalance';
import { useCurrency } from '@/ui/hooks/preference-hooks';
import { useActiveAccounts, useMainAccount, useUserWallets } from '@/ui/hooks/use-account-hooks';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useContact } from '@/ui/hooks/useContactHook';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import {
  COLOR_WHITE_ALPHA_10_FFFFFF1A,
  COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80,
  COLOR_DARKMODE_WHITE_10pc,
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
          <LLHeader title={chrome.i18n.getMessage('Send_to')} help={true} />
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
                  />
                )}
              </Box>
            </Box>

            {transactionState.tokenInfo.unit && (
              <>
                <Typography
                  variant="body1"
                  sx={{
                    alignSelf: 'start',
                    fontSize: '14px',
                  }}
                >
                  {chrome.i18n.getMessage('Available__Balance')}
                </Typography>

                <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <TokenAvatar
                    symbol={transactionState.tokenInfo.symbol}
                    src={transactionState.tokenInfo.logoURI}
                    width={18}
                    height={18}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      alignSelf: 'start',
                      fontSize: '15px',
                    }}
                  >
                    <TokenBalance
                      value={String(transactionState.tokenInfo.balance)}
                      showFull={true}
                      postFix={transactionState.tokenInfo.unit.toUpperCase()}
                    />
                    {' ≈ '}
                    <CurrencyValue
                      value={String(transactionState.tokenInfo.total)}
                      currencyCode={currency?.code ?? ''}
                      currencySymbol={currency?.symbol ?? ''}
                    />
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', gap: '8px', mx: '18px', mb: '35px', mt: '10px' }}>
            <Button
              onClick={() => navigate(-1)}
              variant="contained"
              // @ts-expect-error custom color
              color="neutral"
              size="large"
              sx={{
                height: '48px',
                borderRadius: '8px',
                flexGrow: 1,
                textTransform: 'capitalize',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                {chrome.i18n.getMessage('Cancel')}
              </Typography>
            </Button>

            <Button
              onClick={() => {
                // Finalize the transfer amount
                handleFinalizeAmount();
                setConfirmationOpen(true);
              }}
              variant="contained"
              color="success"
              size="large"
              sx={{
                height: '48px',
                flexGrow: 1,
                borderRadius: '8px',
                textTransform: 'capitalize',
              }}
              disabled={
                validated === null ||
                transactionState.balanceExceeded === true ||
                transactionState.amount === null ||
                new BN(transactionState.amount || '-1').isLessThanOrEqualTo(0)
              }
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                {chrome.i18n.getMessage('Next')}
              </Typography>
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
