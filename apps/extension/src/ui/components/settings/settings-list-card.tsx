import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Typography, Divider, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

interface SettingsListItem {
  iconColor: string;
  iconText?: string;
  iconUrl?: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

interface SettingsListCardProps {
  items: SettingsListItem[];
  showDivider?: boolean;
}

const SettingsListCard: React.FC<SettingsListCardProps> = ({ items, showDivider = true }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        background: theme.palette.background.paper,
        borderRadius: '20px',
        padding: '0',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {items.map((item, idx) => (
        <React.Fragment key={item.title + idx}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 2,
              cursor: item.onClick ? 'pointer' : 'default',
              '&:hover': item.onClick ? { background: theme.palette.action.hover } : {},
            }}
            onClick={item.onClick}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: item.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 18,
                color: 'white',
                mr: 2,
                overflow: 'hidden',
              }}
            >
              {item.iconUrl ? (
                <img
                  src={item.iconUrl}
                  alt={item.title}
                  style={{ width: 37, height: 37, borderRadius: '50%' }}
                />
              ) : (
                item.iconText
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: 16,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.title}
              </Typography>
              {item.subtitle && (
                <Typography
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: 12,
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.subtitle}
                </Typography>
              )}
            </Box>
            <IconButton edge="end" size="small" sx={{ color: theme.palette.text.secondary, ml: 1 }}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          {showDivider && idx < items.length - 1 && (
            <Divider sx={{ background: theme.palette.divider, mx: 2 }} />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default SettingsListCard;
