import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  ListItemText,
  Select,
  MenuItem,
  ListItemIcon,
  FormControl,
  InputAdornment,
  Input,
  Chip,
  Tooltip
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import IconFlow from '../../../components/iconfont/IconFlow';
import IconSwitch from '../../../components/iconfont/IconSwitch';
import CancelIcon from '../../../components/iconfont/IconClose';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import { StyledEngineProvider } from '@mui/material/styles';
import BN from 'bignumber.js';
import { Presets } from 'react-component-transition';

const useStyles = makeStyles(() => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    minHeight: '64px',
    paddingRight: '12px',
    paddingLeft: '0',
    py: '14px',
    zIndex: '999',
    fontSize: '24px',
    backgroundColor: '#282828',
    borderRadius: '12px',
    boxSizing: 'border-box',
  },
  selectRoot: {
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    borderRadius: '0.75em',
    marginRight: '0',
    textAlign: 'left',
    lineHeight: '1.5',
    display: 'flex',
    gap: '8px',
    color: '#CDD2D7',
    border: '1px solid #282828',

    // &.${selectUnstyledClasses.expanded} {
    //   &::after {
    //     content: '▴';
    //   }
    // }

    // &::after {
    //   content: '▾';
    //   float: right;
    // }
    '&ul': {
      fontFamily: 'IBM Plex Sans, sans-serif',
      fontSize: '0.875rem',
      boxSizing: 'border-box',
      padding: '5px',
      margin: '10px 0',
      maxHeight: '400px',
      backgroundColor: '#282828',
      border: 'none',
      borderRadius: '0.75em',
      color: '#CDD2D7',
      overflow: 'auto',
      outline: '0px',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none !important',
      borderWidth: '0px !important',
      outline: 'none !important',
    }
  },
  selectList: {
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    padding: '5px',
    margin: '10px 0',
    maxHeight: '400px',
    backgroundColor: '#282828',
    border: '1px solid #787878',
    borderRadius: '0.75em',
    color: '#CDD2D7',
    overflow: 'auto',
    outline: '0px',

  },
  exceedBox: {
    background: 'rgba(196,69,54,0.08)',
    display: 'flex',
    height: '25px',
  },
}));


