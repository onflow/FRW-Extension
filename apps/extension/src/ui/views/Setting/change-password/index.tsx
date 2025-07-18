import { Alert, Button, CircularProgress, Snackbar, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';
import { DEFAULT_PASSWORD } from '@onflow/flow-wallet-shared/utils/default';

import CheckCircleIcon from '@/ui/components/iconfont/IconCheckmark';
import { LLHeader } from '@/ui/components/LLHeader';
import { PasswordInput } from '@/ui/components/password/PasswordInput';
import { useWallet } from '@/ui/hooks/use-wallet';

import { GoogleWarningDialog } from './google-warning';
import { ProfileBackupSelectionDialog } from './profile-backup-selection';

const ChangePassword = () => {
  const wallet = useWallet();

  const [isCurrentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [confirmPassword, setConfirmPassword] = useState(DEFAULT_PASSWORD);
  const [confirmCurrentPassword, setConfirmCurrentPassword] = useState(DEFAULT_PASSWORD);

  const [isCharacters, setCharacters] = useState<boolean | undefined>(undefined);
  const [isMatch, setMatch] = useState<boolean | undefined>(undefined);
  const [isSame, setSame] = useState<boolean | undefined>(undefined);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showGooglePermissionDialog, setShowGooglePermissionDialog] = useState(false);
  const [showProfileBackupDialog, setShowProfileBackupDialog] = useState(false);
  // No need to maintain selectedProfiles in state since we immediately use them
  const navigate = useNavigate();

  const verify = useCallback(async () => {
    try {
      setIsVerifying(true);
      await wallet.verifyPassword(confirmCurrentPassword);
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

  // Validation effects
  useEffect(() => {
    // Length validation for new password
    const isLengthValid = password.length >= 8;
    setCharacters(isLengthValid);
  }, [password]);

  useEffect(() => {
    // Match validation for new password and confirm password
    if (confirmPassword === password && password.length > 0) {
      setMatch(true);
    } else {
      setMatch(false);
    }
  }, [confirmPassword, password]);

  const changePassword = useCallback(
    async (ignoreBackupsAtTheirOwnRisk = false) => {
      try {
        setIsResetting(true);
        setErrorMessage('');
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
              navigate('/unlock');
            })
            .catch((error) => {
              consoleError('Error locking wallet:', error);
              setErrorMessage(chrome.i18n.getMessage('Oops__unexpected__error'));
            })
            .finally(() => {
              setIsResetting(false);
              setStatusMessage('');
            });
        } else {
          setErrorMessage(chrome.i18n.getMessage('Oops__unexpected__error'));
        }
      } catch (error) {
        consoleError('Error changing password:', error);
        setErrorMessage(error.message);
      } finally {
        setIsResetting(false);
      }
    },
    [confirmCurrentPassword, confirmPassword, wallet, navigate]
  );

  const changePasswordWithBackups = useCallback(
    async (profileUsernames: string[]) => {
      try {
        setIsResetting(true);
        setErrorMessage('');
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
          try {
            await wallet.lockWallet();
            navigate('/unlock');
          } catch (error) {
            consoleError('Error locking wallet:', error);
            setErrorMessage(chrome.i18n.getMessage('Oops__unexpected__error'));
          } finally {
            setIsResetting(false);
            setStatusMessage('');
          }
        } else {
          setErrorMessage(chrome.i18n.getMessage('Oops__unexpected__error'));
        }
      } catch (error) {
        consoleError('Error changing password with backups:', error);
        setErrorMessage(error.message);
      } finally {
        setIsResetting(false);
        setStatusMessage('');
      }
    },
    [confirmCurrentPassword, confirmPassword, wallet, navigate]
  );

  const handleChangePasswordClick = useCallback(async () => {
    try {
      // Check if the user has google permission
      const hasGooglePermission = await wallet.hasGooglePermission();
      if (hasGooglePermission) {
        // Show the profile backup selection dialog
        setShowProfileBackupDialog(true);
      } else {
        setShowGooglePermissionDialog(true);
      }
    } catch (error) {
      consoleError('Error checking Google permission:', error);
      // If we can't check permission, proceed without backups
      await changePassword(true);
    }
  }, [wallet, changePassword]);

  const handleProfileSelection = useCallback(
    (selectedUsernames: string[]) => {
      setShowProfileBackupDialog(false);

      // Proceed with password change, including selected profiles
      changePasswordWithBackups(selectedUsernames);
    },
    [changePasswordWithBackups]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
    >
      <LLHeader
        title={chrome.i18n.getMessage('Change__Password')}
        help={false}
        goBackLink="/dashboard/setting"
      />

      <Box
        sx={{
          flexGrow: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          paddingX: '18px',
          gap: '8px',
        }}
      >
        {/* Current Password */}
        <PasswordInput
          value={confirmCurrentPassword}
          onChange={setConfirmCurrentPassword}
          showPassword={isCurrentPasswordVisible}
          setShowPassword={setCurrentPasswordVisible}
          placeholder={chrome.i18n.getMessage('Current__Password')}
          errorText={
            !!confirmCurrentPassword && isSame === false
              ? chrome.i18n.getMessage('Incorrect__Password')
              : undefined
          }
          showIndicator={false}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* New Password */}
          <PasswordInput
            value={password}
            onChange={(value) => {
              setPassword(value);
              setConfirmPassword('');
            }}
            showPassword={isNewPasswordVisible}
            setShowPassword={setNewPasswordVisible}
            placeholder={chrome.i18n.getMessage('Enter__New__Password')}
            errorText={
              !!password && isCharacters === false
                ? chrome.i18n.getMessage('At__least__8__characters')
                : undefined
            }
            showIndicator={true}
          />
          {/* Confirm New Password */}

          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            showPassword={isConfirmPasswordVisible}
            setShowPassword={setConfirmPasswordVisible}
            placeholder={chrome.i18n.getMessage('Confirm__Password')}
            errorText={
              !!confirmPassword && isMatch === false
                ? chrome.i18n.getMessage('Your__passwords__do__not__match')
                : undefined
            }
            helperText={
              !!confirmPassword && isMatch ? chrome.i18n.getMessage('Passwords__match') : undefined
            }
            showIndicator={false}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          px: '18px',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '18px',
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
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMessage('')} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Simple success message with better visibility */}
      {isResetting && !errorMessage && (
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
        onError={setErrorMessage}
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
  );
};

export default ChangePassword;
