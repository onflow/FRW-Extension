import {
  ListItemText,
  ListItem,
  Avatar,
  ListItemAvatar,
  IconButton,
  CircularProgress,
  ListItemButton,
} from '@mui/material';
import React from 'react';

import IconCheckmark from '../../../components/iconfont/IconCheckmark';
import IconPlus from '../../../components/iconfont/IconPlus';

const TokenItem = ({ token, isLoading, enabled, onClick }) => {
  const handleClick = () => {
    onClick(token, enabled);
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
      <ListItem
        disablePadding
        onClick={handleClick}
        secondaryAction={
          <IconButton edge="end" aria-label="delete" onClick={handleClick}>
            {isLoading ? (
              <CircularProgress color="primary" size={20} />
            ) : enabled ? (
              <IconCheckmark color="white" size={24} />
            ) : (
              <IconPlus color="white" size={20} />
            )}
          </IconButton>
        }
      >
        <ListItemAvatar>
          <Avatar src={token.logoURI} />
        </ListItemAvatar>
        <ListItemText primary={token.name} secondary={token.symbol.toUpperCase()} />
      </ListItem>
    </ListItemButton>
  );
};

export default TokenItem;
