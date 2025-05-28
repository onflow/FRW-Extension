import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Box,
  LinearProgress,
  Typography,
  Input,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  Link,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React from 'react';
import zxcvbn from 'zxcvbn';

import { BpUncheked, BpCheckedIcon } from '@/ui/FRWAssets/icons/CustomCheckboxIcons';
import { LLSpinner } from '@/ui/FRWComponent';

const useStyles = makeStyles(() => ({
  inputBox: {
    height: '64px',
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
  },
}));

// Password Indicator Component
interface PasswordIndicatorProps {
  value: string;
}

export const PasswordIndicator = ({ value }: PasswordIndicatorProps) => {
  const score = zxcvbn(value).score;
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
      <Box sx={{ width: '72px', mr: 1 }}>
        <LinearProgress
          variant="determinate"
          // @ts-expect-error level function returned expected value
          color={level(score).color}
          sx={{ height: '12px', width: '72px', borderRadius: '12px' }}
          value={percentage}
        />
      </Box>
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
  isVisible: boolean;
  setVisible?: (visible: boolean) => void;
  readOnly?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  showIndicator?: boolean;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  sx?: any;
  visibilitySx?: any;
  endAdornment?: React.ReactNode;
}

export const PasswordInput = ({
  value,
  onChange,
  isVisible,
  setVisible = () => {},
  readOnly = false,
  placeholder = chrome.i18n.getMessage('Create__a__password'),
  autoFocus = false,
  className,
  showIndicator = false,
  onKeyDown,
  sx,
  visibilitySx,
  endAdornment,
}: PasswordInputProps) => {
  const classes = useStyles();

  const defaultEndAdornment = (
    <InputAdornment position="end">
      {value && showIndicator && <PasswordIndicator value={value} />}
      <IconButton onClick={() => setVisible(!isVisible)}>
        {isVisible ? <VisibilityOffIcon sx={visibilitySx} /> : <VisibilityIcon sx={visibilitySx} />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Input
      type={isVisible ? 'text' : 'password'}
      value={value}
      className={className || classes.inputBox}
      readOnly={readOnly}
      autoFocus={autoFocus}
      placeholder={placeholder}
      fullWidth
      disableUnderline
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      sx={sx}
      endAdornment={endAdornment || defaultEndAdornment}
    />
  );
};

// Terms Checkbox Component
interface TermsCheckboxProps {
  onChange: (checked: boolean) => void;
}

export const TermsCheckbox = ({ onChange }: TermsCheckboxProps) => (
  <FormControlLabel
    control={
      <Checkbox
        icon={<BpUncheked />}
        checkedIcon={<BpCheckedIcon />}
        onChange={(event) => onChange(event.target.checked)}
      />
    }
    label={
      <Typography variant="body1" color="text.secondary">
        {chrome.i18n.getMessage('I__agree__to__Lilico') + ' '}
        <Link
          underline="none"
          href="https://lilico.app/about/privacy-policy"
          target="_blank"
          color="success.main"
        >
          {chrome.i18n.getMessage('Privacy__Policy')}
        </Link>{' '}
        {chrome.i18n.getMessage('and') + ' '}
        <Link
          href="https://lilico.app/about/terms"
          target="_blank"
          color="success.main"
          underline="none"
        >
          {chrome.i18n.getMessage('Terms__of__Service')}
        </Link>{' '}
        .
      </Typography>
    }
  />
);

// Error Snackbar Component
interface ErrorSnackbarProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export const ErrorSnackbar = ({ open, message, onClose }: ErrorSnackbarProps) => (
  <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
    <Alert onClose={onClose} variant="filled" severity="error" sx={{ width: '100%' }}>
      {message}
    </Alert>
  </Snackbar>
);

// Submit Button Component
interface SubmitButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  isLogin?: boolean;
}

export const SubmitButton = ({
  onClick,
  isLoading,
  disabled,
  isLogin = false,
}: SubmitButtonProps) => (
  <Button
    className="registerButton"
    variant="contained"
    color="secondary"
    onClick={onClick}
    size="large"
    sx={{
      height: '56px',
      width: '640px',
      borderRadius: '12px',
      textTransform: 'capitalize',
      gap: '12px',
      display: 'flex',
    }}
    disabled={isLoading || disabled}
  >
    {isLoading && <LLSpinner size={28} />}
    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
      {isLogin ? chrome.i18n.getMessage('Login') : chrome.i18n.getMessage('Register')}
    </Typography>
  </Button>
);
