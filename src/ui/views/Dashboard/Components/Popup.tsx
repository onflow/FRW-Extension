import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  ListItemButton,
  Typography,
  Drawer,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  CardMedia,
} from '@mui/material';
import CircularProgress, { circularProgressClasses } from '@mui/material/CircularProgress';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import type { UserInfoResponse } from '@/shared/types/network-types';
import {
  type LoggedInAccountWithIndex,
  type LoggedInAccount,
  type WalletAccount,
} from '@/shared/types/wallet-types';
import userCircleCheck from '@/ui/assets/svg/user-circle-check.svg';
import userCirclePlus from '@/ui/assets/svg/user-circle-plus.svg';
import { ProfileButton } from '@/ui/components/profile/profile-button';
import { useUserInfo } from '@/ui/hooks/use-account-hooks';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import vmsvg from 'ui/assets/svg/viewmore.svg';
import { useWallet } from 'ui/utils';

import { ProfileItem } from '../../../components/profile/profile-item';

interface TransferConfirmationProps {
  isConfirmationOpen: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  userInfo: UserInfoResponse;
  current: WalletAccount;
  switchAccount: (profileId: string) => Promise<void>;
  profileIds: string[];
  switchLoading: boolean;
}

const ProfileItemList = ({
  profileId,
  selectedProfileId,
  switchAccount,
  setLoadingId,
}: {
  profileId: string;
  selectedProfileId: string;
  switchAccount: (profileId: string) => Promise<void>;
  setLoadingId: (id: string) => void;
}) => {
  const userInfo = useUserInfo(profileId);
  return (
    <ProfileItem
      key={profileId}
      profileId={profileId}
      selectedProfileId={selectedProfileId}
      switchAccount={switchAccount}
      setLoadingId={setLoadingId}
      userInfo={userInfo}
    />
  );
};

const Popup = (props: TransferConfirmationProps) => {
  const usewallet = useWallet();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1500 !important' }}
      open={props.isConfirmationOpen}
      onClose={props.handleCancelBtnClicked}
      transitionDuration={300}
      PaperProps={{
        sx: {
          width: '100%',
          height: 'auto',
          maxHeight: '80%',
          background: '#121212',
          borderRadius: '18px 18px 0px 0px',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            margin: '12px 0 9px',
            alignItems: 'center',
            px: '20px',
            gap: '24px',
          }}
          onClick={props.handleCancelBtnClicked}
        >
          <Box
            sx={{
              borderRadius: '100px',
              background: 'rgba(217, 217, 217, 0.10)',
              width: '54px',
              height: '4px',
            }}
          />
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color="text"
            sx={{ fontSize: '18px', textAlign: 'center', lineHeight: '24px', fontWeight: '700' }}
          >
            {chrome.i18n.getMessage('Profiles')}
          </Typography>
        </Box>
        <Box component="nav">
          {Array.isArray(props.profileIds) && (
            <Box
              sx={{
                justifyContent: 'space-between',
                position: 'relative',
                alignItems: 'center',
                flexDirection: 'column',
                display: 'flex',
                height: 'auto',
                maxHeight: '60%',
                overflow: 'scroll',
                paddingBottom: '16px',
              }}
            >
              {props.profileIds.map((profileId: string) => (
                <ProfileItemList
                  key={profileId}
                  profileId={profileId}
                  selectedProfileId={props.userInfo.id}
                  switchAccount={props.switchAccount}
                  setLoadingId={setLoadingId}
                />
              ))}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'column',
            display: 'flex',
            borderRadius: '16px',
            background: '#2A2A2A',
            margin: '9px 18px 0',
            overflow: 'hidden',
          }}
        >
          <ProfileButton
            icon={userCirclePlus}
            text={chrome.i18n.getMessage('Create_a_new_profile')}
            onClick={async () => await usewallet.lockAdd()}
          />
          <Box
            sx={{
              height: '1px',
              width: '100%',
              padding: '1px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
            }}
          />
          {props.profileIds && (
            <ProfileButton
              icon={userCircleCheck}
              text={chrome.i18n.getMessage('Recover_an_existing_profile')}
              onClick={async () => await usewallet.lockAdd()}
            />
          )}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          mx: '18px',
          mb: '35px',
          mt: '10px',
        }}
      ></Box>
    </Drawer>
  );
};

export default Popup;
