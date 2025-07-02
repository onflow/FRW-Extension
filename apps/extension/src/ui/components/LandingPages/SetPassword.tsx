import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Link,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import { DEFAULT_PASSWORD } from '@/shared/utils/default';
import { BpUncheked, BpCheckedIcon } from '@/ui/assets/icons/CustomCheckboxIcons';
import { LLSpinner } from '@/ui/components';
import { PasswordInput } from '@/ui/components/password/PasswordInput';

interface SetPasswordProps {
  onSubmit: (password: string) => Promise<void>;
  subtitle?: string;
  isLogin?: boolean;
}

const SetPassword: React.FC<SetPasswordProps> = ({ onSubmit, subtitle = '', isLogin = false }) => {
  const showTerms = !isLogin;

  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [confirmPassword, setConfirmPassword] = useState(DEFAULT_PASSWORD);
  const [isCharacters, setCharacters] = useState(false);
  const [isMatch, setMatch] = useState(false);
  const [isCheck, setCheck] = useState(!showTerms);
  const [isLoading, setLoading] = useState(false);
  const [errMessage, setErrorMessage] = useState('Something wrong, please try again');
  const [showError, setShowError] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>(undefined);
  const [helperText, setHelperText] = useState<string | undefined>(undefined);
  const [errorMatch, setErrorMatch] = useState<string | undefined>(undefined);
  const [helperMatch, setHelperMatch] = useState<string | undefined>(undefined);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await onSubmit(password);
      setLoading(false);
    } catch (error) {
      setErrorMessage(error.message || errMessage);
      setShowError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) {
      if (password.length > 7) {
        setHelperText(chrome.i18n.getMessage('At__least__8__characters'));
        setErrorText(undefined);
        setCharacters(true);
      } else {
        setErrorText(chrome.i18n.getMessage('At__least__8__characters'));
        setHelperText(undefined);
        setCharacters(false);
      }
    } else {
      setHelperText(undefined);
      setErrorText(undefined);
      setCharacters(false);
    }

    if (confirmPassword) {
      if (confirmPassword === password) {
        setHelperMatch(chrome.i18n.getMessage('Passwords__match'));
        setErrorMatch(undefined);
        setMatch(true);
      } else {
        setMatch(false);
        setErrorMatch(chrome.i18n.getMessage('Your__passwords__do__not__match'));
        setHelperMatch(undefined);
      }
    } else {
      setErrorMatch(undefined);
      setHelperMatch(undefined);
      setMatch(false);
    }
  }, [confirmPassword, password]);

  return (
    <>
      <Box className="registerBox">
        <Typography variant="h4">
          {isLogin ? (
            chrome.i18n.getMessage('Confirm__Password')
          ) : (
            <>
              {chrome.i18n.getMessage('Create')}
              <Box display="inline" color="primary.main">
                {chrome.i18n.getMessage('Password')}
              </Box>
            </>
          )}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {subtitle ||
            chrome.i18n.getMessage(
              'Lilico__uses__this__password__to__protect__your__recovery__phrase'
            )}
        </Typography>

        <Box
          component="form"
          sx={{
            flexGrow: 1,
            width: 640,
            maxWidth: '100%',
            my: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
          onSubmit={handleSubmit}
          target="_self"
        >
          <PasswordInput
            value={password}
            onChange={setPassword}
            showPassword={isPasswordVisible}
            setShowPassword={setPasswordVisible}
            autoFocus={true}
            helperText={helperText}
            errorText={errorText}
            placeholder={
              isLogin
                ? chrome.i18n.getMessage('Confirm__your__password')
                : chrome.i18n.getMessage('Create__a__password')
            }
          />

          {!isLogin && (
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              showPassword={isConfirmPasswordVisible}
              setShowPassword={setConfirmPasswordVisible}
              helperText={helperMatch}
              errorText={errorMatch}
              placeholder={chrome.i18n.getMessage('Confirm__your__password')}
            />
          )}

          {showTerms && <TermsCheckbox onChange={setCheck} />}

          <SubmitButton
            isLoading={isLoading}
            disabled={isLogin ? !isCharacters : !(isMatch && isCharacters && isCheck)}
            isLogin={isLogin}
          />
        </Box>

        <ErrorSnackbar open={showError} message={errMessage} onClose={() => setShowError(false)} />
      </Box>
    </>
  );
};

// Terms Checkbox Component
interface TermsCheckboxProps {
  onChange: (checked: boolean) => void;
}

const TermsCheckbox = ({ onChange }: TermsCheckboxProps) => (
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

const ErrorSnackbar = ({ open, message, onClose }: ErrorSnackbarProps) => (
  <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
    <Alert onClose={onClose} variant="filled" severity="error" sx={{ width: '100%' }}>
      {message}
    </Alert>
  </Snackbar>
);

// Submit Button Component
interface SubmitButtonProps {
  isLoading: boolean;
  disabled: boolean;
  isLogin?: boolean;
}

const SubmitButton = ({ isLoading, disabled, isLogin = false }: SubmitButtonProps) => (
  <Button
    variant="contained"
    color="secondary"
    type="submit"
    size="large"
    sx={{
      height: '56px',
      width: '100%',
      borderRadius: '12px',
      textTransform: 'capitalize',
      gap: '12px',
      display: 'flex',
    }}
    disabled={isLoading || disabled}
  >
    {isLoading && <LLSpinner size={28} />}
    {isLogin ? chrome.i18n.getMessage('Login') : chrome.i18n.getMessage('Register')}
  </Button>
);

export default SetPassword;
