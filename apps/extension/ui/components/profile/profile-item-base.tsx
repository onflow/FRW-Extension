import {
  Avatar,
  Box,
  CardMedia,
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
import userCircleGear from '@/ui/assets/svg/user-circle-gear.svg';

/**
 * ProfileItemBase component is used to display a user profile in the profile list.
 * It displays the profile avatar, nickname, and a checkmark if the profile is selected.
 * It also allows the user to switch to the profile when clicked.
 */
export const ProfileItemBase = ({
  profileId,
  selectedProfileId,
  onClick,
  setLoadingId,
  userInfo,
  activeProfileVariant = false,
  rightIcon,
  noPadding = false,
}: {
  profileId?: string; // The profile id of this item
  selectedProfileId?: string; // The profile id of the currently selected profile
  onClick: (profileId: string) => void;
  setLoadingId?: (profileId: string) => void;
  userInfo?: UserInfoResponse;
  activeProfileVariant?: boolean;
  rightIcon?: React.ReactNode;
  noPadding?: boolean;
}) => {
  return (
    <ListItem
      disablePadding
      key={profileId}
      data-testid={
        activeProfileVariant
          ? 'switch-profile-button'
          : `profile-item-nickname-${userInfo?.nickname}`
      }
      onClick={() => {
        if (profileId) {
          if (setLoadingId && profileId !== selectedProfileId) {
            setLoadingId(profileId); // Set the loading index
          }
          onClick(profileId);
        }
      }}
    >
      <ListItemButton sx={{ padding: noPadding ? '0' : '9px 18px' }}>
        <ListItemIcon>
          {userInfo?.avatar ? (
            <Avatar
              component="span"
              src={userInfo?.avatar}
              sx={{ width: '40px', height: '40px', borderRadius: '8px' }}
              alt="avatar"
            />
          ) : (
            <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: '8px' }} />
          )}
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
              {userInfo?.nickname || <Skeleton variant="text" width={120} height={24} />}
            </Typography>
          </Box>
        </ListItemText>
        {rightIcon ? (
          rightIcon
        ) : profileId && profileId === selectedProfileId ? (
          activeProfileVariant ? (
            <CardMedia
              component="img"
              sx={{ width: '24px', height: '24px' }}
              image={userCircleGear}
            />
          ) : (
            <CardMedia component="img" sx={{ width: '24px', height: '24px' }} image={iconCheck} />
          )
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
