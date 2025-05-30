import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import ArrowDropUpRoundedIcon from '@mui/icons-material/ArrowDropUpRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import {
  ToggleButtonGroup,
  ToggleButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  ButtonBase,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AreaChart, Area, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { Period, type PriceProvider } from '@/shared/types/network-types';
import { getPeriodFrequency } from '@/shared/utils/getPeriodFrequency';
import {
  IconKraken,
  IconBinance,
  IconCoinbase,
  IconKucoin,
  IconHuobi,
} from '@/ui/components/iconfont';
import { useWallet } from 'ui/utils';

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    margin: theme.spacing(0.5),
    border: 0,
    '&.Mui-disabled': {
      border: 0,
    },
    '&:not(:first-of-type)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-of-type': {
      borderRadius: theme.shape.borderRadius,
    },
    alignSelf: 'center',
  },
}));

const Binance = () => {
  return (
    <Box sx={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      <IconBinance size={20} />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ fontWeight: 'medium', fontSize: '12px', alignSelf: 'center' }}
      >
        {chrome.i18n.getMessage('Binance')}
      </Typography>
    </Box>
  );
};

const Kraken = () => {
  return (
    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      <IconKraken size={15} />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ fontWeight: 'medium', fontSize: '12px', alignSelf: 'center' }}
      >
        {chrome.i18n.getMessage('Kraken')}
      </Typography>
    </Box>
  );
};

const Coinbase = () => {
  return (
    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      <IconCoinbase size={15} />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ fontWeight: 'medium', fontSize: '12px', alignSelf: 'center' }}
      >
        {chrome.i18n.getMessage('Coinbase')}
      </Typography>
    </Box>
  );
};

const Kucoin = () => {
  return (
    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      <IconKucoin size={15} />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ fontWeight: 'medium', fontSize: '12px', alignSelf: 'center' }}
      >
        {chrome.i18n.getMessage('Kucoin')}
      </Typography>
    </Box>
  );
};

const Huobi = () => {
  return (
    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      <IconHuobi size={15} />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ fontWeight: 'medium', fontSize: '12px', alignSelf: 'center' }}
      >
        {chrome.i18n.getMessage('Huobi')}
      </Typography>
    </Box>
  );
};

