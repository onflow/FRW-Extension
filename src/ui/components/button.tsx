import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';
import { styled, useTheme } from '@mui/material/styles';
import React from 'react';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

// Default styling
const StyledButton = styled(MuiButton)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  padding: '16px 20px',
  textTransform: 'none',
  fontWeight: 600,
  disableElevation: true,
  transition: 'all 0.2s ease-in-out',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  borderRadius: '16px',
}));

export const Button: React.FC<ButtonProps> = ({
  children,
  disabled = false,
  loading = false,
  ...props
}) => {
  const theme = useTheme();

  return (
    <StyledButton variant="contained" disabled={disabled || loading} {...props}>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              border: `2px solid ${theme.palette.text.primary}`,
              borderTop: `2px solid transparent`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          {children}
        </div>
      ) : (
        children
      )}
    </StyledButton>
  );
};
