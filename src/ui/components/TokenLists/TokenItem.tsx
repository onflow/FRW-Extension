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
import { styled, useTheme } from '@mui/material/styles';
import React from 'react';

import { type ExtendedTokenInfo, type TokenFilter } from '@onflow/frw-shared/types';

import VerifiedIcon from '@/ui/assets/svg/verfied-check.svg';
import IconCheckmark from '@/ui/components/iconfont/IconCheckmark';
import IconPlus from '@/ui/components/iconfont/IconPlus';
import { CurrencyValue } from '@/ui/components/TokenLists/CurrencyValue';
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
};

const TokenItem: React.FC<TokenItemProps> = ({
  token,
  isLoading = false,
  enabled = false,
  onClick = undefined,
  tokenFilter = undefined,
  updateTokenFilter,
  showSwitch = false,
}) => {
  const currency = useCurrency();
  const theme = useTheme();
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
        backgroundColor: theme.palette.common.black,
        borderRadius: '12px',
        border: `1px solid ${theme.palette.darkGray.main}`,
      }}
      onClick={showSwitch ? undefined : handleClick}
      disableRipple={showSwitch}
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            flex: 1,
            backgroundColor: theme.palette.background.paper,
            borderRadius: '12px',
            p: '12px',
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="body1"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    maxWidth: '210px',
                  }}
                >
                  {token.name}
                </Typography>
                {token.isVerified && (
                  <img
                    src={VerifiedIcon}
                    alt="Verified"
                    style={{
                      height: '16px',
                      width: '16px',
                      backgroundColor: theme.palette.background.paper,
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
              ) : (
                token.symbol.toUpperCase()
              )
            }
          />
        </Box>
      </CustomListItem>
    </ListItemButton>
  );
};

export default TokenItem;
