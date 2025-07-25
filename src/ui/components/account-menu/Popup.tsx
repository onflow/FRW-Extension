import { Box, Drawer, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

import { type UserInfoResponse, type WalletAccount } from '@onflow/frw-shared/types';

import ProfileActions from '@/ui/components/profile/profile-actions';
import { ProfileItem } from '@/ui/components/profile/profile-item';

interface TransferConfirmationProps {
  isConfirmationOpen: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  userInfo?: UserInfoResponse;
  current: WalletAccount;
  switchProfile: (profileId: string) => Promise<void>;
  profileIds?: string[];
  switchLoading: boolean;
}

const Popup = (props: TransferConfirmationProps) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const theme = useTheme();

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
          background: theme.palette.background.default,
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
                <ProfileItem
                  key={profileId}
                  profileId={profileId}
                  selectedProfileId={props.userInfo?.id}
                  switchAccount={props.switchProfile}
                  setLoadingId={setLoadingId}
                />
              ))}
            </Box>
          )}
        </Box>

        <ProfileActions
          onActionComplete={() => props.handleCancelBtnClicked()}
          showImportButton={!!props.profileIds}
        />
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
