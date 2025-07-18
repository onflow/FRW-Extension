import { Box, Drawer, Stack, Typography } from '@mui/material';
import React from 'react';

import { LLPrimaryButton, LLSecondaryButton } from '@/ui/components';
import IconSubtract from '@/ui/components/iconfont/IconSubtract';

interface DeleteBackupProps {
  deleteBackupPop: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleNextBtnClicked: () => void;
}

export const LLDeleteBackupPopup = (props: DeleteBackupProps) => {
  const onCancelBtnClicked = () => {
    props.handleCancelBtnClicked();
  };

  const onNextBtnClicked = () => {
    props.handleNextBtnClicked();
  };

  const renderContent = () => (
    <Box
      px="18px"
      sx={{
        width: '100%',
        height: '480px',
        background: 'rgba(0, 0, 0, 0.5)',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ margin: '54px 0 38px' }}>
          <IconSubtract size={48} />
        </Box>
        <Box sx={{ width: '228px' }}>
          <Typography variant="h1" align="center" py="14px" fontWeight="bold" fontSize="24px">
            {chrome.i18n.getMessage('Are_you_sure_you_want_to_delete_your_backup')}
          </Typography>
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: '14px',
              fontFamily: 'Inter',
              fontStyle: 'normal',
              color: '#BABABA',
              textAlign: 'center',
              margin: '18px 36px 52px',
              cursor: 'pointer',
            }}
          >
            {chrome.i18n.getMessage(
              'This_will_remove_this_google_backup_You_will_not_import_this_wallet_via_Google_backup'
            )}
          </Typography>
        </Box>
      </Box>
      <Stack direction="row" spacing={1}>
        <LLSecondaryButton
          label={chrome.i18n.getMessage('Cancel')}
          fullWidth
          onClick={onCancelBtnClicked}
        />
        <LLPrimaryButton
          label={chrome.i18n.getMessage('Next')}
          fullWidth
          onClick={onNextBtnClicked}
        />
      </Stack>
    </Box>
  );

  return (
    <Drawer anchor="bottom" open={props.deleteBackupPop} transitionDuration={300}>
      {renderContent()}
    </Drawer>
  );
};
