import Button, { type ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import React from 'react';

interface LLPrimaryButtonProps extends ButtonProps {
  label: string | JSX.Element;
}

const CustomButton = styled(Button)<ButtonProps>(() => ({
  '&:disabled': {
    backgroundColor: '#E5E5E54D',
    color: '#000000CC',
  },
  '&:hover': {
    backgroundColor: '#E5E5E5B3',
    color: '#000000CC',
  },
}));

export const LLPrimaryButton = (props: LLPrimaryButtonProps) => {
  const { label, ...inherentProps } = props;

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
      }}
      {...inherentProps}
    >
      {label}
    </CustomButton>
  );
};
