import { Switch, switchClasses } from '@mui/base/Switch';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { Typography, IconButton, Box, Avatar } from '@mui/material';
import Button from '@mui/material/Button';
import { styled } from '@mui/system';
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { openIndexPage } from '@/background/webapi/tab';
import { consoleError } from '@/shared/utils/console-log';
import { getCurrentProfileId } from '@/shared/utils/current-id';
import RemoveProfileModal from '@/ui/components/PopupModal/remove-profile-modal';
import ResetModal from '@/ui/components/PopupModal/resetModal';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useWallet } from 'ui/utils';

import EditAccount from './EditAccount';
const orange = {
  500: '#41CC5D',
};

const grey = {
  400: '#BABABA',
  500: '#787878',
  600: '#5E5E5E',
};

const Root = styled('span')(
  ({ theme }) => `
    font-size: 0;
    position: relative;
    display: inline-block;
    width: 40px;
    height: 20px;
    // margin: 0;
    margin-left: auto;
    cursor: pointer;

    &.${switchClasses.disabled} {
      opacity: 0.4;
      cursor: not-allowed;
    }

    & .${switchClasses.track} {
      background: ${theme.palette.mode === 'dark' ? grey[600] : grey[400]};
      border-radius: 10px;
      display: block;
      height: 100%;
      width: 100%;
      position: absolute;
    }

    & .${switchClasses.thumb} {
      display: block;
      width: 14px;
      height: 14px;
      top: 3px;
      left: 3px;
      border-radius: 16px;
      background-color: #fff;
      position: relative;
      transition: all 200ms ease;
    }

    &.${switchClasses.focusVisible} .${switchClasses.thumb} {
      background-color: ${grey[500]};
      box-shadow: 0 0 1px 8px rgba(0, 0, 0, 0.25);
    }

    &.${switchClasses.checked} {
      .${switchClasses.thumb} {
        left: 17px;
        top: 3px;
        background-color: #fff;
      }

      .${switchClasses.track} {
        background: ${orange[500]};
      }
    }

    & .${switchClasses.input} {
      cursor: inherit;
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      opacity: 0;
      z-index: 1;
      margin: 0;
    }
    `
);

