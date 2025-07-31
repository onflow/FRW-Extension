import {
  Box,
  CircularProgress,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Switch,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

import { type ExtendedTokenInfo, type TokenFilter } from '@onflow/frw-shared/types';

import VerifiedIcon from '@/ui/assets/svg/verfied-check.svg';
import IconCheckmark from '@/ui/components/iconfont/IconCheckmark';
import IconPlus from '@/ui/components/iconfont/IconPlus';
import { CurrencyValue } from '@/ui/components/TokenLists/CurrencyValue';
import { TokenBalance } from '@/ui/components/TokenLists/TokenBalance';
import { useCurrency } from '@/ui/hooks/preference-hooks';

import TokenAvatar from './TokenAvatar';

// Custom styled ListItem to override default secondaryAction styles
const CustomListItem = styled(ListItem)({
  '& .MuiListItemSecondaryAction-root': {
    right: 0, // Override the default right: 16px
    top: '50%', // Center vertically
    transform: 'translateY(-50%)', // Adjust for vertical centering
  },
});
type TokenItemProps = {
  token: ExtendedTokenInfo;
  isLoading?: boolean;
  enabled?: boolean;
  onClick?: (token: ExtendedTokenInfo, enabled: boolean) => void;
  tokenFilter?: TokenFilter;
  updateTokenFilter?: (tokenFilter: TokenFilter) => void;
  showSwitch?: boolean;
  // Custom styling props
  backgroundColor?: string;
  fontSize?: string | number;
  selected?: boolean;
  customSx?: any;
  // Display options
  showBalance?: boolean;
  showPrice?: boolean;
};

const TokenItem: React.FC<TokenItemProps> = ({
  token,
  isLoading = false,
  enabled = false,
  onClick = undefined,
  tokenFilter = undefined,
  updateTokenFilter,
  showSwitch = false,
  backgroundColor = '#000000',
  fontSize = '14px',
  selected = false,
  customSx = {},
  showBalance = false,
  showPrice = false,
}) => {
  const currency = useCurrency();
  const handleClick = () => {
    if (onClick) {
      onClick(token, enabled);
    }
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (updateTokenFilter) {
      const isChecked = event.target.checked;
      const newFilteredIds = isChecked
        ? tokenFilter?.filteredIds.filter((id) => id !== token.id)
        : [...(tokenFilter?.filteredIds ?? []), token.id];

      updateTokenFilter({
        ...(tokenFilter ?? {}),
        filteredIds: newFilteredIds ?? [],
        hideDust: tokenFilter?.hideDust ?? false,
        hideUnverified: tokenFilter?.hideUnverified ?? false,
      });
    }
  };

  return (
    <ListItemButton
      sx={{
        mx: '8px',
        py: '4px',
        my: '8px',
        backgroundColor: selected ? '#2A2A2A' : backgroundColor,
        borderRadius: '12px',
        border: selected ? '1px solid #4A4A4A' : '1px solid #2A2A2A',
        '&:hover': {
          backgroundColor: selected ? '#2A2A2A' : '#1A1A1A',
        },
        ...customSx,
      }}
      onClick={showSwitch ? undefined : handleClick}
      disableRipple={showSwitch}
      selected={selected}
    >
      <CustomListItem
        disablePadding
        secondaryAction={
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {showSwitch ? (
              <Switch
                checked={!tokenFilter?.filteredIds?.includes(token.id)}
                onChange={handleSwitchChange}
                edge="end"
              />
            ) : showBalance ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '2px',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: typeof fontSize === 'number' ? `${fontSize * 0.9}px` : fontSize,
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  <TokenBalance
                    value={token.balance || '0'}
                    decimals={token.decimals || 18}
                    displayDecimals={2}
                  />{' '}
                  {token.symbol.toUpperCase()}
                </Typography>
                {token.total && parseFloat(token.total) > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: typeof fontSize === 'number' ? `${fontSize * 0.7}px` : fontSize,
                      color: 'text.secondary',
                    }}
                  >
                    <CurrencyValue
                      value={token.total}
                      currencyCode={currency?.code ?? ''}
                      currencySymbol={currency?.symbol ?? ''}
                    />
                  </Typography>
                )}
              </Box>
            ) : (
              <IconButton edge="end" aria-label="delete" onClick={handleClick}>
                {isLoading ? (
                  <CircularProgress color="primary" size={20} />
                ) : enabled ? (
                  <IconCheckmark color="white" size={24} />
                ) : (
                  <IconPlus color="white" size={20} />
                )}
              </IconButton>
            )}
          </Box>
        }
      >
        <ListItemAvatar>
          <TokenAvatar symbol={token.symbol} src={token.logoURI} width={36} height={36} />
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="body1"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '210px',
                  fontSize: fontSize,
                }}
              >
                {showPrice ? token.symbol.toUpperCase() : token.name}
              </Typography>
              {token.isVerified && (
                <img
                  src={VerifiedIcon}
                  alt="Verified"
                  style={{
                    height: '16px',
                    width: '16px',
                    backgroundColor: '#282828',
                    borderRadius: '18px',
                    marginLeft: token.name.length * 8 > 210 ? '-12px' : '4px',
                    marginRight: '18px',
                  }}
                />
              )}
            </Box>
          }
          secondary={
            showSwitch ? (
              <CurrencyValue
                value={token.total?.toString() ?? ''}
                currencyCode={currency?.code ?? ''}
                currencySymbol={currency?.symbol ?? ''}
              />
            ) : showPrice ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {token.price && parseFloat(token.price) > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: typeof fontSize === 'number' ? `${fontSize * 0.7}px` : fontSize,
                      color: 'text.secondary',
                    }}
                  >
                    <CurrencyValue
                      value={token.price}
                      currencyCode={currency?.code ?? ''}
                      currencySymbol={currency?.symbol ?? ''}
                    />
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  fontSize: typeof fontSize === 'number' ? `${fontSize * 0.8}px` : fontSize,
                }}
              >
                {token.symbol.toUpperCase()}
              </Typography>
            )
          }
        />
      </CustomListItem>
    </ListItemButton>
  );
};

export default TokenItem;
