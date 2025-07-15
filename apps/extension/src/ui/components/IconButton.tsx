import { Button, CardMedia, Skeleton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

interface IconButtonProps {
  messageKey: string;
  onClick: () => void;
  showLabel?: boolean;
  icon: string;
  customSx?: object;
  loading?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  messageKey,
  onClick,
  showLabel = true,
  icon,
  customSx = {},
  loading = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {loading ? (
        <Skeleton variant="circular" width={38} height={38} />
      ) : (
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
            backgroundColor: theme.palette.success.main,
            '&:hover': {
              backgroundColor: theme.palette.success.light,
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
              color: theme.palette.common.white,
              transition: 'color 0.2s ease-in-out',
              '&:hover': {
                color: theme.palette.common.black,
              },
            }}
            image={icon}
          />
        </Button>
      )}
      {showLabel && (
        <Typography
          sx={{
            fontSize: '12px',
            color: theme.palette.text.secondary,
            textAlign: 'center',
          }}
        >
          {loading ? <Skeleton variant="text" width={50} /> : chrome.i18n.getMessage(messageKey)}
        </Typography>
      )}
    </div>
  );
};
