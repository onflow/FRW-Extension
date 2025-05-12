import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Button,
  CircularProgress,
  FormGroup,
  IconButton,
  Input,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Typography,
} from '@mui/material';
import Box from '@mui/material/Box';
import { makeStyles } from '@mui/styles';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import CheckCircleIcon from '@/components/iconfont/IconCheckmark';
import CancelIcon from '@/components/iconfont/IconClose';
import { consoleError } from '@/shared/utils/console-log';
import { DEFAULT_PASSWORD } from '@/shared/utils/default';
import { LLHeader } from '@/ui/FRWComponent/LLHeader';
import { PasswordIndicator, PasswordInput } from '@/ui/FRWComponent/PasswordComponents';
import SlideRelative from '@/ui/FRWComponent/SlideRelative';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useWallet } from '@/ui/utils';

import { GoogleWarningDialog } from './google-warning';
import { ProfileBackupSelectionDialog } from './profile-backup-selection';

const useStyles = makeStyles(() => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    width: '355px',
    height: '48px',
    padding: '18px',
    marginLeft: '18px',
    marginRight: '18px',
    zIndex: '999',
    border: '1px solid #4C4C4C',
    borderRadius: '8px',
    boxSizing: 'border-box',
    '&.Mui-focused': {
      border: '1px solid #FAFAFA',
      boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
    },
  },
  inputBox2: {
    width: '355px',
    height: '48px',
    padding: '18px',
    marginLeft: '18px',
    marginRight: '18px',
    zIndex: '999',
    border: '1px solid #4C4C4C',
    borderRadius: '8px',
    boxSizing: 'border-box',
    '&.Mui-focused': {
      border: '1px solid #FAFAFA',
      boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
    },
  },
  inputBox3: {
    width: '355px',
    height: '48px',
    padding: '18px',
    marginLeft: '18px',
    marginRight: '18px',
    zIndex: '999',
    border: '1px solid #4C4C4C',
    borderRadius: '8px',
    boxSizing: 'border-box',
    '&.Mui-focused': {
      border: '1px solid #FAFAFA',
      boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
    },
  },
}));

