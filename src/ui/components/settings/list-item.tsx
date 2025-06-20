import { ListItem, ListItemButton, ListItemText, Box } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';

import { COLOR_WHITE_ALPHA_10_FFFFFF1A } from '@/ui/style/color';

interface SettingsListItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  endIcon?: React.ReactNode;
  onClick?: () => void;
}

export const SettingsListItem: React.FC<SettingsListItemProps> = ({
  to,
  icon,
  text,
  endIcon,
  onClick,
}) => {
  return (
    <ListItem component={Link} to={to} disablePadding sx={{ padding: '0' }} onClick={onClick}>
      <ListItemButton
        sx={{
          padding: ' 16px',
          height: '56px',
          '&:hover': {
            backgroundColor: COLOR_WHITE_ALPHA_10_FFFFFF1A,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            minWidth: '25px',
            marginRight: '14px',
          }}
        >
          {icon}
        </Box>
        <ListItemText
          primary={text}
          sx={{
            margin: 0,
            '& .MuiTypography-root': {
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: '120%',
              letterSpacing: '-0.084px',
            },
          }}
        />
        {endIcon && (
          <Box
            sx={{
              minWidth: '15px',
              marginLeft: '8px',
            }}
          >
            {endIcon}
          </Box>
        )}
      </ListItemButton>
    </ListItem>
  );
};
