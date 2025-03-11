import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Typography, Drawer, Stack, Grid, CardMedia, IconButton, Button } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { type TransactionState } from '@/shared/types/transaction-types';
import SlideRelative from '@/ui/FRWComponent/SlideRelative';
import StorageExceededAlert from '@/ui/FRWComponent/StorageExceededAlert';
import { WarningStorageLowSnackbar } from '@/ui/FRWComponent/WarningStorageLowSnackbar';
import { useContact } from '@/ui/hooks/useContactHook';
import { useStorageCheck } from '@/ui/utils/useStorageCheck';
import IconNext from 'ui/FRWAssets/svg/next.svg';
import { LLSpinner } from 'ui/FRWComponent';
import { Profile } from 'ui/FRWComponent/Send/Profile';
import { useWallet } from 'ui/utils';

import { TokenBalance } from '../TokenDetail/TokenBalance';
import { TokenValue } from '../TokenDetail/TokenValue';

interface TransferConfirmationProps {
  transactionState: TransactionState;
  isConfirmationOpen: boolean;
  handleCloseIconClicked: () => void;
}

const TransferConfirmation = ({
  transactionState,
  isConfirmationOpen,
  handleCloseIconClicked,
}: TransferConfirmationProps) => {
  const wallet = useWallet();
  const history = useHistory();
  const fromContactData =
    useContact(transactionState.fromContact?.address || '') || transactionState.fromContact;
  const toContactData =
    useContact(transactionState.toContact?.address || '') || transactionState.toContact;
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const [occupied, setOccupied] = useState(false);
  const [tid, setTid] = useState<string>('');
  const [count, setCount] = useState(0);

  const transferAmount = transactionState.amount ? parseFloat(transactionState.amount) : undefined;

  // Check if the transfer is between EVM and Flow networks
  const movingBetweenEVMAndFlow =
    (transactionState.fromNetwork === 'Evm' && transactionState.toNetwork !== 'Evm') ||
    (transactionState.fromNetwork !== 'Evm' && transactionState.toNetwork === 'Evm');

  const { sufficient: isSufficient, sufficientAfterAction: isSufficientAfterAction } =
    useStorageCheck({
      transferAmount,
      coin: transactionState.coinInfo?.coin,
      movingBetweenEVMAndFlow,
    });

  const isLowStorage = isSufficient !== undefined && !isSufficient; // isSufficient is undefined when the storage check is not yet completed
  const isLowStorageAfterAction = isSufficientAfterAction !== undefined && !isSufficientAfterAction; // isSufficientAfterAction is undefined when the storage check is not yet completed
  const colorArray = [
    '#32E35529',
    '#32E35540',
    '#32E35559',
    '#32E35573',
    '#41CC5D',
    '#41CC5D',
    '#41CC5D',
  ];

  const startCount = useCallback(() => {
    let count = 0;
    let intervalId;
    if (isConfirmationOpen && transactionState.toAddress) {
      intervalId = setInterval(function () {
        count++;
        if (count === 7) {
          count = 0;
        }
        setCount(count);
      }, 500);
    } else if (!isConfirmationOpen || !transactionState.toAddress) {
      clearInterval(intervalId);
    }
  }, [transactionState.toAddress, isConfirmationOpen]);

  const getPending = useCallback(async () => {
    const pending = await wallet.getPendingTx();
    if (pending.length > 0) {
      setOccupied(true);
    }
  }, [wallet]);

  const updateOccupied = useCallback(() => {
    setOccupied(false);
  }, []);

  const transferTokens = useCallback(async () => {
    try {
      // Set the sending state to true
      setSending(true);

      // Initialize the transaction ID
      const txId: string = await wallet.transferTokens(transactionState);

      // Set the transaction ID so we can show that we're processing
      setTid(txId);

      // Listen for the transaction - this is async but don't wait for it to be completed
      wallet.listenTransaction(
        txId,
        true,
        `${transactionState.amount} ${transactionState.coinInfo.coin} Sent`,
        `You have sent ${transactionState.amount} ${transactionState.selectedToken?.symbol} to ${transactionState.toAddress}. \nClick to view this transaction.`,
        transactionState.coinInfo.icon
      );
      // Record the recent contact
      await wallet.setRecent(transactionState.toContact);

      // Update the dash index
      await wallet.setDashIndex(0);

      // Redirect to the dashboard activity tab
      history.push(`/dashboard?activity=1&txId=${txId}`);
    } catch (error) {
      console.error('Transaction failed:', error);
      // Set the failed state to true so we can show the error message
      setFailed(true);
    } finally {
      // Set the sending state to false regardless of whether the transaction was successful or not
      setSending(false);
    }
  }, [transactionState, wallet, history]);

  const transactionDoneHandler = useCallback(
    (request) => {
      if (request.msg === 'transactionDone') {
        updateOccupied();
      }
      if (request.msg === 'transactionError') {
        setFailed(true);
        setErrorMessage(request.errorMessage);
        setErrorCode(request.errorCode);
      }
      return true;
    },
    [updateOccupied]
  );

  useEffect(() => {
    startCount();
    getPending();
    chrome.runtime.onMessage.addListener(transactionDoneHandler);

    return () => {
      chrome.runtime.onMessage.removeListener(transactionDoneHandler);
    };
  }, [getPending, startCount, transactionDoneHandler]);

  return (
    <>
      <Drawer
        anchor="bottom"
        open={isConfirmationOpen}
        transitionDuration={300}
        PaperProps={{
          sx: {
            width: '100%',
            height: '65%',
            bgcolor: 'background.paper',
            borderRadius: '18px 18px 0px 0px',
          },
        }}
      >
        <Box
          px="18px"
          sx={{
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            flexDirection: 'column',
            display: 'flex',
          }}
        >
          <Grid
            container
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Grid item xs={1}></Grid>
            <Grid item xs={10}>
              {tid ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="h1" align="center" py="14px" fontSize="20px">
                    {chrome.i18n.getMessage('Transaction_created')}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="h1" align="center" py="14px" fontWeight="bold" fontSize="20px">
                  {!sending
                    ? chrome.i18n.getMessage('Confirmation')
                    : chrome.i18n.getMessage('Processing')}
                </Typography>
              )}
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={handleCloseIconClicked}>
                <CloseIcon fontSize="medium" sx={{ color: 'icon.navi', cursor: 'pointer' }} />
              </IconButton>
            </Grid>
          </Grid>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: '16px',
            }}
          >
            {/* Need some generic card here that renders the contact card based on the network */}

            <Profile contact={fromContactData} />
            <Box
              sx={{
                marginLeft: '-15px',
                marginRight: '-15px',
                marginTop: '-32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {colorArray.map((color, index) => (
                <Box sx={{ mx: '5px' }} key={index}>
                  {count === index ? (
                    <CardMedia sx={{ width: '8px', height: '12px' }} image={IconNext} />
                  ) : (
                    <Box
                      key={index}
                      sx={{
                        height: '5px',
                        width: '5px',
                        borderRadius: '5px',
                        backgroundColor: color,
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
            <Profile contact={toContactData} />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              px: '13px',
              py: '16px',
              backgroundColor: '#333333',
              borderRadius: '16px',
              my: '10px',
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1}>
              <CardMedia
                sx={{ width: '24px', height: '24px' }}
                image={transactionState.coinInfo.icon}
              />
              <Typography variant="body1" sx={{ fontSize: '18px', fontWeight: 'semi-bold' }}>
                {transactionState.coinInfo.coin}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Typography
                variant="body1"
                sx={{ fontSize: '18px', fontWeight: '400', textAlign: 'end' }}
              >
                <TokenBalance
                  showFull={true}
                  value={transactionState.amount}
                  postFix={transactionState.coinInfo.unit.toUpperCase()}
                />
              </Typography>
            </Stack>
            <Stack direction="column" spacing={1}>
              <Typography
                variant="body1"
                color="info"
                sx={{ fontSize: '14px', fontWeight: 'semi-bold', textAlign: 'end' }}
              >
                <TokenValue value={transactionState.fiatAmount} prefix={'$'} />
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          <SlideRelative direction="down" show={occupied}>
            <Box
              sx={{
                width: '95%',
                backgroundColor: 'error.light',
                mx: 'auto',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                py: '8px',
              }}
            >
              {/* <CardMedia style={{ color:'#E54040', width:'24px',height:'24px', margin: '0 12px 0' }} image={empty} />   */}
              <InfoIcon
                fontSize="medium"
                color="primary"
                style={{ margin: '0px 12px auto 12px' }}
              />
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '12px' }}>
                {chrome.i18n.getMessage('Your_address_is_currently_processing_another_transaction')}
              </Typography>
            </Box>
          </SlideRelative>
          <WarningStorageLowSnackbar
            isLowStorage={isLowStorage}
            isLowStorageAfterAction={isLowStorageAfterAction}
          />

          <Button
            onClick={transferTokens}
            disabled={false}
            variant="contained"
            color="success"
            size="large"
            sx={{
              height: '50px',
              width: '100%',
              borderRadius: '12px',
              textTransform: 'capitalize',
              display: 'flex',
              gap: '12px',
              marginBottom: '33px',
            }}
          >
            {sending ? (
              <>
                <LLSpinner size={28} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                  {chrome.i18n.getMessage('Sending')}
                </Typography>
              </>
            ) : (
              <>
                {failed ? (
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                    {chrome.i18n.getMessage('Transaction__failed')}
                  </Typography>
                ) : (
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                    {chrome.i18n.getMessage('Send')}
                  </Typography>
                )}
              </>
            )}
          </Button>
        </Box>
      </Drawer>
      <StorageExceededAlert open={errorCode === 1103} onClose={() => setErrorCode(null)} />
    </>
  );
};

export default TransferConfirmation;
