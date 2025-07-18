import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box, Button, CircularProgress, DialogActions, Skeleton, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';
import { DEFAULT_PASSWORD } from '@onflow/flow-wallet-shared/utils/default';

import { useWallet } from '@/ui/hooks/use-wallet';

import { CustomDialog } from '../custom-dialog'; // Reuse the styled dialog base
import { PasswordInput } from '../password/PasswordInput';

interface RemoveProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void; // Callback with the entered password
  isRemoving: boolean;
  error: string; // Error specifically from the removal attempt
  profileName?: string; // Optional profile name
  profileUsername?: string; // Optional profile username
}

const RemoveProfileModal: React.FC<RemoveProfileModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isRemoving,
  error: removalError, // Rename prop to avoid conflict
  profileName,
  profileUsername,
}) => {
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isCheckingBackup, setIsCheckingBackup] = useState<boolean>(true); // Added loading state
  const [backupCheckError, setBackupCheckError] = useState<string>('');
  const [hasBackup, setHasBackup] = useState<boolean>(false);
  const wallet = useWallet();

  const checkBackup = useCallback(async () => {
    setIsCheckingBackup(true); // Set loading true
    setBackupCheckError(''); // Clear previous errors
    try {
      const backupResult = await wallet.hasCurrentUserBackup(); // Renamed variable for clarity
      setHasBackup(backupResult);
    } catch (err) {
      consoleError('An error occurred while checking the backup:', err);
      setBackupCheckError('Failed to check backup status.'); // Keep error state
      setHasBackup(false); // Assume no backup on error
    } finally {
      setIsCheckingBackup(false); // Set loading false
    }
  }, [setHasBackup, wallet]);

  useEffect(() => {
    if (isOpen) {
      setPassword(''); // Clear password on open
      setHasBackup(false); // Reset backup state on open
      checkBackup();
    }
  }, [isOpen, checkBackup]);

  const handleConfirmClick = () => {
    if (password) {
      onConfirm(password);
    }
  };

  return (
    <CustomDialog open={isOpen} onClose={onClose}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography sx={{ color: '#FF6D24', fontSize: '24px', fontWeight: '700' }}>
          {chrome.i18n.getMessage('Remove__Profile')}
        </Typography>

        {profileName && profileUsername && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mt: 2,
              mb: 2,
              py: 2,
              px: 3,
              backgroundColor: '#2C2C2C',
              borderRadius: '8px',
            }}
          >
            <Typography sx={{ fontWeight: 'bold', fontSize: '16px' }}>{profileName}</Typography>
            <Typography sx={{ color: '#BABABA', fontSize: '14px' }}>@{profileUsername}</Typography>
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: !isCheckingBackup && backupCheckError ? '#FF6D24' : '#41CC5D',
            mt: 1,
            mb: 1,
          }}
        >
          {isCheckingBackup && <Skeleton variant="circular" width={20} height={20} />}
          {!isCheckingBackup && hasBackup && (
            <CheckCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
          )}
          {!isCheckingBackup && !hasBackup && (
            <WarningAmberRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          )}
          <Typography sx={{ fontSize: '14px' }}>
            {isCheckingBackup && <Skeleton variant="text" width={200} height={20} />}
            {!isCheckingBackup && hasBackup && chrome.i18n.getMessage('Backup__Found')}
            {!isCheckingBackup && backupCheckError && backupCheckError}
          </Typography>
        </Box>

        <Typography sx={{ color: '#BABABA', fontSize: '16px' }}>
          {chrome.i18n.getMessage('Remove_profile_warning_simplified')}
        </Typography>

        <PasswordInput
          autoFocus
          value={password}
          onChange={setPassword}
          showPassword={isPasswordVisible}
          setShowPassword={setIsPasswordVisible}
          placeholder={chrome.i18n.getMessage('Password')}
          errorText={removalError}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && password && !isRemoving) {
              handleConfirmClick();
            }
          }}
        />

        <DialogActions sx={{ display: 'flex', flexDirection: 'row' }}>
          <Button
            className="registerButton"
            variant="contained"
            color="secondary"
            form="seed"
            size="large"
            onClick={onClose}
            disabled={isRemoving}
            sx={{
              height: '56px',
              width: '100%',
              borderRadius: '12px',
              textTransform: 'capitalize',
              gap: '12px',
              display: 'flex',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
              {chrome.i18n.getMessage('Cancel')}
            </Typography>
          </Button>
          <Button
            className="registerButton"
            variant="contained"
            color="error"
            form="seed"
            size="large"
            onClick={handleConfirmClick}
            disabled={!password || isRemoving}
            sx={{
              height: '56px',
              width: '100%',
              borderRadius: '12px',
              textTransform: 'capitalize',
              gap: '12px',
              display: 'flex',
              marginLeft: '40px',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.error">
              {isRemoving ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                chrome.i18n.getMessage('Remove')
              )}
            </Typography>
          </Button>
        </DialogActions>
      </Box>
    </CustomDialog>
  );
};

export default RemoveProfileModal;
