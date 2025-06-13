import { ListItem, ListItemButton, ListItemIcon, Typography, CardMedia } from '@mui/material';
import React from 'react';

interface ProfileButtonProps {
  icon: string;
  text: string;
  onClick: () => Promise<void>;
  dataTestId?: string;
}

/**
 * A button component that displays an icon and a text for profile creation and recovery.
 * It redirect the extension to the profile creation and recovery page when clicked.
 */
export const ProfileButton = ({ icon, text, onClick, dataTestId }: ProfileButtonProps) => {
  return (
    <ListItem disablePadding onClick={onClick} data-testid={dataTestId}>
      <ListItemButton sx={{ padding: '16px', margin: '0' }}>
        <ListItemIcon
          sx={{
            width: '24px',
            minWidth: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
          }}
        >
          <CardMedia component="img" sx={{ width: '24px', height: '24px' }} image={icon} />
        </ListItemIcon>
        <Typography
          variant="body1"
          component="div"
          display="inline"
          sx={{
            color: 'rgba(255, 255, 255, 0.80)',
            fontFamily: 'Inter',
            fontSize: '15px',
            fontStyle: 'normal',
            fontWeight: 500,
            lineHeight: '20px',
          }}
        >
          {text}
        </Typography>
      </ListItemButton>
    </ListItem>
  );
};
