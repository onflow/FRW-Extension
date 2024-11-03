import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Typography,
  Box,
  Drawer,
  Stack,
} from '@mui/material';
import {
  LLPrimaryButton,
  LLSecondaryButton,
  LLWarningButton,
} from 'ui/FRWComponent';
import { useWallet } from 'ui/utils';
import ResetModal from '../../../FRWComponent/PopupModal/resetModal';
import StepBox from '../stepBox';


interface AddOrEditAddressProps {
  resetPop: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}

export interface AddressBookValues {
  name: string;
  address: string;
}

const ResetPage = (props: AddOrEditAddressProps) => {

  const usewallet = useWallet();
  const history = useHistory();
  const [showAction, setShowAction] = useState(false);

  const onResetSubmit = async () => {
    // usewallet.resetPwd();
    setShowAction(true);
  };

  const onCancelBtnClicked = () => {
    setShowAction(false);
    props.handleCancelBtnClicked();
  };

  const resetWalletClicked = async () => {
    usewallet.resetPwd();
    // console.log('reset reset reset')
  };


  return (
    <Box
      sx={{
        width: '100%',
        flexDirection: 'column',
        padding: '24px 40px 40px'
      }}
    >
      <Box
        sx={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: '700',
            fontSize: '40px',
            WebkitBackgroundClip: 'text',
            color: '#fff',
            lineHeight: '56px',
          }}
        >
          {chrome.i18n.getMessage('Forget_Password')}
        </Typography>
        <Typography sx={{
          fontSize: '14px', fontFamily: 'Inter',
          fontStyle: 'normal', color: '#BABABA', margin: '18px 0 52px', cursor: 'pointer'
        }}>
          {chrome.i18n.getMessage('Forget_Password')}
          If you forgot your password, you will need to reset your wallet and import your recovery phrase or private key to regain access to your wallet.
        </Typography>
      </Box>
      <StepBox />
      <Stack direction="row" spacing={1}>
        <LLWarningButton
          label= {chrome.i18n.getMessage('Reset_Your_Wallet')}
          fullWidth
          onClick={onResetSubmit}
        />
      </Stack>
      {showAction &&
        <ResetModal
          setShowAction={setShowAction}
          isOpen={showAction}
          onOpenChange={resetWalletClicked}
          errorName={chrome.i18n.getMessage('Confirm_to_reset_Wallet')}
          errorMessage={chrome.i18n.getMessage('This_action_will_remove')}
        />
      }
    </Box>
  );
};

export default ResetPage