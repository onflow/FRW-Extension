import {
  Typography,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  Skeleton,
  ListItemButton,
  List,
  IconButton,
  Avatar,
} from '@mui/material';
import { Box } from '@mui/system';
import React from 'react';
import { useNavigate } from 'react-router';

import { type CoinItem } from '@/shared/types/coin-types';
import { type ActiveAccountType } from '@/shared/types/wallet-types';
import { type ChildAccountFtStore } from '@/shared/utils/cache-data-keys';
import { TokenBalance } from '@/ui/components/TokenLists/TokenBalance';
import { useCurrency } from '@/ui/hooks/preference-hooks';
import { useCoins } from '@/ui/hooks/useCoinHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';

import plus from '../../assets/svg/plus.svg';
import slider from '../../assets/svg/slider.svg';
import VerifiedIcon from '../../assets/svg/verfied-check.svg';
import { CurrencyValue } from '../../components/TokenLists/CurrencyValue';

const ActionButtons = ({ managePath, createPath }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', px: '12px', pt: '4px', gap: '12px' }}>
      <Box sx={{ flexGrow: 1 }} />
      <IconButton
        onClick={() => navigate(managePath)}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
          borderRadius: '100px',
          background: 'rgba(255, 255, 255, 0.10)',
          '&:hover': {
            opacity: 0.8,
          },
        }}
      >
        <img src={slider} alt="Manage" style={{ width: '20px', height: '20px' }} />
      </IconButton>
      <IconButton
        onClick={() => navigate(createPath)}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
          borderRadius: '100px',
          background: 'rgba(255, 255, 255, 0.10)',
          '&:hover': {
            opacity: 0.8,
          },
        }}
      >
        <img src={plus} alt="Add" style={{ width: '20px', height: '20px' }} />
      </IconButton>
    </Box>
  );
};

