import React, { useEffect, useState } from 'react';
import { Box, ThemeProvider } from '@mui/system';
import { useWallet } from 'ui/utils';
import { formatString } from 'ui/utils/address';
import theme from '../../style/LLTheme';
import {
  Typography,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  Skeleton,
  ListItemButton,
  CardMedia,
  Button
} from '@mui/material';
import activity from 'ui/FRWAssets/svg/activity.svg';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
// import IconExec from '../../../components/iconfont/IconExec';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
// import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
dayjs.extend(relativeTime);

const TransferList = ({ setCount }) => {
  const wallet = useWallet();
  const [isLoading, setLoading] = useState(true);
  const [transaction, setTx] = useState([]);
  const [monitor, setMonitor] = useState('flowscan');
  const [flowscanURL, setFlowscanURL] = useState('https://www.flowscan.io')
  const [viewSource, setViewSourceUrl] = useState('https://f.dnz.dev')
  const [address, setAddress] = useState<string | null>('0x')
  const [showButton, setShowButton] = useState(false)

  const fetchTransaction = async () => {
    setLoading(true);
    const monitor = await wallet.getMonitor();
    setMonitor(monitor)
    try {
      const url = await wallet.getFlowscanUrl()
      const viewSourceUrl = await wallet.getViewSourceUrl()
      setFlowscanURL(url)
      setViewSourceUrl(viewSourceUrl)
      const address = await wallet.getCurrentAddress()
      setAddress(address)
      const data = await wallet.getTransaction(address!, 15, 0, 60000);
      setLoading(false);
      if (data['count'] > 0) {
        setCount(data['count'].toString())
        setShowButton(data['count'] > 15)
      }
      setTx(data['list']);
    } catch (e) {
      setLoading(false);
    }
  }


  const extMessageHandler = (req) => {
    if (req.msg === 'transferListReceived') {
      fetchTransaction();
    }
    return true;
  }


  useEffect(() => {
    fetchTransaction();
    chrome.runtime.onMessage.addListener(extMessageHandler);

    return () => {
      chrome.runtime.onMessage.removeListener(extMessageHandler)
    }
  }, []);

  const timeConverter = (timeStamp: number) => {
    let time = dayjs.unix(timeStamp)
    if (String(timeStamp).length > 10) {
      time = dayjs(timeStamp)
    }
    return time.fromNow()
  };

  const EndListItemText = (props) => {
    const isReceive = props.txType === 2
    const isFT = props.type === 1
    return (
      <ListItemText
        disableTypography={true}
        primary={
          !isLoading ? (
            <Typography
              variant="body1"
              sx={{ fontSize: 14, fontWeight: '500', textAlign: 'end', color: isReceive && isFT ? 'success.main' : 'text.primary' }}
            >
              {props.type == 1 ?
                ((isReceive ? '+' : '-') + `${props.amount}`.replace(/^-/, '')) :
                `${props.token}`
              }
            </Typography>
          ) : (
            <Skeleton variant="text" width={35} height={15} />
          )
        }
        secondary={
          !isLoading ? (
            <Typography
              variant="body1"
              sx={{ fontSize: 12, fontWeight: '500', textAlign: 'end', color: props.error ? '#E54040' : '#BABABA' }}
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
          !isLoading ? (
            <Box sx={{ display: 'flex', gap: '3px' }}>
              {props.txType === 1 ? <CallMadeRoundedIcon sx={{ color: 'info.main', width: '18px' }} /> : <CallReceivedRoundedIcon sx={{ color: 'info.main', width: '18px' }} />}
              <Typography
                variant="body1"
                sx={{ fontSize: 14, fontWeight: '500', textAlign: 'start' }}
              >
                {props.title}
              </Typography>
            </Box>

          ) : (
            <Skeleton variant="text" width={45} height={15} />
          )
        }
        secondary={
          !isLoading ? (
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
                  color: '#41CC5D'
                }}
              >
                {(props.txType === 1 && props.receiver) && ` To ${formatString(props.receiver)}`}
                {(props.txType === 2 && props.sender) && ` From ${formatString(props.sender)}`}
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
    <ThemeProvider theme={theme}>
      {!isLoading
        ?
        <Box>
          {transaction && transaction.length ?
            <> {
              (transaction || []).map((tx: any, index) => {
                return (
                  <ListItem
                    key={index}
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
                    <ListItemButton sx={{ paddingRight: '0px' }} dense={true} onClick={() => {
                      {
                        monitor === 'flowscan' ?
                          window.open(`${flowscanURL}/tx/${tx.hash}`) :
                          window.open(`${viewSource}/${tx.hash}`)
                      }
                    }}>
                      <ListItemIcon sx={{ borderRadius: '20px', marginRight: '12px', minWidth: '20px' }}>
                        {/* <MultipleStopIcon
                        fontSize="medium"
                        sx={{ color: '#fff', cursor: 'pointer', border: '1px solid', borderRadius: '35px' }}
                      /> */}
                        <CardMedia sx={{ width: '30px', height: '30px', borderRadius: '15px' }} image={tx.image} />
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
            {showButton &&
                <Box sx={{ width: '100%', my: '8px', display: 'flex', justifyContent: 'center' }}>
                  <Button variant="text"
                    endIcon={<ChevronRightRoundedIcon />}
                    onClick={() => { window.open(`${flowscanURL}/account/${address}`, '_blank') }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      {chrome.i18n.getMessage('View_more_transactions')}</Typography>
                  </Button>
                </Box>
            }
            </>
            :
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                backgroundColor: '#000',
              }}>
              <CardMedia sx={{ width: '100px', height: '102px', margin: '50px auto 0', }} image={activity} />
              <Typography
                variant="overline"
                sx={{ lineHeight: '1', textAlign: 'center', color: '#5E5E5E', marginTop: '5px', fontSize: '16px' }}
              >
                {chrome.i18n.getMessage('No__Activity')}
              </Typography>
            </Box>
          }
        </Box>
        : [1, 2].map((index) => {
          return (
            <ListItem
              key={index}
              secondaryAction={
                <EndListItemText primary="..." secondary="..." />
              }
            >
              <ListItemAvatar>
                <Skeleton variant="circular" width={35} height={35} />
              </ListItemAvatar>
              <StartListItemText primary="..." price="..." />
            </ListItem>
          );
        })}
    </ThemeProvider>
  );

};

export default TransferList;