const TransferAmount = ({ amount, setAmount, secondAmount, setSecondAmount, exceed, setExceed, coinInfo, setCurrentCoin, coinList, minAmount }) => {
  const classes = useStyles();
  const [coin, setCoin] = useState<string>('flow');
  const [coinType, setCoinType] = useState<any>(0);
  const handleMaxClick = () => {
    if (coinInfo) {
      if (coinInfo.unit.toLowerCase() === 'flow') {
        setAmount(coinInfo.balance - minAmount)
      } else {
        // const minimumValue = minAmount > 0.001 ? minAmount : 0.001;
        const newAmount = coinInfo.balance - 0;
        setAmount(newAmount);
      }
    }
  }

  const renderValue = (option) => {
    setCurrentCoin(option);
    setCoin(option);
    const selectCoin = coinList.find(coin => coin.unit === option)
    return (
      selectCoin && <img src={selectCoin.icon} style={{ height: '24px', width: '24px' }} />
    );
  }

  const swap = () => {
    setCoinType(!coinType);
  };

  const currentCoinType = () => {
    setCoin(coinInfo.unit);
  };

  useEffect(() => {
    currentCoinType();
  }, []);

  useEffect(() => {
    if (coinType) {
      const secondInt = parseInt(secondAmount)
      const value = new BN(secondInt)
        .dividedBy(new BN(coinInfo.price))
        .toNumber()
      if (coinInfo.balance - value < 0) {
        setExceed(true);
      } else {
        setExceed(false);
      }
      if (isNaN(value)) {
        setAmount(0)
      } else {
        setAmount(parseFloat(value.toFixed(3)))
      }
    }
  }, [secondAmount])

  useEffect(() => {
    if (!coinType) {
      if (coinInfo && amount) {
        const result = parseFloat((coinInfo.amountbalance - amount).toPrecision())
        if (coinInfo.balance - amount < 0) {
          setExceed(true);
        } else {
          if (coin === 'flow' && result < 0.001) {
            setExceed(true);
          } else {
            setExceed(false);
          }
        }
        const value = new BN(amount)
          .times(new BN(coinInfo.price))
          .toFixed(3);
        setSecondAmount(value)
      }
    }
  }, [amount, coin])

  return (
    <StyledEngineProvider injectFirst>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0'
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          px: '4px',
          backgroundColor: 'neutral.main',
          zIndex: 1000
        }}>
          {coinType ?
            <Box sx={{ width: '100%', display: 'flex' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', padding: '0 14px 0 14px', fontSize: '16px' }}>
                <Typography>$</Typography>
              </Box>
              <FormControl sx={{ flex: '1', display: 'flex' }}>
                <Input
                  id="textfield"
                  className={classes.inputBox}
                  placeholder={chrome.i18n.getMessage('Amount')}
                  autoFocus
                  fullWidth
                  disableUnderline
                  autoComplete="off"
                  value={secondAmount}
                  type='number'
                  onChange={(event) => {
                    // let value = event.target.value;
                    // value = (Math.round(value * 100) / 100).toFixed(2)
                    setExceed(false);
                    setSecondAmount(event.target.value);
                  }}
                  inputProps={{ sx: { fontSize: '24px' } }}
                  endAdornment={
                    <Tooltip title={coin === 'flow' ? chrome.i18n.getMessage('on_Flow_the_balance_cant_less_than_0001_FLOW') : ''} arrow>
                      <InputAdornment position="end">
                        <Chip label={chrome.i18n.getMessage('Inbox')} size="small" onClick={handleMaxClick} sx={{ padding: '2px 5px' }} />
                      </InputAdornment>
                    </Tooltip>
                  }
                />
              </FormControl>
            </Box>
            :
            <Box sx={{ width: '100%', display: 'flex' }}>
              <Select
                renderValue={renderValue}
                className={classes.selectRoot}
                defaultValue={coinInfo.unit}
                MenuProps={{
                  MenuListProps: { disablePadding: true },
                  PaperProps: {
                    style: {
                      zIndex: 2000,
                    },
                  },
                }}
                sx={{ zIndex: 2000 }}
              >
                {
                  coinList.map(coin => (
                    <MenuItem value={coin.unit} key={coin.unit} sx={{ zIndex: 2000 }}>
                      <ListItemIcon>
                        <img src={coin.icon} style={{ height: '24px', width: '24px' }} />
                      </ListItemIcon>
                      <ListItemText>{coin.coin}</ListItemText>
                    </MenuItem>
                  ))
                }
              </Select>
              <FormControl sx={{ flex: '1', display: 'flex' }}>
                <Input
                  id="textfield"
                  className={classes.inputBox}
                  placeholder={chrome.i18n.getMessage('Amount')}
                  autoFocus
                  fullWidth
                  disableUnderline
                  autoComplete="off"
                  value={amount}
                  type='number'
                  onChange={(event) => {
                    // let value = event.target.value;
                    // value = (Math.round(value * 100) / 100).toFixed(2)
                    setExceed(false);
                    setAmount(event.target.value);
                  }}
                  inputProps={{ sx: { fontSize: '24px' } }}
                  endAdornment={
                    <InputAdornment position="end">
                      <Chip label={chrome.i18n.getMessage('Max')} size="small" onClick={handleMaxClick} sx={{ padding: '2px 5px' }} />
                    </InputAdornment>
                  }
                />
              </FormControl>
            </Box>
          }
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '4px',
              mx: '12px',
              mb: '14px'
            }}
          >
            <Typography>≈</Typography>
            {coinType ?
              <IconFlow size={16} />
              :
              <AttachMoneyRoundedIcon
                style={{ fontSize: '16px' }}
                color="secondary"
              />}
            {coinType ?
              <Typography>{amount}</Typography>
              :
              <Typography>{secondAmount}</Typography>
            }
            <IconButton onClick={swap}>
              <IconSwitch size={14} />
            </IconButton>
          </Box>
        </Box>
        <Presets.TransitionSlideUp>
          {exceed &&
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
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: coin === 'flow' ? '0.7rem' : '1rem' }}>
                {chrome.i18n.getMessage('Insufficient_balance') + (coin === 'flow' ? chrome.i18n.getMessage('on_Flow_the_balance_cant_less_than_0001_FLOW') : '')}
              </Typography>
            </Box>
          }
        </Presets.TransitionSlideUp>


      </Box>
    </StyledEngineProvider>
  );
};

export default TransferAmount;
