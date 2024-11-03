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
import IconSubtract from '../../components/iconfont/IconSubtract';


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

export const LLResetPopup = (props: AddOrEditAddressProps) => {

  const usewallet = useWallet();
  const history = useHistory();
  const [popupState, setPopupState] = useState('reset');
  const [showAction, setShowAction] = useState(false);

  const onResetSubmit = async () => {
    usewallet.resetPwd();
  };

  const onCancelBtnClicked = () => {
    setShowAction(false);
    props.handleCancelBtnClicked();
  };

  const onCancelBtnBack = () => {
    setShowAction(false);
  };

  const onChangeState = (state) => {
    setPopupState(state);
    setShowAction(true);
  };

  const renderResetContent = () => (
    <Box
      px="18px"
      sx={{
        width: '100%',
        height: '470px',
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
        <Box sx={{}}>
          <Typography
            variant="h1"
            align="center"
            py="14px"
            fontWeight="bold"
            fontSize="24px"
          >
            {chrome.i18n.getMessage('Are__you__sure__you__want__to__reset__your__wallet')}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{
            fontSize: '14px', fontFamily: 'Inter',
            fontStyle: 'normal', color: '#BABABA', textAlign: 'center', margin: '18px 36px 52px', cursor: 'pointer'
          }}>
            {chrome.i18n.getMessage('This_will_remove_any_existing_wallets_and_replace_them_with_new_wallets_Make_sure_you_have_your_recovery_phrase_backed_up')}
          </Typography>
        </Box>
      </Box>
      <Stack direction="row" spacing={1}>
        <LLSecondaryButton
          label={chrome.i18n.getMessage('Cancel')}
          fullWidth
          onClick={onCancelBtnBack}
        />
        <LLWarningButton
          label={chrome.i18n.getMessage('Next')}
          fullWidth
          onClick={onResetSubmit}
        />
      </Stack>
    </Box>
  );

  return (
    <Drawer
      anchor="bottom"
      open={props.resetPop}
      transitionDuration={300}
    >
      {!showAction
        &&
        <Box
          padding="18px"
          sx={{
            width: '100%',
            height: 'auto',
            background: 'rgba(0, 0, 0, 0.5)',
            flexDirection: 'column',
          }}
        >
          <Box sx={{}}>
            <Typography
              variant="h1"
              align="center"
              py="14px"
              fontWeight="bold"
              fontSize="24px"
            >
              {chrome.i18n.getMessage('Reset_Restore_your_wallet')}
            </Typography>
          </Box>
          <Stack direction="column" spacing={2}>
            <LLPrimaryButton
              label={chrome.i18n.getMessage('Restore')}
              fullWidth
              onClick={() => history.push('retrieve')}
            />
            <LLWarningButton
              label={chrome.i18n.getMessage('Reset')}
              fullWidth
              onClick={() => onChangeState('reset')}
            />
            <LLSecondaryButton
              label={chrome.i18n.getMessage('Cancel')}
              fullWidth
              onClick={onCancelBtnClicked}
            />
          </Stack>
        </Box>
      }
      {showAction && (popupState === 'reset' && renderResetContent())}


    </Drawer>
  );
};

