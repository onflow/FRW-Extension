import {
  Checkbox,
  List,
  ListItem,
  Typography,
  Box,
  CircularProgress,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';

import { type ProfileBackupStatus } from '@/shared/types/wallet-types';
import { consoleError } from '@/shared/utils/console-log';
import { CustomDialog } from '@/ui/components/custom-dialog';
import { LLPrimaryButton } from '@/ui/components/LLPrimaryButton';
import { LLSecondaryButton } from '@/ui/components/LLSecondaryButton';
import { useWallet } from '@/ui/utils';

interface ProfileBackupSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedProfiles: string[]) => void;
  currentPassword: string;
}

export const ProfileBackupSelectionDialog = ({
  open,
  onClose,
  onConfirm,
  currentPassword,
}: ProfileBackupSelectionDialogProps) => {
  const wallet = useWallet();
  const [backups, setBackups] = useState<ProfileBackupStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBackupData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Get profile backup statuses
      const backupStatuses = await wallet.getProfileBackupStatuses(currentPassword);
      setBackups(backupStatuses);
    } catch (err) {
      consoleError('Failed to load backup data:', err);
      setError(
        chrome.i18n.getMessage('Failed_to_load_backup_data') ||
          'Failed to load backup data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [currentPassword, wallet, setLoading, setError, setBackups]);

  // Load backup data when the dialog opens
  useEffect(() => {
    if (open) {
      loadBackupData();
    }
  }, [open, loadBackupData]);

  const handleToggleSelection = (index: number) => {
    const newBackups = [...backups];
    newBackups[index].isSelected = !newBackups[index].isSelected;
    setBackups(newBackups);
  };

  const handleConfirm = () => {
    const selectedProfiles = backups
      .filter((backup) => backup.isSelected)
      .map((backup) => backup.username);
    onConfirm(selectedProfiles);
  };

  const getStatusIcon = (backup: ProfileBackupStatus) => {
    if (backup.isActive && backup.isBackedUp && backup.canDecrypt) {
      return '✅'; // Loaded and backed up with current password
    } else if (backup.isActive && backup.isBackedUp && !backup.canDecrypt) {
      return '⚠️'; // Loaded but backed up with other password
    } else if (!backup.isActive && backup.isBackedUp && backup.canDecrypt) {
      return '☑️'; // Not loaded, but backed up with current password
    } else if (backup.isActive && !backup.isBackedUp) {
      return '⚠️'; // Loaded, but not backed up
    } else if (!backup.isActive && backup.isBackedUp && !backup.canDecrypt) {
      return '🛑'; // Not loaded, but backed up with other password
    }
    return '';
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          padding: '18px',
        },
      }}
    >
      <DialogTitle sx={{ padding: '0' }}>
        {chrome.i18n.getMessage('Change_Password_on_Backups') || 'Change Password on Backups'}
      </DialogTitle>
      <DialogContent sx={{ padding: '0', margin: '18px 0' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <Typography sx={{ marginBottom: '12px', fontSize: '14px' }}>
              {chrome.i18n.getMessage('Profile_Password_Change_Description') ||
                'The following profiles are either loaded in your wallet, backed up to Google Drive, or both. Select which profiles you want to update the password for:'}
            </Typography>
            <List sx={{ padding: '0 0 8px 0' }}>
              {backups.map((backup, index) => (
                <ListItem
                  key={backup.username}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 0px',
                  }}
                >
                  <Checkbox
                    checked={backup.isSelected}
                    onChange={() => handleToggleSelection(index)}
                    disabled={backup.isBackedUp && !backup.canDecrypt} // Can't update if we can't decrypt
                    size="small"
                    sx={{
                      padding: 0,
                      marginRight: '24px',
                    }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '14px' }}>
                      {getStatusIcon(backup)} {backup.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                      {backup.isActive
                        ? chrome.i18n.getMessage('Loaded_in_wallet') || 'Loaded'
                        : chrome.i18n.getMessage('Not_loaded_in_wallet') || 'Not loaded'}
                      {backup.isBackedUp &&
                        backup.canDecrypt &&
                        ` • ${chrome.i18n.getMessage('Backed_up_with_current_password') || 'current password'}`}
                      {backup.isBackedUp &&
                        !backup.canDecrypt &&
                        ` • ${chrome.i18n.getMessage('Backed_up_with_different_password') || 'different password'}`}
                      {!backup.isBackedUp &&
                        ` • ${chrome.i18n.getMessage('Not_backed_up') || 'Not backed up'}`}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
            <Box mt={1}>
              <Typography variant="caption" sx={{ fontSize: '11px' }}>
                {chrome.i18n.getMessage('Legend') || 'Legend'}:<br />✅{' '}
                {chrome.i18n.getMessage('Loaded_and_backed_up_with_current_password') ||
                  'Loaded and backed up with current password'}
                <br />
                ⚠️{' '}
                {chrome.i18n.getMessage(
                  'Loaded_but_backed_up_with_other_password_or_not_backed_up'
                ) || 'Loaded but backed up with other password or not backed up'}
                <br />
                ☑️{' '}
                {chrome.i18n.getMessage('Not_loaded_but_backed_up_with_current_password') ||
                  'Not loaded, but backed up with current password'}
                <br />
                🛑{' '}
                {chrome.i18n.getMessage('Not_loaded_but_backed_up_with_other_password') ||
                  'Not loaded, but backed up with other password'}
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: '0' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <LLSecondaryButton
              fullWidth
              label={chrome.i18n.getMessage('Cancel') || 'Cancel'}
              onClick={onClose}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <LLPrimaryButton
              fullWidth
              label={chrome.i18n.getMessage('Change') || 'Change'}
              onClick={handleConfirm}
              disabled={loading || !backups.some((b) => b.isSelected)}
            />
          </Box>
        </Box>
      </DialogActions>
    </CustomDialog>
  );
};
