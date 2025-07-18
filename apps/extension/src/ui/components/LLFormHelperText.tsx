import { Typography, CircularProgress } from '@mui/material';
import { Box } from '@mui/system';
import React from 'react';

import CheckCircleIcon from '@/ui/components/iconfont/IconCheckmark';
import CancelIcon from '@/ui/components/iconfont/IconClose';

import SlideRelative from './SlideRelative';
interface LLFormHelperTextProps {
  inputValue: any;
  isValid: boolean;
  isValidating: boolean;
  errorMsg?: string;
  successMsg?: string;
}

const genHelperText = (
  isValidating: boolean,
  isValid: boolean,
  errorMsg?: string,
  successMsg?: string
) => {
  if (isValidating && !isValid)
    return (
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <CircularProgress color="primary" size={22} style={{ fontSize: '22px', margin: '8px' }} />
        {chrome.i18n.getMessage('Checking')}
      </Typography>
    );

  return isValid ? (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CheckCircleIcon size={24} color={'#41CC5D'} style={{ margin: '8px' }} />
      <Typography variant="body2" color="text.success">
        {successMsg || chrome.i18n.getMessage('Sounds_good')}
      </Typography>
    </Box>
  ) : (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CancelIcon size={24} color={'#E54040'} style={{ margin: '8px' }} />
      <Typography variant="body2" color="text.error">
        {errorMsg}
      </Typography>
    </Box>
  );
};

export const LLFormHelperText = (props: LLFormHelperTextProps) => {
  const { inputValue, isValidating, isValid, errorMsg, successMsg } = props;

  const msgBgColor = () => {
    if (isValidating && !isValid) return 'neutral.light';
    return isValid ? 'success.light' : 'error.light';
  };

  return (
    <>
      <SlideRelative direction="down" show={inputValue}>
        <Box
          sx={{
            width: '95%',
            backgroundColor: msgBgColor(),
            mx: 'auto',
            borderRadius: '0 0 12px 12px',
          }}
        >
          <Box sx={{ p: '4px' }}>{genHelperText(isValidating, isValid, errorMsg, successMsg)}</Box>
        </Box>
      </SlideRelative>
    </>
  );
};
