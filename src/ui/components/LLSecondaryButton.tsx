import Button, { type ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import React from 'react';

interface LLSecondaryButtonProps extends ButtonProps {
  label: string;
}

const CustomButton = styled(Button)<ButtonProps>(({ theme }) => ({
  color: (theme.palette as any).info3.contrastText,
  backgroundColor: (theme.palette as any).info3.main,
  '&:hover': {
    backgroundColor: (theme.palette as any).info3.dark,
  },
}));

export const LLSecondaryButton = (props: LLSecondaryButtonProps) => {
  const { label, ...inherentProps } = props;
  return (
    <CustomButton
      variant="contained"
      disableElevation
      sx={{
        textTransform: 'none',
        borderRadius: 2,
        fontWeight: 'bold',
        height: '48px',
      }}
      {...inherentProps}
    >
      {label}
    </CustomButton>
  );
};
