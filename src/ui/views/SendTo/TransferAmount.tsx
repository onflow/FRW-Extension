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
  Tooltip,
} from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import React, { useCallback } from 'react';

import { type TransactionState } from '@/shared/types/transaction-types';
import CancelIcon from '@/ui/components/iconfont/IconClose';
import IconSwitch from '@/ui/components/iconfont/IconSwitch';
import SlideRelative from '@/ui/components/SlideRelative';
import { useCurrency } from '@/ui/hooks/preference-hooks';
import { useCoins } from '@/ui/hooks/useCoinHook';

import { CurrencyValue } from '../../components/TokenLists/CurrencyValue';
import { TokenBalance } from '../../components/TokenLists/TokenBalance';

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
    },
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
  const classes = useStyles();
  const { amount, fiatAmount } = transactionState;
  const { coins } = useCoins();
  const currency = useCurrency();
  const renderValue = useCallback(
    (option) => {
      if (!coins) return null;
      const selectCoin = coins.find((coin) => coin.unit.toLowerCase() === option.toLowerCase());
      if (selectCoin) {
        return <img src={selectCoin.icon} style={{ height: '24px', width: '24px' }} />;
      }
      return null;
    },
    [coins]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          px: '4px',
          backgroundColor: 'neutral.main',
          zIndex: 1000,
        }}
      >
        {transactionState.fiatOrCoin === 'fiat' ? (
          <Box sx={{ width: '100%', display: 'flex' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px 0 14px',
                fontSize: '16px',
              }}
            >
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
                value={fiatAmount}
                type="number"
                onChange={(event) => handleAmountChange(event.target.value)}
                inputProps={{ sx: { fontSize: '24px' } }}
                endAdornment={
                  <InputAdornment position="end">
                    <Tooltip
                      title={
                        transactionState.tokenInfo.unit === 'flow'
                          ? chrome.i18n.getMessage('on_Flow_the_balance_cant_less_than_0001_FLOW')
                          : ''
                      }
                      arrow
                    >
                      <Chip
                        label={chrome.i18n.getMessage('Max')}
                        size="small"
                        onClick={handleMaxClick}
                        sx={{ padding: '2px 5px' }}
                      />
                    </Tooltip>
                  </InputAdornment>
                }
              />
            </FormControl>
          </Box>
        ) : (
          <Box sx={{ width: '100%', display: 'flex' }}>
            {coins && (
              <Select
                renderValue={renderValue}
                onChange={(e) => handleTokenChange(e.target.value)}
                className={classes.selectRoot}
                value={transactionState.tokenInfo.symbol}
                defaultValue={transactionState.tokenInfo.symbol}
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
                {coins
                  .filter((coin) => Number(coin.balance) > 0)
                  .map((coin) => (
                    <MenuItem value={coin.unit} key={coin.unit} sx={{ zIndex: 2000 }}>
                      <ListItemIcon>
                        <img src={coin.icon} style={{ height: '24px', width: '24px' }} />
                      </ListItemIcon>
                      <ListItemText>{coin.coin}</ListItemText>
                    </MenuItem>
                  ))}
              </Select>
            )}
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
                onChange={(event) => handleAmountChange(event.target.value)}
                inputProps={{ sx: { fontSize: '24px' } }}
                endAdornment={
                  <InputAdornment position="end">
                    <Tooltip
                      title={
                        transactionState.tokenInfo.unit === 'flow'
                          ? chrome.i18n.getMessage('on_Flow_the_balance_cant_less_than_0001_FLOW')
                          : ''
                      }
                      arrow
                    >
                      <Chip
                        label={chrome.i18n.getMessage('Max')}
                        size="small"
                        onClick={handleMaxClick}
                        sx={{ padding: '2px 5px' }}
                      />
                    </Tooltip>
                  </InputAdornment>
                }
              />
            </FormControl>
          </Box>
        )}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '4px',
            mx: '12px',
            mb: '14px',
          }}
        >
          <Typography>≈</Typography>
          {transactionState.fiatOrCoin === 'fiat' ? (
            <>
              <img
                src={transactionState.tokenInfo.icon}
                style={{ height: '18px', width: '18px' }}
              />{' '}
              <TokenBalance showFull={true} value={amount} />
            </>
          ) : (
            <CurrencyValue
              value={fiatAmount}
              currencyCode={currency?.code ?? ''}
              currencySymbol={currency?.symbol ?? ''}
            />
          )}
          <IconButton onClick={handleSwitchFiatOrCoin}>
            <IconSwitch size={14} />
          </IconButton>
        </Box>
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
  );
};

export default TransferAmount;
