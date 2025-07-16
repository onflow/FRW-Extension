import Button, { type ButtonProps } from '@mui/material/Button';
import { styled, useTheme } from '@mui/material/styles';
import React from 'react';

interface LLPrimaryButtonProps extends ButtonProps {
  label: string | JSX.Element;
}

const CustomButton = styled(Button)<ButtonProps>(({ theme }) => ({
  '&:disabled': {
    backgroundColor: theme.palette.text.primary + '4D',
    color: theme.palette.common.black + 'CC',
  },
  '&:hover': {
    backgroundColor: theme.palette.text.primary + 'B3',
    color: theme.palette.common.black + 'CC',
  },
}));

export const LLPrimaryButton = (props: LLPrimaryButtonProps) => {
  const { label, ...inherentProps } = props;
  const theme = useTheme();

  return (
    <CustomButton
      color="success"
      variant="contained"
      disableElevation
      sx={{
        textTransform: 'none',
        borderRadius: 2,
        fontWeight: '600',
        height: '48px',
        backgroundColor: theme.palette.text.primary + '4D',
        color: theme.palette.common.black + 'CC',
      }}
      {...inherentProps}
    >
      {label}
    </CustomButton>
  );
};
