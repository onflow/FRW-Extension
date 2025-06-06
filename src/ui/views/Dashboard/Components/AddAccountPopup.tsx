import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, ListItemButton, Typography, Drawer } from '@mui/material';
import React, { useState } from 'react';

import createNew from '@/ui/assets/svg/create-new.svg';
import importExisting from '@/ui/assets/svg/import-existing.svg';
import { ProfileButton } from '@/ui/components/profile/profile-button';
import { useWallet } from 'ui/utils';

interface TransferConfirmationProps {
  isConfirmationOpen: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  addAccount: () => Promise<void>;
  importExistingAccount: boolean;
}

const AddAccountPopup = (props: TransferConfirmationProps) => {
  const usewallet = useWallet();

  return (
    <Drawer
      anchor="bottom"
      sx={{
        zIndex: '1500 !important',
        '& .MuiDrawer-paper': {
          width: '75%',
          marginRight: 'auto',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          background: 'transparent',
          padding: '18px',
        },
      }}
      open={props.isConfirmationOpen}
      onClose={props.handleCancelBtnClicked}
      transitionDuration={300}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'column',
            display: 'flex',
            borderRadius: '16px',
            background: '#2A2A2A',
            overflow: 'hidden',
          }}
        >
          <ProfileButton
            icon={createNew}
            text={chrome.i18n.getMessage('Create_a_new_account')}
            onClick={props.addAccount}
          />
          {props.importExistingAccount && (
            <Box
              sx={{
                height: '1px',
                width: '100%',
                padding: '1px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
              }}
            />
          )}
          {props.importExistingAccount && (
            <ProfileButton
              icon={importExisting}
              text={chrome.i18n.getMessage('Import_an_existing_account')}
              dataTestId="import-existing-account-button"
              onClick={async () => await usewallet.lockAdd()}
            />
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default AddAccountPopup;
