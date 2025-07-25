import { Dialog, type DialogProps } from '@mui/material';
import { type SxProps, type Theme, useTheme } from '@mui/system';
import React from 'react';

interface CustomDialogProps extends DialogProps {
  sx?: SxProps<Theme>;
  PaperProps?: DialogProps['PaperProps'] & { sx?: SxProps<Theme> };
}

export const CustomDialog = ({ sx, PaperProps, ...props }: CustomDialogProps) => {
  const theme = useTheme();
  return (
    <Dialog
      {...props}
      sx={{
        zIndex: 1500,
        ...sx, // Allow custom sx override
      }}
      PaperProps={{
        ...PaperProps,
        sx: {
          width: '640px',
          borderRadius: '24px',
          height: 'auto',
          padding: '40px',
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'none',
          ...PaperProps?.sx, // Allow Paper sx override
        },
      }}
    >
      {props.children}
    </Dialog>
  );
};