const PriceCard = ({ token, price, setPrice, providers }) => {
  const wallet = useWallet();
  const [data, setData] = useState([]);
  // const [loading, setLoading] = useState(false)
  const [period, setPeriod] = React.useState(Period.oneDay);
  const [change, setChange] = useState(0);
  const mountedRef = useRef(true);
  //   const [priceProvider, setPriceProvider] = useState('binance')

  // FIX ME: Add HUOBI
  const priceProviders = providers;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const open = Boolean(anchorEl);
  const handleClickListItem = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (event, index) => {
    setSelectedIndex(index);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const fetchPrice = useCallback(
    async (provider: PriceProvider) => {
      const response = await wallet.openapi.getTokenPrice(token, provider);
      if (mountedRef.current) {
        setPrice(response['price']['last']);
        const percentage = response['price']['change']['percentage'] * 100;
        setChange(percentage);
      }
    },
    [token, wallet.openapi, setPrice]
  );

  const fetchPriceHistory = useCallback(
    async (period: Period, provider: PriceProvider) => {
      wallet.openapi.getTokenPriceHistory(token, period, provider).then((response) => {
        const frequency = getPeriodFrequency(period);
        const data = response[frequency].map((item) => ({
          closeTime: item[0],
          openPrice: item[1],
          highPrice: item[2],
          lowPrice: item[3],
          price: item[4],
          volume: item[5],
          quoteVolume: item[6],
        }));
        setData(data);
      });
    },
    [token, wallet.openapi]
  );
  const currentProvider = useCallback((): PriceProvider => {
    return priceProviders[selectedIndex] as PriceProvider;
  }, [selectedIndex, priceProviders]);

  useEffect(() => {
    // FIX ME: Memory leak
    const timerId = setTimeout(() => {
      fetchPrice(currentProvider());
      fetchPriceHistory(period, currentProvider());
    }, 400);

    return () => clearTimeout(timerId);
  }, [fetchPrice, fetchPriceHistory, period, currentProvider]);

  useEffect(() => {
    fetchPrice(currentProvider());
    fetchPriceHistory(period, currentProvider());
  }, [selectedIndex, period, fetchPrice, fetchPriceHistory, currentProvider]);

  const isUp = (): boolean => {
    return change >= 0;
  };

  const handlePeriod = (event: React.MouseEvent<HTMLElement>, newPeriod: string) => {
    const period = newPeriod as Period;
    if (period) {
      setPeriod(period);
      fetchPriceHistory(period, currentProvider());
    }
  };

  const Provider = (index) => {
    const priceProvider = providers[index];
    switch (priceProvider) {
      case 'kraken':
        return <Kraken />;
      case 'binance':
        return <Binance />;
      case 'coinbase-pro':
        return <Coinbase />;
      case 'kucoin':
        return <Kucoin />;
      case 'huobi':
        return <Huobi />;
      default:
        return <div />;
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && data && payload && data.length > 0 && payload.length > 0) {
      const data = payload[0].payload;
      const date = dayjs.unix(data.closeTime);
      const showHour = period === Period.oneDay || period === Period.oneWeek;
      return (
        <Box
          className="custom-tooltip"
          sx={{
            backgroundColor: 'neutral.main',
            borderRadius: '8px',
            padding: '5px',
            border: '1px solid #4C4C4C',
          }}
        >
          <Typography
            variant="body1"
            color="text.primary"
            sx={{ fontWeight: 'medium', fontSize: '12px', alignSelf: 'center' }}
          >
            {'$' + data.price}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontWeight: 'medium', fontSize: '10px', alignSelf: 'center' }}
          >
            {date.format(showHour ? 'YYYY-MM-DD hh:mm' : 'YYYY-MM-DD')}
          </Typography>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: 'background.default',
        flexDirection: 'column',
        display: 'flex',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', px: '18px', pt: '12px', pb: '4px', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex' }}>
          <Box
            sx={{ display: 'flex', alignItems: 'baseline', gap: '2px', flexDirection: 'column' }}
          >
            <Typography variant="body1" sx={{ fontSize: '16px', fontWeight: '600' }}>
              {chrome.i18n.getMessage('Recent_Price')}
            </Typography>
            <Box sx={{ display: 'flex', gap: '8px', alignItem: 'center' }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: 'medium', fontSize: '16px', alignSelf: 'center' }}
              >{`$${price}`}</Typography>
              <Box
                sx={{
                  display: 'flex',
                  backgroundColor: isUp() ? '#182810' : '#271716',
                  py: '1px',
                  pl: '2px',
                  pr: '6px',
                  borderRadius: '6px',
                  alignItem: 'center',
                }}
              >
                {isUp() ? (
                  <ArrowDropUpRoundedIcon color="success" />
                ) : (
                  <ArrowDropDownRoundedIcon color="error" />
                )}
                <Typography
                  variant="body1"
                  color={isUp() ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 'medium', fontSize: '12px', alignSelf: 'center' }}
                >{`${change.toFixed(2)}%`}</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <ButtonBase onClick={handleClickListItem}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <Box sx={{ display: 'flex', gap: '2px' }}>
                <KeyboardArrowDownRoundedIcon color="info" fontSize="small" />
                <Typography
                  variant="body1"
                  color="text.nonselect"
                  sx={{
                    fontWeight: 'medium',
                    fontSize: '10px',
                    alignSelf: 'center',
                    textTransform: 'uppercase',
                  }}
                >
                  {chrome.i18n.getMessage('Data_from')}
                </Typography>
              </Box>
              {Provider(selectedIndex)}
            </Box>
          </ButtonBase>
        </Box>

        {/* <Box sx={{display: 'flex', alignItems: 'baseline', gap: '2px', flexDirection: 'column',}}> */}
        <StyledToggleButtonGroup
          size="small"
          value={period}
          exclusive
          onChange={handlePeriod}
          aria-label="text alignment"
          sx={{ justifyContent: 'space-between' }}
        >
          <ToggleButton value="1D" size="small" aria-label="oneDay">
            {chrome.i18n.getMessage('1D')}
          </ToggleButton>
          <ToggleButton value="1W" size="small" aria-label="oneWeek">
            {chrome.i18n.getMessage('1W')}
          </ToggleButton>
          <ToggleButton value="1M" size="small" aria-label="oneMonth">
            {chrome.i18n.getMessage('1M')}
          </ToggleButton>
          <ToggleButton value="3M" size="small" aria-label="threeMonth">
            {chrome.i18n.getMessage('3M')}
          </ToggleButton>
          <ToggleButton value="1Y" size="small" aria-label="oneYear">
            {chrome.i18n.getMessage('1Y')}
          </ToggleButton>
          <ToggleButton value="All" size="small" aria-label="all">
            {chrome.i18n.getMessage('All')}
          </ToggleButton>
        </StyledToggleButtonGroup>
        {/* </Box> */}
      </Box>
      <ResponsiveContainer width="100%" aspect={8.0 / 4.0}>
        <AreaChart
          width={500}
          height={400}
          data={data}
          margin={{
            right: -15,
          }}
        >
          {/* <CartesianGrid  /> */}
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#41CC5D" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#121212" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <YAxis
            orientation="right"
            domain={['auto', 'auto']}
            dataKey="price"
            tickFormatter={(item) => {
              return '$' + item;
            }}
          />

          <Tooltip
            content={
              //@ts-ignore
              <CustomTooltip />
            }
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#41CC5D"
            fillOpacity={1}
            fill="url(#colorUv)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {priceProviders.map((item, index) => (
          <MenuItem
            selected={index === selectedIndex}
            onClick={(event) => handleMenuItemClick(event, index)}
            key={index}
          >
            {Provider(index)}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default PriceCard;
