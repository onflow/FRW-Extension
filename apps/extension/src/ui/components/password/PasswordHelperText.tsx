import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Box, Typography } from '@mui/material';
import React from 'react';

import { COLOR_SUCCESS_GREEN_41CC5D, COLOR_ERROR_RED_E54040 } from '@/ui/style/color';

interface PasswordHelperTextProps {
  variant: 'success' | 'error';
  message: string;
}

export const PasswordHelperText: React.FC<PasswordHelperTextProps> = ({
  message,
  variant,
}: PasswordHelperTextProps) => (
  <Box
    sx={{
      width: '95%',
      backgroundColor: variant === 'success' ? 'success.light' : 'error.light',
      mx: 'auto',
      borderRadius: '0 0 12px 12px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: '24px',
    }}
  >
    {variant === 'success' ? (
      <CheckCircleOutlineIcon
        sx={{ fontSize: 14, color: COLOR_SUCCESS_GREEN_41CC5D, margin: '8px' }}
      />
    ) : (
      <CancelIcon sx={{ fontSize: 14, color: COLOR_ERROR_RED_E54040, margin: '8px' }} />
    )}
    <Typography
      variant="body2"
      color={variant === 'success' ? COLOR_SUCCESS_GREEN_41CC5D : COLOR_ERROR_RED_E54040}
    >
      {message}
    </Typography>
  </Box>
);
