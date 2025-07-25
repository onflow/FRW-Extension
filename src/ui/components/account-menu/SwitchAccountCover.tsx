import { Box, CircularProgress, useTheme } from '@mui/material';
import React from 'react';

interface SwitchAccountCoverProps {
  open: boolean;
}

const SwitchAccountCover: React.FC<SwitchAccountCoverProps> = ({ open }) => {
  const theme = useTheme();
  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <CircularProgress sx={{ color: theme.palette.success.main }} />
    </Box>
  );
};

export default SwitchAccountCover;
