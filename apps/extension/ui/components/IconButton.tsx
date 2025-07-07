import { Button, CardMedia, Typography } from '@mui/material';
import React, { useState } from 'react';

interface IconButtonProps {
  messageKey: string;
  onClick: () => void;
  showLabel?: boolean;
  icon: string;
  customSx?: object;
}

export const IconButton: React.FC<IconButtonProps> = ({
  messageKey,
  onClick,
  showLabel = true,
  icon,
  customSx = {},
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <Button
        color="info3"
        variant="contained"
        data-testid={`${messageKey.toLowerCase()}-button`}
        sx={{
          height: '38px',
          width: '38px',
          minWidth: '38px',
          borderRadius: '50%',
          padding: '0 !important',
          backgroundColor: '#1DB954', // Spotify-like green color
          '&:hover': {
            backgroundColor: '#1ed760', // Slightly lighter green on hover
          },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          ...customSx,
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardMedia
          sx={{
            width: '20px',
            height: '20px',
            color: '#FFFFFF', // This will make the SVG white
            transition: 'color 0.2s ease-in-out',
            '&:hover': {
              color: '#000000', // This will make the SVG black on hover
            },
          }}
          image={icon}
        />
      </Button>
      {showLabel && (
        <Typography
          sx={{
            fontSize: '12px',
            color: '#777E90',
            textAlign: 'center',
          }}
        >
          {chrome.i18n.getMessage(messageKey)}
        </Typography>
      )}
    </div>
  );
};
