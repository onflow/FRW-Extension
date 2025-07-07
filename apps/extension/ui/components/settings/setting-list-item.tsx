import { ListItem, ListItemButton, ListItemText, Typography, Box } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router';

import IconEnd from '@/ui/components/iconfont/IconAVector11Stroke';
import { COLOR_WHITE_ALPHA_10_FFFFFF1A, COLOR_WHITE_ALPHA_80_FFFFFFCC } from '@/ui/style/color';

interface SettingsListItemUniversalProps {
  to?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  text?: string;
  endIcon?: React.ReactNode;
  showArrow?: boolean;
  address?: string;
  addressLabel?: string;
}

const SettingsListItem: React.FC<SettingsListItemUniversalProps> = ({
  to,
  onClick,
  icon,
  text,
  endIcon,
  showArrow = true,
}) => {
  const navigate = useNavigate();
  const baseButtonSx = {
    height: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'unset',
  };

  const listItemSx = { padding: '0' };

  const buttonSx = {
    ...baseButtonSx,
    padding: '16px',
    height: '56px',
    '&:hover': { backgroundColor: COLOR_WHITE_ALPHA_10_FFFFFF1A },
  };

  const content = icon ? (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '25px', marginRight: '14px' }}>
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
      {endIcon ||
        (showArrow && (
          <Box sx={{ minWidth: '15px', marginLeft: '8px', display: 'flex', alignItems: 'center' }}>
            {endIcon || <IconEnd size={12} />}
          </Box>
        ))}
    </Box>
  ) : (
    <>
      <Typography sx={{ color: COLOR_WHITE_ALPHA_80_FFFFFFCC, fontSize: '16px', fontWeight: 400 }}>
        {text}
      </Typography>
      {endIcon ||
        (showArrow && (
          <Box sx={{ minWidth: '15px', marginLeft: '8px' }}>{endIcon || <IconEnd size={12} />}</Box>
        ))}
    </>
  );

  const handleClick = () => {
    if (to) {
      // Check if it's an external URL
      if (to.startsWith('http://') || to.startsWith('https://')) {
        window.open(to, '_blank', 'noopener,noreferrer');
      } else {
        navigate(to);
      }
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <ListItem disablePadding sx={listItemSx}>
      <ListItemButton sx={buttonSx} onClick={handleClick}>
        {content}
      </ListItemButton>
    </ListItem>
  );
};

export default SettingsListItem;