const CoinList = ({
  ableFt,
  isActive,
  activeAccountType,
}: {
  ableFt: ChildAccountFtStore;
  isActive: boolean;
  activeAccountType: ActiveAccountType;
}) => {
  // const wallet = useWallet();
  const { noAddress } = useProfiles();
  const { coins, tokenFilter } = useCoins();
  const currency = useCurrency();
  const currencyCode = currency?.code;
  const currencySymbol = currency?.symbol;
  const navigate = useNavigate();

  const isLoading = coins === undefined;

  const CoinBalance = ({
    balance,
    decimals,
    fiatBalance,
    unit,
  }: {
    balance?: string;
    decimals?: number;
    fiatBalance?: string;
    unit: string;
  }) => {
    const loading = isLoading || balance === undefined || fiatBalance === undefined;
    return (
      <ListItemText
        disableTypography={true}
        primary={
          <Typography
            variant="body1"
            sx={{ fontSize: 14, fontWeight: '550', textAlign: 'end', color: 'text.title' }}
            data-testid={`coin-balance-${unit.toLowerCase()}`}
          >
            {loading ? (
              <Skeleton variant="text" width={35} height={15} />
            ) : (
              <>
                <TokenBalance value={balance} decimals={decimals} displayDecimals={2} />{' '}
                {unit.length > 6 ? `${unit.slice(0, 6)}` : unit.toUpperCase()}
              </>
            )}
          </Typography>
        }
        secondary={
          !loading ? (
            <Typography
              variant="body1"
              sx={{ fontSize: 12, fontWeight: '500', textAlign: 'end', color: 'text.secondary' }}
            >
              {fiatBalance === null || fiatBalance === '0' || parseFloat(balance) === 0 ? (
                ''
              ) : (
                <CurrencyValue
                  value={fiatBalance}
                  currencyCode={currencyCode ?? ''}
                  currencySymbol={currencySymbol ?? ''}
                />
              )}
            </Typography>
          ) : (
            <Skeleton variant="text" width={35} height={15} />
          )
        }
      />
    );
  };

  const StartListItemText = (props: {
    name: string | null;
    price: string;
    change: number;
    isVerified: boolean;
    id: string;
  }) => {
    return (
      <ListItemText
        disableTypography={true}
        primary={
          !isLoading && props.name ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Typography
                variant="body1"
                sx={{
                  fontSize: 14,
                  fontWeight: '550',
                  textAlign: 'left',
                  color: 'text.title',
                  maxWidth: '160px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  direction: 'rtl',
                  unicodeBidi: 'plaintext',
                }}
              >
                {props.name}
              </Typography>
              {props.isVerified && (
                <img
                  src={VerifiedIcon}
                  style={{
                    height: '16px',
                    width: '16px',
                    backgroundColor: '#282828',
                    borderRadius: '18px',
                    marginLeft: props.name.length * 8 > 160 ? '-8px' : '0',
                  }}
                />
              )}
            </Box>
          ) : (
            <Skeleton variant="text" width={45} height={15} />
          )
        }
        secondary={
          !isLoading ? (
            <Box sx={{ display: 'flex', gap: '3px' }}>
              {ableFt.some((item) => {
                const parts = item.id.split('.');
                return parts[2] && props.name && parts[2].includes(props.name);
              }) ||
              isActive ||
              props.id?.toLowerCase().includes('flowtoken') ? (
                <Box sx={{ display: 'flex' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: 12,
                      fontWeight: '500',
                      textAlign: 'start',
                      color: 'text.secondary',
                      marginRight: '6px',
                    }}
                  >
                    {props.change === null ? '-' : ''}
                    <CurrencyValue
                      value={props.price}
                      currencyCode={currencyCode ?? ''}
                      currencySymbol={currencySymbol ?? ''}
                    />
                  </Typography>
                  {props.change !== 0 && (
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: 12,
                        fontWeight: '500',
                        textAlign: 'start',
                        color: props.change >= 0 ? 'text.increase' : 'text.decrease',
                      }}
                    >
                      {props.change === null ? '' : props.change >= 0 ? '+' : ''}
                      {props.change}
                      {props.change !== null ? '%' : ''}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    color: 'neutral.text',
                    marginTop: '2px',
                    fontSize: '10px',
                    fontFamily: 'Inter, sans-serif',
                    backgroundColor: 'neutral1.light',
                  }}
                >
                  {chrome.i18n.getMessage('Inaccessible')}
                </Box>
              )}
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
      {activeAccountType === 'main' && (
        <ActionButtons managePath="/dashboard/managetoken" createPath="/dashboard/tokenList" />
      )}
      {activeAccountType === 'evm' && (
        <ActionButtons managePath="/dashboard/managetoken" createPath="/dashboard/addcustomevm" />
      )}

      <List sx={{ paddingTop: '0px', paddingBottom: '0px' }}>
        {noAddress ? (
          <ListItem sx={{ justifyContent: 'center', minHeight: '62px' }}>
            <Typography variant="body1" color="text.secondary">
              {chrome.i18n.getMessage('No_address_found')}
            </Typography>
          </ListItem>
        ) : !isLoading ? (
          (coins || [])
            .filter((coin) => {
              if (tokenFilter.hideDust) {
                const isFlowToken =
                  coin.contractName === 'FlowToken' || coin.unit.toLowerCase() === 'flow';
                const isAboveDustThreshold = parseFloat(coin.balanceInUSD) >= 0.01;
                if (!isFlowToken && !isAboveDustThreshold) {
                  return false;
                }
              }
              if (tokenFilter.hideUnverified && !coin.isVerified) {
                return false;
              }
              if (tokenFilter.filteredIds.includes(coin.id)) {
                return false;
              }
              return true;
            })
            .map((coin: CoinItem) => {
              if (
                activeAccountType === 'evm' &&
                coin.id !== 'A.1654653399040a61.FlowToken' &&
                parseFloat(coin.balance) === 0 &&
                !coin.custom
              ) {
                return null;
              }
              return (
                <ListItem
                  sx={{ minHeight: '62px' }}
                  key={coin.id}
                  data-testid={`token-${coin.unit.toLowerCase()}`}
                  secondaryAction={
                    <CoinBalance
                      balance={coin.availableBalance || coin.balance}
                      decimals={coin.decimals || 18}
                      fiatBalance={coin.total}
                      unit={coin.unit}
                    />
                  }
                  disablePadding
                  onClick={() =>
                    navigate(`/dashboard/tokendetail/${coin.unit.toLowerCase()}/${coin.id}`)
                  }
                >
                  <ListItemButton sx={{ paddingRight: '0px' }} dense={true}>
                    <ListItemIcon>
                      {!isLoading ? (
                        <Avatar src={coin.logoURI} sx={{ width: 36, height: 36 }}>
                          {coin.symbol?.charAt(0)}
                        </Avatar>
                      ) : (
                        <Skeleton variant="circular" width={36} height={36} />
                      )}
                    </ListItemIcon>
                    <StartListItemText
                      name={coin.coin}
                      price={coin.price}
                      change={parseFloat(coin.change24h?.toFixed(2) || '0')}
                      isVerified={coin.isVerified || false}
                      id={coin.id}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })
        ) : (
          [1, 2].map((index) => {
            return (
              <ListItem key={index} secondaryAction={<CoinBalance unit={`unit${index}`} />}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={36} height={36} />
                </ListItemAvatar>
                <StartListItemText name="..." price={''} change={0} isVerified={false} id="" />
              </ListItem>
            );
          })
        )}
      </List>
    </>
  );
};

export default CoinList;
