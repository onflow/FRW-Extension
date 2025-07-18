import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Typography, Divider, IconButton } from '@mui/material';
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

const SettingsListCard: React.FC<SettingsListCardProps> = ({ items, showDivider = true }) => (
  <Box
    sx={{
      background: '#181818',
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
            '&:hover': item.onClick ? { background: '#232323' } : {},
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
              color: '#fff',
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
                color: '#fff',
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
                  color: '#aaa',
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
          <IconButton edge="end" size="small" sx={{ color: '#aaa', ml: 1 }}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
        {showDivider && idx < items.length - 1 && <Divider sx={{ background: '#232323', mx: 2 }} />}
      </React.Fragment>
    ))}
  </Box>
);

export default SettingsListCard;
