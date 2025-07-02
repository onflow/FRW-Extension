import {
  ListItemText,
  ListItem,
  Avatar,
  ListItemAvatar,
  IconButton,
  CircularProgress,
  ListItemButton,
  Switch,
  Box,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

import IconCheckmark from '@/ui/components/iconfont/IconCheckmark';
import IconPlus from '@/ui/components/iconfont/IconPlus';
import { CurrencyValue } from '@/ui/components/TokenLists/CurrencyValue';
import { useCurrency } from '@/ui/hooks/preference-hooks';

import VerifiedIcon from '../../assets/svg/verfied-check.svg';

// Custom styled ListItem to override default secondaryAction styles
const CustomListItem = styled(ListItem)({
  '& .MuiListItemSecondaryAction-root': {
    right: 0, // Override the default right: 16px
    top: '50%', // Center vertically
    transform: 'translateY(-50%)', // Adjust for vertical centering
  },
});

const TokenItem = ({
  token,
  isLoading,
  enabled,
  onClick,
  tokenFilter,
  updateTokenFilter,
  showSwitch = false,
}) => {
  const currency = useCurrency();
  const handleClick = () => {
    if (onClick) {
      onClick(token, enabled);
    }
  };

  const handleSwitchChange = (event) => {
    if (updateTokenFilter) {
      const isChecked = event.target.checked;
      const newFilteredIds = isChecked
        ? tokenFilter.filteredIds.filter((id) => id !== token.id)
        : [...tokenFilter.filteredIds, token.id];

      updateTokenFilter({ ...tokenFilter, filteredIds: newFilteredIds });
    }
  };

  return (
    <ListItemButton
      sx={{
        mx: '8px',
        py: '4px',
        my: '8px',
        backgroundColor: '#000000',
        borderRadius: '12px',
        border: '1px solid #2A2A2A',
      }}
    >
      <CustomListItem
        disablePadding
        onClick={showSwitch ? undefined : handleClick}
        secondaryAction={
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {showSwitch ? (
              <Switch
                checked={!tokenFilter.filteredIds.includes(token.id)}
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
          <Avatar src={token.logoURI} />
        </ListItemAvatar>
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
            ) : (
              token.symbol.toUpperCase()
            )
          }
        />
      </CustomListItem>
    </ListItemButton>
  );
};

export default TokenItem;
