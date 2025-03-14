import { Box, Typography, IconButton, Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect, useCallback } from 'react';

import BrowserWarning from '@/ui/component/BrowserWarning';
import { LLHeader, LLSpinner } from '@/ui/FRWComponent';
import { LLDeleteBackupPopup } from '@/ui/FRWComponent/LLDeleteBackupPopup';
import { useWallet } from 'ui/utils';

import CheckCircleIcon from '../../../../components/iconfont/IconCheckmark';
import IconGoogleDrive from '../../../../components/iconfont/IconGoogleDrive';

const useStyles = makeStyles(() => ({
  arrowback: {
    borderRadius: '100%',
    margin: '8px',
  },
  iconbox: {
    position: 'sticky',
    top: 0,
    // width: '100%',
    backgroundColor: '#121212',
    margin: 0,
    padding: 0,
  },
  developerTitle: {
    zIndex: 20,
    textAlign: 'center',
    top: 0,
    position: 'sticky',
  },
  developerBox: {
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
  },
  radioBox: {
    width: '90%',
    borderRadius: '16px',
    backgroundColor: '#282828',
    margin: '20px auto',
    // padding: '10px 24px',
  },
  checkboxRow: {
    display: 'flex',
    flexDirection: 'row',
    alignContent: 'space-between',
    justifyContent: 'space-between',
    padding: '20px 24px',
  },
}));

const ManageBackups = () => {
  const wallet = useWallet();
  const classes = useStyles();
  const [hasPermission, setHasPermission] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteBackupPop, setDeleteBackupPop] = useState(false);
  const [deleteAllBackupPop, setDeleteAllBackupPop] = useState(false);

  const checkBackup = useCallback(async () => {
    try {
      setLoading(true);
      const hasBackup = await wallet.hasCurrentUserBackup();
      setHasBackup(hasBackup);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [setLoading, setHasBackup, wallet]);

  const checkPermissions = useCallback(async () => {
    const permissions = await wallet.hasGooglePremission();
    setHasPermission(permissions);
    if (permissions) {
      checkBackup();
    }
  }, [checkBackup, wallet]);

  const syncBackup = async () => {
    try {
      setLoading(true);
      await wallet.syncBackup();
      await checkBackup();
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const deleteBackup = async () => {
    try {
      setLoading(true);
      await wallet.deleteCurrentUserBackup();
      await checkBackup();
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const deleteAllBackup = async () => {
    try {
      setLoading(true);
      await wallet.deleteBackups();
      await checkBackup();
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const getGoogle = async () => {
    setLoading(true);

    try {
      const accounts = await wallet.loadBackupAccounts();

      localStorage.setItem('backupAccounts', JSON.stringify(accounts));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <LLHeader title={chrome.i18n.getMessage('Manage__Backups')} help={false} />
      <Box className={classes.developerBox}>
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
            <Button variant="text" onClick={syncBackup}>
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

          {/* <Button
          onClick={()=>setDeleteAllBackupPop(true)}
          variant='contained'
          disabled={loading}
          disableElevation
          color='error'
          sx={{
            width: '90%',
            height: '48px',
            borderRadius: '12px',
            // margin: '80px auto 20px 20px',
            marginBottom: '24px',
            textTransform: 'none',
            alignSelf: 'center'
          }}
        >
          <Typography color='text'>{loading ? 'Deleting' : 'DELETE ALL BACKUPS'}</Typography>
        </Button> */}

          <LLDeleteBackupPopup
            deleteBackupPop={deleteBackupPop}
            handleCloseIconClicked={() => setDeleteBackupPop(false)}
            handleCancelBtnClicked={() => setDeleteBackupPop(false)}
            handleNextBtnClicked={() => {
              deleteBackup();
              setDeleteBackupPop(false);
            }}
          />

          <LLDeleteBackupPopup
            deleteBackupPop={deleteAllBackupPop}
            handleCloseIconClicked={() => setDeleteBackupPop(false)}
            handleCancelBtnClicked={() => setDeleteBackupPop(false)}
            handleNextBtnClicked={() => {
              deleteAllBackup();
              setDeleteBackupPop(false);
            }}
          />
        </>
      )}
    </div>
  );
};

export default ManageBackups;
