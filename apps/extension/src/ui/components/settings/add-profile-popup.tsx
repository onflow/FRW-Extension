import { Box, Drawer, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import ProfileActions from '@/ui/components/profile/profile-actions';

interface AddProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProfilePopup = ({ isOpen, onClose }: AddProfilePopupProps) => {
  const theme = useTheme();
  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1500 !important' }}
      open={isOpen}
      onClose={onClose}
      transitionDuration={300}
      slotProps={{
        paper: {
          sx: {
            width: '100%',
            height: 'auto',
            maxHeight: '80%',
            background: theme.palette.background.default,
            borderRadius: '18px 18px 0px 0px',
          },
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
          onClick={onClose}
        >
          <Box
            sx={{
              borderRadius: '100px',
              background: theme.palette.action.disabledBackground,
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
            {chrome.i18n.getMessage('Add_Profile') || 'Add Profile'}
          </Typography>
        </Box>

        <ProfileActions onActionComplete={onClose} showImportButton={true} />
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

export default AddProfilePopup;
