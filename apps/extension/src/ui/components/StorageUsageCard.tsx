'use client';

import { Box, Typography, LinearProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { COLOR_DARK_GRAY_1A1A1A } from '@/ui/style/color';

interface StorageUsageCardProps {
  used?: number;
  total?: number;
  unit?: string;
  network?: string;
  address?: string;
}

const StorageUsageCard: React.FC<StorageUsageCardProps> = ({
  used = 0,
  total = 100,
  unit = 'MB',
  network,
  address,
}) => {
  const theme = useTheme();
  const percentage = (used / total) * 100;

  return (
    <Box
      sx={{
        backgroundColor: COLOR_DARK_GRAY_1A1A1A,
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Storage Usage
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {used} / {total} {unit}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: '8px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: theme.palette.primary.main,
            borderRadius: '4px',
          },
        }}
      />

      <Typography variant="caption" color="text.secondary">
        {percentage.toFixed(1)}% used
      </Typography>
    </Box>
  );
};

export default StorageUsageCard;
