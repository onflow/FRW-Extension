import { ListItem, ListItemButton, ListItemText, ListItemIcon, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';

import IconEnd from '@/ui/components/iconfont/IconAVector11Stroke';
import { COLOR_WHITE_ALPHA_80_FFFFFFCC } from '@/ui/style/color';

interface SettingButtonProps {
  label: string;
  to?: string;
  onClick?: () => void;
  showArrow?: boolean;
}

const SettingButton: React.FC<SettingButtonProps> = ({ label, to, onClick, showArrow = true }) => {
  return (
    <ListItem
      component={to ? Link : 'div'}
      to={to}
      disablePadding
      sx={{
        height: '66px',
        width: '100%',
        '&:hover': {
          backgroundColor: '#282828',
        },
      }}
      onClick={onClick}
    >
      <ListItemButton
        sx={{
          width: to ? '90%' : '100%',
          height: '100%',
          margin: '0 auto',
          '&:hover': {
            backgroundColor: '#282828',
          },
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          sx={{ color: COLOR_WHITE_ALPHA_80_FFFFFFCC, fontSize: '16px', fontWeight: 400 }}
        >
          {label}
        </Typography>
        {showArrow && (
          <ListItemIcon aria-label="end" sx={{ minWidth: '15px' }}>
            <IconEnd size={12} />
          </ListItemIcon>
        )}
      </ListItemButton>
    </ListItem>
  );
};

export default SettingButton;
