import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Box,
  LinearProgress,
  Typography,
  Input,
  InputAdornment,
  IconButton,
  useMediaQuery,
  useTheme,
  Collapse,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import zxcvbn from 'zxcvbn';

import { PasswordHelperText } from './PasswordHelperText';
// Password Indicator Component
interface PasswordIndicatorProps {
  value: string;
}

const PasswordIndicator = ({ value }: PasswordIndicatorProps) => {
  const score = value ? zxcvbn(value).score : 0;
  const percentage = ((score + 1) / 5) * 100;

  const level = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return { text: chrome.i18n.getMessage('Weak'), color: 'error' };
      case 2:
        return { text: chrome.i18n.getMessage('Good'), color: 'testnet' };
      case 3:
        return { text: chrome.i18n.getMessage('Great'), color: 'success' };
      case 4:
        return { text: chrome.i18n.getMessage('Strong'), color: 'success' };
      default:
        return { text: chrome.i18n.getMessage('Unknown'), color: 'error' };
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {value && (
        <Box sx={{ width: '72px', mr: 1 }}>
          <LinearProgress
            variant="determinate"
            // @ts-expect-error level function returned expected value
            color={level(score).color}
            sx={{ height: '12px', width: '72px', borderRadius: '12px' }}
            value={percentage}
          />
        </Box>
      )}
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">
          {level(score).text}
        </Typography>
      </Box>
    </Box>
  );
};

// Password Input Component
interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  autoFocus?: boolean;
  showIndicator?: boolean;
  showPassword?: boolean;
  setShowPassword?: (func: (prev: boolean) => boolean) => void;
  sx?: object;
  endAdornment?: React.ReactNode;
}

export const PasswordInput = ({
  value,
  onChange,
  onKeyDown,
  readOnly = false,
  placeholder = chrome.i18n.getMessage('Create__a__password'),
  helperText = undefined,
  errorText = undefined,
  autoFocus = false,
  showPassword,
  setShowPassword,
  showIndicator = false,
  sx,
  endAdornment,
}: PasswordInputProps) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [showPasswordState, setShowPasswordState] = useState(false);
  const isVisible = showPassword === undefined ? showPasswordState : showPassword;

  const handleSetShowPassword = useCallback(() => {
    if (setShowPassword) {
      setShowPassword((prev) => !prev);
    } else {
      setShowPasswordState((prev) => !prev);
    }
  }, [setShowPassword, setShowPasswordState]);

  const defaultEndAdornment = (
    <InputAdornment position="end">
      {!isSmallScreen && value && showIndicator && <PasswordIndicator value={value} />}
      <IconButton onClick={handleSetShowPassword}>
        {isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {isSmallScreen && showIndicator && (
        <Box sx={{ justifyItems: 'flex-end', paddingY: '8px' }}>
          <PasswordIndicator value={value} />
        </Box>
      )}
      <Input
        type={isVisible ? 'text' : 'password'}
        value={value}
        inputProps={{
          'aria-label': 'password',
          'data-testid': 'password-input',
        }}
        sx={{
          height: '64px',
          width: '100%',
          padding: '16px',
          zIndex: '999',
          backgroundColor: '#282828',
          border: '2px solid #4C4C4C',
          borderRadius: '12px',
          boxSizing: 'border-box',
          '&.Mui-focused': {
            border: '2px solid #FAFAFA',
            boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
          },
          // Make sure base sx is applied
          ...sx,
        }}
        readOnly={readOnly}
        autoFocus={autoFocus}
        placeholder={placeholder}
        fullWidth
        disableUnderline
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        endAdornment={endAdornment || defaultEndAdornment}
      />
      <Box height="24px">
        <Collapse in={!!errorText || !!helperText} orientation="vertical">
          <PasswordHelperText
            message={errorText || helperText || ''}
            variant={!!errorText ? 'error' : 'success'}
          />
        </Collapse>
      </Box>
    </Box>
  );
};