const AccountSettings = () => {
  const history = useHistory();
  const wallet = useWallet();
  const { profileIds, userInfo, walletList } = useProfiles();

  const [username, setUsername] = useState(userInfo?.username || '');
  const [nickname, setNickname] = useState(userInfo?.nickname || '');
  const [avatar, setAvatar] = useState(userInfo?.avatar || '');
  const [isEdit, setEdit] = useState(false);

  const [modeAnonymous, setModeAnonymous] = useState(userInfo?.private === 1);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  const loadAccountData = useCallback(async () => {
    try {
      const userInfo = await wallet.getUserInfo(false);
      setUsername(userInfo.username);
      setNickname(userInfo.nickname);
      setAvatar(userInfo.avatar);
    } catch (error) {
      consoleError('Failed to load account data:', error);
    }
  }, [wallet]);

  const toggleEdit = () => {
    setEdit(!isEdit);
  };

  const getAnonymousMode = useCallback(async () => {
    try {
      const userInfo = await wallet.getUserInfo(false);
      if (userInfo.private === 1) {
        setModeAnonymous(false);
      } else {
        setModeAnonymous(true);
      }
    } catch (error) {
      consoleError('Failed to get anonymous mode:', error);
    }
  }, [wallet]);

  const updatePreference = useCallback(
    async (modeAnonymous: boolean) => {
      if (modeAnonymous) {
        await wallet.updateProfilePreference(2);
      } else {
        await wallet.updateProfilePreference(1);
      }
      await getAnonymousMode();
    },
    [getAnonymousMode, wallet]
  );

  const refreshUsername = useCallback(async () => {
    const userInfo = await wallet.getUserInfo(true);
    setUsername(userInfo.username);
  }, [wallet]);

  const switchAnonymousMode = useCallback(async () => {
    await updatePreference(!modeAnonymous);
  }, [updatePreference, modeAnonymous]);

  const handleOpenRemoveModal = () => {
    setRemoveError('');
    setShowRemoveConfirmModal(true);
  };

  const handleCloseRemoveModal = () => {
    setShowRemoveConfirmModal(false);
    setRemoveError('');
  };

  const handleConfirmRemove = async (password: string) => {
    if (!walletList) {
      consoleError('Cannot remove profile: No active account details found.');
      setRemoveError('Account details not loaded for removal.');
      return;
    }

    setIsRemoving(true);
    setRemoveError('');

    try {
      // Get the current profile ID
      const profileId = await getCurrentProfileId();

      await wallet.removeProfile(password, profileId);

      handleCloseRemoveModal();
      if (profileIds && profileIds.length > 1) {
        wallet.lockWallet().then(() => {
          history.push('/unlock');
        });
      } else {
        wallet.signOutWallet().then(() => {
          openIndexPage('welcome?add=true');
        });
      }
    } catch (error) {
      consoleError('Failed to remove profile:', error);
      if (error.message && error.message.includes('Incorrect password')) {
        setRemoveError('Incorrect password. Please try again.');
      } else {
        setRemoveError(error.message || 'An unexpected error occurred during profile removal.');
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const handleResetWallet = () => {
    wallet.resetPwd();
  };

  useEffect(() => {
    try {
      getAnonymousMode();
      loadAccountData();
    } catch (error) {
      consoleError('Failed to load account data:', error);
    }
  }, [getAnonymousMode, loadAccountData]);

  return (
    <div className="page">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'auto',
          px: '16px',
        }}
      >
        <IconButton onClick={() => history.push('/dashboard/setting')}>
          <ArrowBackIcon fontSize="medium" sx={{ color: 'icon.navi', cursor: 'pointer' }} />
        </IconButton>
        <Typography
          variant="h1"
          sx={{
            py: '14px',
            alignSelf: 'center',
            fontSize: '20px',
          }}
        >
          {chrome.i18n.getMessage('Profile')}
        </Typography>
        <IconButton
          onClick={() => {
            toggleEdit();
          }}
        >
          <EditRoundedIcon fontSize="medium" sx={{ color: 'icon.navi', cursor: 'pointer' }} />
        </IconButton>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Avatar sx={{ width: '88px', height: '88px', marginBottom: '10px' }} src={avatar} />
        <Box sx={{ display: 'flex', justifyContent: 'center', color: '#fff' }}>
          <Typography
            display="inline"
            sx={{
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#E6E6E6',
              textAlign: 'center',
            }}
          >
            {nickname}
          </Typography>
        </Box>
        <Typography
          display="inline"
          sx={{
            fontWeight: 'normal',
            fontSize: '12px',
            color: '#BABABA',
            textAlign: 'center',
            marginBottom: '15px',
          }}
          variant="body2"
        >
          @{username}
        </Typography>
        <Box
          sx={{
            width: 'auto',
            margin: '10px auto',
            padding: '0 20px',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <Box
            sx={{
              backgroundColor: '#282828',
              display: 'flex',
              padding: '20px 24px',
              justifyContent: 'space-between',
              borderRadius: '16px',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body1" color="neutral.contrastText" style={{ weight: 600 }}>
                {chrome.i18n.getMessage('Anonymous')}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ weight: 400, fontSize: '12px' }}
              >
                {chrome.i18n.getMessage(
                  'Other__Lilico__users__cannot__search__for__your__username'
                )}
              </Typography>
            </Box>
            <Switch
              checked={modeAnonymous}
              slots={{
                root: Root,
              }}
              onChange={() => {
                switchAnonymousMode();
              }}
            />
          </Box>

          <Box
            sx={{
              backgroundColor: '#282828',
              display: 'flex',
              padding: '20px 24px',
              justifyContent: 'center',
              borderRadius: '16px',
              marginTop: '8px',
            }}
          >
            <Button
              variant="contained"
              disableElevation
              color="error"
              onClick={handleOpenRemoveModal}
              sx={{
                width: '100% !important',
                height: '48px',
                borderRadius: '12px',
                textTransform: 'none',
              }}
            >
              <Typography color="text">{chrome.i18n.getMessage('Remove__Profile')}</Typography>
            </Button>
          </Box>

          <Box
            sx={{
              backgroundColor: '#282828',
              display: 'flex',
              padding: '20px 24px',
              justifyContent: 'center',
              borderRadius: '16px',
              marginTop: '8px',
              marginBottom: '16px',
            }}
          >
            <Button
              variant="contained"
              disableElevation
              color="error"
              onClick={() => setShowResetModal(true)}
              sx={{
                width: '100% !important',
                height: '48px',
                borderRadius: '12px',
                textTransform: 'none',
              }}
            >
              <Typography color="text">{chrome.i18n.getMessage('Reset_Wallet')}</Typography>
            </Button>
          </Box>

          <EditAccount
            isEdit={isEdit}
            handleCloseIconClicked={() => toggleEdit()}
            handleCancelBtnClicked={() => toggleEdit()}
            handleAddBtnClicked={() => {
              toggleEdit();
              refreshUsername();
            }}
            nickname={nickname}
            setNickname={setNickname}
            avatar={avatar}
          />
        </Box>
      </Box>

      <RemoveProfileModal
        isOpen={showRemoveConfirmModal}
        onClose={handleCloseRemoveModal}
        onConfirm={handleConfirmRemove}
        isRemoving={isRemoving}
        error={removeError}
        profileName={nickname}
        profileUsername={username}
      />

      <ResetModal
        setShowAction={setShowResetModal}
        isOpen={showResetModal}
        onOpenChange={handleResetWallet}
        errorName={chrome.i18n.getMessage('Confirm_to_reset_Wallet')}
        errorMessage={chrome.i18n.getMessage('This_action_will_remove')}
      />
    </div>
  );
};

export default AccountSettings;
