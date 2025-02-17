import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import {
  Typography,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  Skeleton,
  ListItemButton,
  CardMedia,
  Button,
  Box,
} from '@mui/material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useEffect } from 'react';

import { formatString } from '@/shared/utils/address';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useTransferList } from '@/ui/hooks/useTransferListHook';
import activity from 'ui/FRWAssets/svg/activity.svg';
import { useWallet } from 'ui/utils';

import { TokenBalance } from '../TokenDetail/TokenBalance';
import { TokenValue } from '../TokenDetail/TokenValue';

dayjs.extend(relativeTime);

const TransferList = () => {
  const {
    fetchTransactions,
    transactions,
    monitor,
    flowscanURL,
    viewSourceURL,
    loading,
    showButton,
  } = useTransferList();
  const { currentWallet } = useProfiles();

  useEffect(() => {
    fetchTransactions();
    const handler = (req) => {
      if (req.msg === 'transferListUpdated') {
        fetchTransactions();
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [fetchTransactions]);

  const timeConverter = (timeStamp: number) => {
    let time = dayjs.unix(timeStamp);
    if (String(timeStamp).length > 10) {
      time = dayjs(timeStamp);
    }
    return time.fromNow();
  };

  const EndListItemText = (props) => {
    const isReceive = props.txType === 2;
    const isFT = props.type === 1;
    const isContractCall = props.type === 1 && props.token === '';

    const calculateMaxWidth = () => {
      const textLength =
        props.type === 1 ? `${props.amount}`.replace(/^-/, '').length : `${props.token}`.length;
      const baseWidth = 30;
      const additionalWidth = textLength * 8;
      return `${Math.min(baseWidth + additionalWidth, 70)}px`;
    };

    return (
      <ListItemText
        disableTypography={true}
        primary={
          !loading ? (
            <Typography
              variant="body1"
              sx={{
                fontSize: 12,
                fontWeight: '500',
                textAlign: 'end',
                color: isReceive && isFT ? 'success.main' : 'text.primary',
                maxWidth: calculateMaxWidth(),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {props.type === 1 ? (
                <TokenBalance
                  showFull={true}
                  value={`${props.amount}`.replace(/^-/, '')}
                  prefix={!isContractCall ? (isReceive ? '+' : '-') : ''}
                />
              ) : (
                `${props.token}`
              )}
            </Typography>
          ) : (
            <Skeleton variant="text" width={35} height={15} />
          )
        }
        secondary={
          !loading ? (
            <Typography
              variant="body1"
              sx={{
                fontSize: 12,
                fontWeight: '500',
                textAlign: 'end',
                color: props.error ? '#E54040' : '#BABABA',
              }}
            >
              {props.error ? chrome.i18n.getMessage('Error') : props.status}
            </Typography>
          ) : (
            <Skeleton variant="text" width={35} height={15} />
          )
        }
      />
    );
  };

  const StartListItemText = (props) => {
    return (
      <ListItemText
        disableTypography={true}
        primary={
          !loading ? (
            <Box sx={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              {props.txType === 1 ? (
                <CallMadeRoundedIcon sx={{ color: 'info.main', width: '18px' }} />
              ) : (
                <CallReceivedRoundedIcon sx={{ color: 'info.main', width: '18px' }} />
              )}
              <Typography
                variant="body1"
                sx={{
                  fontSize: 12,
                  fontWeight: '500',
                  maxWidth: '180px',
                  wordWrap: 'break-word',
                  textAlign: 'start',
                }}
              >
                {props.title}
              </Typography>
            </Box>
          ) : (
            <Skeleton variant="text" width={45} height={15} />
          )
        }
        secondary={
          !loading ? (
            <Box sx={{ display: 'flex', gap: '3px' }}>
              <Typography
                variant="body1"
                sx={{ fontSize: 10, fontWeight: '500', textAlign: 'start' }}
              >
                {timeConverter(props.time)}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontSize: 10,
                  fontWeight: '500',
                  textAlign: 'start',
                  color: '#41CC5D',
                }}
              >
                {props.txType === 1 && props.receiver && ` To ${formatString(props.receiver)}`}
                {props.txType === 2 && props.sender && ` From ${formatString(props.sender)}`}
              </Typography>
            </Box>
          ) : (
            <Skeleton variant="text" width={75} height={15} />
          )
        }
      />
    );
  };

  return (
    <>
      {!loading ? (
        <Box>
          {transactions && transactions.length ? (
            <>
              {' '}
              {(transactions || []).map((tx) => {
                const txCombinedKey = `${tx.cadenceTxId || tx.hash}${tx.evmTxIds ? `_${tx.evmTxIds.join('_')}` : ''}_${tx.interaction}`;
                return (
                  <ListItem
                    key={txCombinedKey}
                    data-testid={txCombinedKey}
                    secondaryAction={
                      <EndListItemText
                        status={tx.status}
                        amount={tx.amount}
                        error={tx.error}
                        type={tx.type}
                        token={tx.token}
                        txType={tx.transferType}
                      />
                    }
                    disablePadding
                  >
                    <ListItemButton
                      sx={{ paddingRight: '0px' }}
                      dense={true}
                      onClick={() => {
                        {
                          // Link to the first evm tx if there are multiple. Once the indexer updates, it'll show all the evm transactions
                          // This is a temporary solution until the indexer updates
                          const txHash =
                            (tx.evmTxIds && tx.evmTxIds.length) === 1 ? tx.evmTxIds[0] : tx.hash;
                          const url =
                            monitor === 'flowscan'
                              ? `${flowscanURL}/tx/${txHash}`
                              : `${viewSourceURL}/${txHash}`;
                          window.open(url);
                        }
                      }}
                    >
                      <ListItemIcon
                        sx={{ borderRadius: '20px', marginRight: '12px', minWidth: '20px' }}
                      >
                        {/* <MultipleStopIcon
                        fontSize="medium"
                        sx={{ color: '#fff', cursor: 'pointer', border: '1px solid', borderRadius: '35px' }}
                      /> */}
                        <CardMedia
                          sx={{ width: '30px', height: '30px', borderRadius: '15px' }}
                          image={tx.image}
                        />
                      </ListItemIcon>
                      <StartListItemText
                        time={tx.time}
                        interaction={tx.interaction}
                        sender={tx.sender}
                        receiver={tx.receiver}
                        type={tx.type}
                        token={tx.token}
                        title={tx.interaction}
                        txType={tx.transferType}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
              {showButton && (
                <Box sx={{ width: '100%', my: '8px', display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="text"
                    endIcon={<ChevronRightRoundedIcon />}
                    onClick={() => {
                      window.open(`${flowscanURL}/account/${currentWallet.address}`, '_blank');
                    }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      {chrome.i18n.getMessage('View_more_transactions')}
                    </Typography>
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                backgroundColor: '#000',
              }}
            >
              <CardMedia
                sx={{ width: '100px', height: '102px', margin: '50px auto 0' }}
                image={activity}
              />
              <Typography
                variant="overline"
                sx={{
                  lineHeight: '1',
                  textAlign: 'center',
                  color: '#5E5E5E',
                  marginTop: '5px',
                  fontSize: '16px',
                }}
              >
                {chrome.i18n.getMessage('No__Activity')}
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        [1, 2].map((index) => {
          return (
            <ListItem
              key={index}
              secondaryAction={<EndListItemText primary="..." secondary="..." />}
            >
              <ListItemAvatar>
                <Skeleton variant="circular" width={35} height={35} />
              </ListItemAvatar>
              <StartListItemText primary="..." price="..." />
            </ListItem>
          );
        })
      )}
    </>
  );
};

export default TransferList;
