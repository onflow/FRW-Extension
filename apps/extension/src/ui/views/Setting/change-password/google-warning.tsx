import { Warning } from '@mui/icons-material';
import { DialogContent, DialogContentText, DialogTitle, Stack } from '@mui/material';
import React from 'react';

import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import { CustomDialog } from '@/ui/components/custom-dialog';
import { LLPrimaryButton } from '@/ui/components/LLPrimaryButton';
import { LLSecondaryButton } from '@/ui/components/LLSecondaryButton';
import { LLWarningButton } from '@/ui/components/LLWarningButton';
import { useWallet } from '@/ui/hooks/use-wallet';

export const GoogleWarningDialog = ({
  open,
  onClose,
  onProceedAnyway,
  onError,
}: {
  open: boolean;
  onClose: (close: boolean) => void;
  onProceedAnyway: () => void;
  onError: (error: string) => void;
}) => {
  const wallet = useWallet();
  const handleCancel = () => {
    onClose(false);
  };
  const handleConnectToGoogle = async () => {
    // This will ask the user to connect to Google Drive
    onClose(false);
    try {
      return wallet.loadBackupAccounts();
    } catch (error) {
      consoleError('Error loading backup accounts:', error);
      onError('Error loading backup accounts');
    }
  };

  const handleProceedAnyway = async () => {
    onClose(true);

    try {
      // Proceed with password change, explicitly ignoring backups (true flag)
      return onProceedAnyway();
    } catch (error) {
      consoleError('Error changing password:', error);
      onError(
        chrome.i18n.getMessage('Error_changing_password')
          ? `${chrome.i18n.getMessage('Error_changing_password')}: ${error.message}`
          : `Error changing password: ${error.message}`
      );
    }
  };
  return (
    <CustomDialog open={open} onClose={onClose}>
      <DialogTitle>
        <Warning fontSize="medium" /> {chrome.i18n.getMessage('Google_Drive_Not_Connected')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {chrome.i18n.getMessage('Change_Password_No_Google_Drive_Warning')}
        </DialogContentText>
      </DialogContent>
      <Stack direction="column" spacing={2}>
        <LLPrimaryButton
          label={chrome.i18n.getMessage('Connect_Google_Drive')}
          fullWidth
          onClick={handleConnectToGoogle}
        />
        <LLWarningButton
          label={chrome.i18n.getMessage('Change_Password_Anyway')}
          fullWidth
          onClick={handleProceedAnyway}
        />
        <LLSecondaryButton
          label={chrome.i18n.getMessage('Cancel')}
          fullWidth
          onClick={handleCancel}
        />
      </Stack>
    </CustomDialog>
  );
};
