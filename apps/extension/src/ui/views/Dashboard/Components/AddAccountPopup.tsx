import { Box, Drawer } from '@mui/material';
import React from 'react';

import createNew from '@/ui/assets/svg/create-new.svg';
import importExisting from '@/ui/assets/svg/import-existing.svg';
import { ProfileButton } from '@/ui/components/profile/profile-button';
import { useWallet } from '@/ui/hooks/use-wallet';

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
          maxWidth: '400px',
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

        {!props.importExistingAccount && (
          <Box
            sx={{
              height: '49px',
              width: '100%',
              padding: '1px 16px',
              backgroundColor: 'transparent',
            }}
          />
        )}
      </Box>
    </Drawer>
  );
};

export default AddAccountPopup;