const ChangePassword = () => {
  const classes = useStyles();
  const wallet = useWallet();
  const { clearProfileData } = useProfiles();
  const [isCurrentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [confirmPassword, setConfirmPassword] = useState(DEFAULT_PASSWORD);
  const [isCharacters, setCharacters] = useState(false);
  const [isMatch, setMatch] = useState(false);
  const [confirmCurrentPassword, setConfirmCurrentPassword] = useState(DEFAULT_PASSWORD);
  const [isSame, setSame] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showGooglePermissionDialog, setShowGooglePermissionDialog] = useState(false);
  const [showProfileBackupDialog, setShowProfileBackupDialog] = useState(false);
  // No need to maintain selectedProfiles in state since we immediately use them
  const history = useHistory();

  const verify = useCallback(async () => {
    try {
      setIsVerifying(true);
      // verifyPassword doesn't return a value, it throws an error if the password is incorrect
      await wallet.verifyPassword(confirmCurrentPassword);
      // If we reach here, the password is correct
      setSame(true);
    } catch (error) {
      consoleError('Password verification failed:', error);
      setSame(false);
    } finally {
      setIsVerifying(false);
    }
  }, [confirmCurrentPassword, wallet]);

  useEffect(() => {
    verify();
  }, [confirmCurrentPassword, verify]);

  const successInfo = (message) => {
    return (
      <Box
        sx={{
          width: '95%',
          backgroundColor: '#38B00014',
          mx: 'auto',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <CheckCircleIcon size={12} color={'#41CC5D'} style={{ margin: '8px' }} />
        <Typography
          sx={{
            fontSize: '10px',
            fontStyle: 'normal',
            fontWeight: '400',
          }}
          color="text.secondary"
        >
          {message}
        </Typography>
      </Box>
    );
  };

  const errorInfo = (message) => {
    return (
      <Box
        sx={{
          width: '95%',
          backgroundColor: 'error.light',
          mx: 'auto',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <CancelIcon size={12} color={'#E54040'} style={{ margin: '8px' }} />
        <Typography
          sx={{
            fontSize: '10px',
            fontStyle: 'normal',
            fontWeight: '400',
          }}
          color="error.main"
        >
          {message}
        </Typography>
      </Box>
    );
  };

  const [helperText, setHelperText] = useState(<div />);
  const [helperMatch, setHelperMatch] = useState(<div />);

  const changePassword = useCallback(
    async (ignoreBackupsAtTheirOwnRisk = false) => {
      try {
        setIsResetting(true);
        setError('');
        setStatusMessage(chrome.i18n.getMessage('Changing_password') || 'Changing password...');

        const success = await wallet.changePassword(
          confirmCurrentPassword,
          confirmPassword,
          [],
          ignoreBackupsAtTheirOwnRisk
        );

        if (success) {
          setStatusMessage(
            chrome.i18n.getMessage('Password_changed_successfully_Locking_wallet') ||
              'Password changed successfully! Locking wallet...'
          );
          await wallet
            .lockWallet()
            .then(() => {
              clearProfileData();
              history.push('/unlock');
            })
            .catch((error) => {
              consoleError('Error locking wallet:', error);
              setError(chrome.i18n.getMessage('Oops__unexpected__error'));
            })
            .finally(() => {
              setIsResetting(false);
              setStatusMessage('');
            });
        } else {
          setError(chrome.i18n.getMessage('Oops__unexpected__error'));
        }
      } catch (error) {
        consoleError('Error changing password:', error);
        setError(error.message);
      } finally {
        setIsResetting(false);
        if (!error) {
          setStatusMessage('');
        }
      }
    },
    [confirmCurrentPassword, confirmPassword, wallet, clearProfileData, history, error]
  );

  const changePasswordWithBackups = useCallback(
    async (profileUsernames: string[]) => {
      try {
        setIsResetting(true);
        setError('');
        setStatusMessage(
          chrome.i18n.getMessage('Updating_backups_and_changing_password') ||
            'Updating backups and changing password...'
        );

        const success = await wallet.changePassword(
          confirmCurrentPassword,
          confirmPassword,
          profileUsernames,
          false // not ignoring backups
        );

        if (success) {
          setStatusMessage(
            chrome.i18n.getMessage('Password_changed_successfully_Locking_wallet') ||
              'Password changed successfully! Locking wallet...'
          );

          await wallet
            .lockWallet()
            .then(() => {
              clearProfileData();
              history.push('/unlock');
            })
            .catch((error) => {
              consoleError('Error locking wallet:', error);
              setError(chrome.i18n.getMessage('Oops__unexpected__error'));
            });
        } else {
          setError(chrome.i18n.getMessage('Oops__unexpected__error'));
        }
      } catch (error) {
        consoleError('Error changing password:', error);

        // Provide more specific error messages based on the error
        if (error.message.includes('backup')) {
          setError(
            `${chrome.i18n.getMessage('Failed_to_update_Google_Drive_backups') || 'Failed to update Google Drive backups'}: ${error.message}`
          );
        } else if (error.message.includes('wallet password')) {
          setError(
            `${chrome.i18n.getMessage('Failed_to_change_wallet_password') || 'Failed to change wallet password'}: ${error.message}`
          );
        } else {
          setError(error.message);
        }
      } finally {
        setIsResetting(false);
        setStatusMessage('');
      }
    },
    [confirmCurrentPassword, confirmPassword, wallet, clearProfileData, history]
  );

  const handleChangePasswordClick = useCallback(async () => {
    // Check if the user has google permission
    // We need to access backups so we can re-encrypt them
    const hasGooglePermission = await wallet.hasGooglePermission();
    if (hasGooglePermission) {
      // Show the profile backup selection dialog
      setShowProfileBackupDialog(true);
    } else {
      setShowGooglePermissionDialog(true);
    }
  }, [wallet]);

  // Handler for profile selection
  const handleProfileSelection = useCallback(
    (selectedUsernames: string[]) => {
      setShowProfileBackupDialog(false);

      // Proceed with password change, including selected profiles
      changePasswordWithBackups(selectedUsernames);
    },
    [changePasswordWithBackups]
  );

  useEffect(() => {
    if (password.length > 7) {
      setHelperText(successInfo(chrome.i18n.getMessage('At__least__8__characters')));
      setCharacters(true);
    } else {
      setHelperText(errorInfo(chrome.i18n.getMessage('At__least__8__characters')));
      setCharacters(false);
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword === password) {
      setHelperMatch(successInfo(chrome.i18n.getMessage('Passwords__match')));
      setMatch(true);
    } else {
      setMatch(false);
      setHelperMatch(errorInfo(chrome.i18n.getMessage('Your__passwords__do__not__match')));
    }
  }, [confirmPassword, password]);

  return (
    <div className="page">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
        }}
      >
        <LLHeader title={chrome.i18n.getMessage('Change__Password')} help={false} />

        <Box
          sx={{
            flexGrow: 1,
            width: '355px',
            maxWidth: '100%',
            my: '8px',
            display: 'flex',
          }}
        >
          <FormGroup sx={{ width: '100%' }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontFamily: 'Inter',
                fontWeight: '500',
                paddingLeft: '18px',
                marginBottom: '8px',
              }}
            >
              {chrome.i18n.getMessage('Current__Password')}
            </Typography>
            <PasswordInput
              value={confirmCurrentPassword}
              onChange={(value) => setConfirmCurrentPassword(value)}
              sx={{ fontSize: '12px', fontFamily: 'Inter', fontStyle: 'normal' }}
              className={classes.inputBox}
              autoFocus
              placeholder={chrome.i18n.getMessage('Enter__Current__Password')}
              isVisible={isCurrentPasswordVisible}
              setVisible={setCurrentPasswordVisible}
              visibilitySx={{ fontSize: 14, padding: 0 }}
              endAdornment={
                <InputAdornment position="end">
                  {isVerifying ? (
                    <Box sx={{ width: 14, height: 14, margin: '8px' }}>
                      <LinearProgress sx={{ width: 14, height: 14 }} />
                    </Box>
                  ) : isSame ? (
                    <CheckCircleIcon size={14} color={'#41CC5D'} style={{ margin: '8px' }} />
                  ) : (
                    <CancelIcon size={14} color={'#E54040'} style={{ margin: '8px' }} />
                  )}
                  <IconButton onClick={() => setCurrentPasswordVisible(!isCurrentPasswordVisible)}>
                    {isCurrentPasswordVisible ? (
                      <VisibilityOffIcon sx={{ fontSize: 14, padding: 0 }} />
                    ) : (
                      <VisibilityIcon sx={{ fontSize: 14, padding: 0 }} />
                    )}
                  </IconButton>
                </InputAdornment>
              }
            />

            <Typography
              sx={{
                fontSize: '14px',
                fontFamily: 'Inter',
                fontWeight: '500',
                paddingLeft: '18px',
                marginTop: '16px',
                marginBottom: '8px',
              }}
            >
              {chrome.i18n.getMessage('New__Password')}
            </Typography>

            <PasswordInput
              value={password}
              onChange={(value) => {
                setPassword(value);
              }}
              sx={{
                pb: '15px',
                marginTop: password ? '0px' : '0px',
                fontSize: '12px',
                fontFamily: 'Inter',
                fontStyle: 'normal',
              }}
              visibilitySx={{
                fontSize: 14,
                margin: 0,
              }}
              isVisible={isPasswordVisible}
              setVisible={setPasswordVisible}
              className={classes.inputBox}
              autoFocus={true}
              placeholder={chrome.i18n.getMessage('Enter__New__Password')}
              showIndicator={true}
            />
            <SlideRelative direction="down" show={!!password}>
              {helperText}
            </SlideRelative>

            <Typography
              sx={{
                fontSize: '14px',
                fontFamily: 'Inter',
                fontWeight: '500',
                paddingLeft: '18px',
                marginTop: '16px',
                marginBottom: '8px',
              }}
            >
              {chrome.i18n.getMessage('Confirm__Password')}
            </Typography>

            <PasswordInput
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
              }}
              sx={{
                pb: '15px',
                marginTop: password ? '0px' : '0px',
                fontSize: '12px',
                fontFamily: 'Inter',
                fontStyle: 'normal',
              }}
              visibilitySx={{
                fontSize: 14,
                margin: 0,
              }}
              isVisible={isConfirmPasswordVisible}
              setVisible={setConfirmPasswordVisible}
              className={classes.inputBox}
              autoFocus={true}
              placeholder={chrome.i18n.getMessage('Confirm__Password')}
              showIndicator={true}
            />
            <SlideRelative direction="down" show={!!confirmPassword}>
              {helperMatch}
            </SlideRelative>
          </FormGroup>
        </Box>
        <Box
          sx={{
            display: 'flex',
            px: '18px',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '60px',
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleChangePasswordClick}
            size="large"
            sx={{
              display: 'flex',
              flexGrow: 1,
              height: '48px',
              width: 'calc(50% - 4px)',
              borderRadius: '8px',
              textTransform: 'uppercase',
              backgroundColor: '#38B000',
              '&:hover': {
                backgroundColor: '#309900',
              },
            }}
            disabled={!(isSame && isMatch && isCharacters) || isResetting}
          >
            {isResetting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Typography
                sx={{ fontWeight: '600', fontSize: '14px', fontFamily: 'Inter' }}
                color="text.primary"
              >
                {chrome.i18n.getMessage('Change_Password') || 'Change Password'}
              </Typography>
            )}
          </Button>
        </Box>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        {/* Simple success message with better visibility */}
        {isResetting && !error && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '0px',
              left: '0',
              right: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#38B000',
              color: 'white',
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <CheckCircleIcon size={18} color={'white'} />
            <Typography
              sx={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {chrome.i18n.getMessage('Password__Change__Success')}
            </Typography>
          </Box>
        )}

        <GoogleWarningDialog
          open={showGooglePermissionDialog}
          onClose={setShowGooglePermissionDialog}
          onProceedAnyway={() => changePassword(true)}
          onError={setError}
        />

        <ProfileBackupSelectionDialog
          open={showProfileBackupDialog}
          onClose={() => setShowProfileBackupDialog(false)}
          onConfirm={handleProfileSelection}
          currentPassword={confirmCurrentPassword}
        />

        {statusMessage && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '0px',
              left: '0',
              right: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#38B000',
              color: 'white',
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
              zIndex: 1000,
            }}
          >
            <CircularProgress size={16} color="inherit" />
            <Typography
              sx={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {statusMessage}
            </Typography>
          </Box>
        )}
      </Box>
    </div>
  );
};

export default ChangePassword;
