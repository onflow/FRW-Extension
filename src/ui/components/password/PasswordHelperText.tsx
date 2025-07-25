import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

interface PasswordHelperTextProps {
  variant: 'success' | 'error';
  text: string;
}

const PasswordHelperText: React.FC<PasswordHelperTextProps> = ({ variant, text }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        marginTop: 1,
      }}
    >
      {variant === 'success' ? (
        <CheckCircleIcon
          sx={{
            fontSize: 14,
            color: theme.palette.success.main,
            margin: '8px',
          }}
        />
      ) : (
        <CancelIcon
          sx={{
            fontSize: 14,
            color: theme.palette.error.main,
            margin: '8px',
          }}
        />
      )}
      <Typography
        variant="body2"
        color={variant === 'success' ? theme.palette.success.main : theme.palette.error.main}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default PasswordHelperText;
