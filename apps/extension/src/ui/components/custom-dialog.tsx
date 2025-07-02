import { Dialog, type DialogProps } from '@mui/material';
import { type SxProps, type Theme } from '@mui/system';
import React from 'react';

interface CustomDialogProps extends DialogProps {
  sx?: SxProps<Theme>;
  PaperProps?: DialogProps['PaperProps'] & { sx?: SxProps<Theme> };
}

export const CustomDialog = ({ sx, PaperProps, ...props }: CustomDialogProps) => {
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
          backgroundColor: '#222222',
          backgroundImage: 'none',
          ...PaperProps?.sx, // Allow Paper sx override
        },
      }}
    >
      {props.children}
    </Dialog>
  );
};
