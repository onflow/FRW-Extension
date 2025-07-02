import { Box, Typography, IconButton, Button } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';

import { consoleError } from '@/shared/utils/console-log';
import { LLHeader, LLSpinner } from '@/ui/components';
import BrowserWarning from '@/ui/components/BrowserWarning';
import CheckCircleIcon from '@/ui/components/iconfont/IconCheckmark';
import IconGoogleDrive from '@/ui/components/iconfont/IconGoogleDrive';
import { LLDeleteBackupPopup } from '@/ui/components/LLDeleteBackupPopup';
import { useWallet } from 'ui/utils';

/**
 * Manage Backups to Google Drive
 * @returns
 */
const ManageBackups = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const wallet = useWallet();
  const [hasPermission, setHasPermission] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteBackupPop, setDeleteBackupPop] = useState(false);

  const checkBackup = useCallback(async () => {
    try {
      const hasBackup = await wallet.hasCurrentUserBackup();

      setHasBackup(hasBackup);
    } catch {
      consoleError('An error occurred while checking the backup');
    }
  }, [setHasBackup, wallet]);

  const checkPermissions = useCallback(async () => {
    const permissions = await wallet.hasGooglePermission();
    setHasPermission(permissions);
    if (permissions) {
      await checkBackup();
    }
    return permissions;
  }, [checkBackup, wallet]);

  const syncBackup = useCallback(async () => {
    try {
      if (!location.state?.password) {
        // Navigate to the password page
        navigate('/dashboard/setting/backups/password');
        return;
      }
      setLoading(true);
      await wallet.syncBackup(location.state.password);

      await checkBackup();
    } catch {
      consoleError('An error occurred while syncing the backup');
    } finally {
      setLoading(false);
    }
  }, [checkBackup, navigate, location.state?.password, wallet]);

  const deleteBackup = async () => {
    try {
      setLoading(true);
      await wallet.deleteCurrentUserBackup();
      await checkBackup();
    } catch {
      consoleError('An error occurred while deleting the backup');
    } finally {
      setLoading(false);
    }
  };

  const getGoogle = async () => {
    setLoading(true);

    try {
      const accounts = await wallet.loadBackupAccounts();

      localStorage.setItem('backupAccounts', JSON.stringify(accounts));
    } catch {
      consoleError('An error occurred while getting the Google Drive permission');
    } finally {
      setLoading(false);
    }
  };

  // Check permissions then sync the backup after the password is entered
  // The user has clicked the sync button but the password is not entered yet
  // So we need to sync the backup after the user is returned to this page

  useEffect(() => {
    setLoading(true);
    checkPermissions()
      .then((hasGooglePermission) => {
        if (hasGooglePermission && location.state?.password) {
          // Set the state to true to prevent multiple syncs
          return syncBackup();
        }
      })
      .catch((err) => {
        consoleError('Error checking permissions or syncing backup:', err);
      })
      .finally(() => {
        // Set the loading to false after checking permissions and syncing backup is complete
        setLoading(false);
      });
  }, [checkPermissions, location.state?.password, syncBackup]);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <LLHeader title={chrome.i18n.getMessage('Manage__Backups')} help={false} />
      <Box
        sx={{
          width: 'auto',
          height: 'auto',
          margin: '20px 20px',
          backgroundColor: '#282828',
          padding: '20px 20px',
          display: 'flex',
          flexDirection: 'row',
          borderRadius: '16px',
          alignContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <IconGoogleDrive size={20} />
        <Typography variant="body1" color="neutral.contrastText" style={{ weight: 600 }}>
          {chrome.i18n.getMessage('Google__Drive')}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {hasPermission ? (
          loading ? (
            <LLSpinner size={20} />
          ) : hasBackup ? (
            <IconButton>
              <CheckCircleIcon size={20} color={'#41CC5D'} />
            </IconButton>
          ) : (
            <Button variant="text" onClick={() => syncBackup()}>
              {chrome.i18n.getMessage('Sync')}
            </Button>
          )
        ) : (
          <Button variant="text" onClick={getGoogle}>
            {chrome.i18n.getMessage('Link')}
          </Button>
        )}
      </Box>
      <BrowserWarning />

      <Box sx={{ flexGrow: 1 }} />

      {hasBackup && (
        <>
          <Button
            onClick={() => setDeleteBackupPop(true)}
            variant="contained"
            disabled={loading}
            disableElevation
            color="error"
            sx={{
              width: '90%',
              height: '48px',
              borderRadius: '12px',
              // margin: '80px auto 20px 20px',
              marginBottom: '12px',
              textTransform: 'none',
              alignSelf: 'center',
            }}
          >
            <Typography color="text">
              {loading
                ? chrome.i18n.getMessage('Deleting')
                : chrome.i18n.getMessage('Delete__backup')}
            </Typography>
          </Button>

          <LLDeleteBackupPopup
            deleteBackupPop={deleteBackupPop}
            handleCloseIconClicked={() => setDeleteBackupPop(false)}
            handleCancelBtnClicked={() => setDeleteBackupPop(false)}
            handleNextBtnClicked={() => {
              deleteBackup();
              setDeleteBackupPop(false);
            }}
          />
        </>
      )}
    </div>
  );
};

export default ManageBackups;
