import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { Button, Typography, IconButton } from '@mui/material';
import { Box } from '@mui/system';
import React, { useState } from 'react';

import ResetModal from '@/ui/FRWComponent/PopupModal/resetModal';
import { useWallet } from 'ui/utils';

import IconCopy from '../../../../components/iconfont/IconCopy';

const ShowKey = ({ handleSwitchTab, mnemonic }) => {
  const usewallet = useWallet();
  const [canGoNext, setCanGoNext] = useState(false);
  const [isCoverBlur, coverBlur] = useState(true);
  const [showAction, setShowAction] = useState(false);

  const onResetSubmit = async () => {
    // usewallet.resetPwd();
    setShowAction(true);
  };

  const resetWalletClicked = async () => {
    usewallet.resetPwd().then(() => {
      window.close();
    });
    // console.log('reset reset reset')
  };

  const copyAll = () => {
    // Extract 'value' from each item and join them with a space
    const allValues = mnemonic.map((item, index) => `${index + 1}: ${item.value}`).join('\n');

    navigator.clipboard
      .writeText(allValues)
      .then(() => console.log('Copied to clipboard successfully!'))
      .catch((err) => console.error('Failed to copy to clipboard: ', err));
  };

  return (
    <>
      <Box className="registerBox">
        <Typography variant="h4" sx={{ fontWeight: 700 }} color="neutral.contrastText">
          {chrome.i18n.getMessage('Save_your_Private_Key')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Here_is_your_local_private_key')}
        </Typography>

        <Box
          sx={{
            border: '2px solid #5E5E5E',
            borderRadius: '12px',
            mt: '8px',
            position: 'relative',
            // overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignContent: 'flex-start',
              flexWrap: 'wrap',
              minHeight: '172px',
              position: 'relative',
              flexDirection: 'column',
              overflowY: 'scroll',
              borderRadius: '12px',
              backgroundColor: '#333333',
              transition: 'all .3s linear',
              py: '16px',
              px: '24px',
              filter: isCoverBlur ? 'blur(5px)' : 'none',
            }}
          >
            {mnemonic.map((item, i) => (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  width: '100%',
                }}
                key={i}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: '#f9f9f9',
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                    fontSize: '12px',
                  }}
                >
                  {`account ${i + 1}: ${item.value}`}
                </Typography>
              </Box>
            ))}

            <IconButton
              onClick={() => {
                coverBlur(!isCoverBlur);
              }}
              component="span"
              sx={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                height: '40px',
                width: '40px',
                my: '16px',
                mx: '24px',
                backgroundColor: 'neutral1.main',
                transition: 'all .3s ease-in-out',
                justifySelf: 'end',
                opacity: isCoverBlur ? 0 : 1,
                // visibility: isCoverBlur ? 'hidden' : 'visible',
                //   ':hover': {
                //     bgcolor: '#41CC5D',
                //   },
              }}
            >
              <LockRoundedIcon />
            </IconButton>
          </Box>

          {isCoverBlur && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'all .3s ease-in-out',
                visibility: isCoverBlur ? 'visible' : 'hidden',
              }}
            >
              <IconButton
                onClick={() => {
                  coverBlur(!isCoverBlur);
                  setCanGoNext(true);
                }}
                component="span"
                sx={{
                  backgroundColor: 'neutral1.main',
                  //   ':hover': {
                  //     bgcolor: '#41CC5D',
                  //   },
                }}
              >
                <LockOpenRoundedIcon />
              </IconButton>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {chrome.i18n.getMessage('Click__here__to__reveal__phrase')}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Button
            onClick={() => {
              copyAll();
            }}
            variant="text"
            color="primary"
            startIcon={<IconCopy />}
            sx={{
              // height: '40px',
              // width: '40px',
              justifySelf: 'center',
              marginLeft: '3px',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {chrome.i18n.getMessage('Copy')}
            </Typography>
          </Button>
          <Box sx={{ flexGrow: 1 }} />
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            disabled={!canGoNext}
            onClick={onResetSubmit}
            variant="contained"
            color="error"
            size="large"
            sx={{
              height: '56px',
              borderRadius: '12px',
              textTransform: 'capitalize',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.error">
              {chrome.i18n.getMessage('Reset_Your_Wallet')}
            </Typography>
          </Button>
        </Box>
      </Box>
      {showAction && (
        <ResetModal
          setShowAction={setShowAction}
          isOpen={showAction}
          onOpenChange={resetWalletClicked}
          errorName={chrome.i18n.getMessage('Confirm_to_reset_Wallet')}
          errorMessage={chrome.i18n.getMessage('This_action_will_remove')}
        />
      )}
    </>
  );
};

export default ShowKey;
