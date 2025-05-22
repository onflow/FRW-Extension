import { Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState } from 'react';

import { DEFAULT_PASSWORD } from '@/shared/utils/default';
import { TermsCheckbox, ErrorSnackbar, SubmitButton } from '@/ui/FRWComponent/PasswordComponents';
import PasswordForm from '@/ui/FRWComponent/PasswordForm';

interface SetPasswordProps {
  handleSwitchTab: () => void;
  onSubmit: (password: string) => Promise<void>;
  username?: string;
  showTerms?: boolean;
  title?: string | React.ReactNode;
  subtitle?: string;
  isLogin?: boolean;
  autoFocus?: boolean;
}

const SetPassword: React.FC<SetPasswordProps> = ({
  handleSwitchTab = () => {},
  onSubmit,
  username = '',
  showTerms = false,
  title = '',
  subtitle = '',
  isLogin = false,
  autoFocus = false,
}) => {
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [confirmPassword, setConfirmPassword] = useState(DEFAULT_PASSWORD);
  const [isCharacters, setCharacters] = useState(false);
  const [isMatch, setMatch] = useState(false);
  const [isCheck, setCheck] = useState(!showTerms);
  const [isLoading, setLoading] = useState(false);
  const [errMessage, setErrorMessage] = useState('Something wrong, please try again');
  const [showError, setShowError] = useState(false);

  const handleSubmit = async () => {
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

  const handleValidationChange = (validationState: { characters: boolean; match: boolean }) => {
    setCharacters(validationState.characters);
    setMatch(validationState.match);
  };

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

        <Box sx={{ flexGrow: 1, width: 640, maxWidth: '100%', my: '32px', display: 'flex' }}>
          <PasswordForm
            fields={[
              {
                value: password,
                onChange: setPassword,
                placeholder: isLogin
                  ? chrome.i18n.getMessage('Confirm__your__password')
                  : chrome.i18n.getMessage('Create__a__password'),
                showIndicator: !isLogin,
              },
              ...(!isLogin
                ? [
                    {
                      value: confirmPassword,
                      onChange: setConfirmPassword,
                      placeholder: chrome.i18n.getMessage('Confirm__your__password'),
                      showIndicator: true,
                    },
                  ]
                : []),
            ]}
            requireMatch={!isLogin}
            onValidationChange={handleValidationChange}
            autoFocus={autoFocus}
          />
        </Box>

        {showTerms && <TermsCheckbox onChange={setCheck} />}

        <SubmitButton
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={isLogin ? !isCharacters : !(isMatch && isCharacters && isCheck)}
          isLogin={isLogin}
        />
      </Box>

      <ErrorSnackbar open={showError} message={errMessage} onClose={() => setShowError(false)} />
    </>
  );
};

export default SetPassword;
