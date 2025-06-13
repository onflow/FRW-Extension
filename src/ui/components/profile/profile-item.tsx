import {
  Avatar,
  Box,
  CardMedia,
  CircularProgress,
  circularProgressClasses,
  ListItemText,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Typography,
  Skeleton,
} from '@mui/material';
import React from 'react';

import { type UserInfoResponse } from '@/shared/types/network-types';
import iconCheck from '@/ui/assets/svg/check-circle-fill.svg';
import iconCheckUnfill from '@/ui/assets/svg/check-circle-unfill.svg';
import { useUserInfo } from '@/ui/hooks/use-account-hooks';

/**
 * ProfileItem component is used to display a user profile in the profile list.
 * It displays the profile avatar, nickname, and a checkmark if the profile is selected.
 * It also allows the user to switch to the profile when clicked.
 */
export const ProfileItem = ({
  profileId,
  selectedProfileId,
  switchAccount,
  setLoadingId,
  userInfo,
}: {
  profileId: string; // The profile id of this item
  selectedProfileId: string; // The profile id of the currently selected profile
  switchAccount: (profileId: string) => void;
  setLoadingId: (profileId: string) => void;
  userInfo: UserInfoResponse | undefined;
}) => {
  if (!userInfo) {
    return (
      <ListItem disablePadding>
        <ListItemButton sx={{ padding: '9px 18px' }}>
          <ListItemIcon>
            <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: '8px' }} />
          </ListItemIcon>
          <ListItemText>
            <Skeleton variant="text" width={120} height={24} />
          </ListItemText>
        </ListItemButton>
      </ListItem>
    );
  }

  return (
    <ListItem
      disablePadding
      key={profileId}
      data-testid={`profile-item-nickname-${userInfo?.nickname}`}
      onClick={() => {
        if (profileId !== selectedProfileId) {
          setLoadingId(profileId); // Set the loading index
          switchAccount(profileId);
        }
      }}
    >
      <ListItemButton sx={{ padding: '9px 18px' }}>
        <ListItemIcon>
          <Avatar
            component="span"
            src={userInfo?.avatar}
            sx={{ width: '40px', height: '40px', borderRadius: '8px' }}
            alt="avatar"
          />
        </ListItemIcon>
        <ListItemText>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="body1"
              component="div"
              display="inline"
              sx={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}
            >
              {userInfo?.nickname}
            </Typography>
          </Box>
        </ListItemText>
        {profileId === selectedProfileId ? (
          <CardMedia component="img" sx={{ width: '24px', height: '24px' }} image={iconCheck} />
        ) : (
          <CardMedia
            component="img"
            sx={{ width: '24px', height: '24px' }}
            image={iconCheckUnfill}
          />
        )}
      </ListItemButton>
    </ListItem>
  );
};
