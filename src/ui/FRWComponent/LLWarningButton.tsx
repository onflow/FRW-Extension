import React from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material/styles';

interface LLWarningButtonProps extends ButtonProps {
  label: string | JSX.Element;
}

const CustomButton = styled(Button)<ButtonProps>(() => ({
  '&:disabled': {
    backgroundColor: '#E5E5E54D',
    color:'#000000CC'
  },
  '&:hover': {
    backgroundColor: '#E5E5E5B3',
    color:'#000000CC'
  },
}));

export const LLWarningButton = (props: LLWarningButtonProps) => {
  const { label, ...inherentProps } = props;

  return (
    <CustomButton
      color="error"
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
