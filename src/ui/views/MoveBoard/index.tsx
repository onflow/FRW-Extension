import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Typography, Drawer, IconButton, CardMedia } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import {
  type ActiveAccountType,
  type ActiveChildType_depreciated,
} from '@/shared/types/wallet-types';
import LLComingSoon from '@/ui/FRWComponent/LLComingSoonWarning';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import moveft from 'ui/FRWAssets/image/moveft.png';
import movenft from 'ui/FRWAssets/image/movenft.png';
import moveftbg from 'ui/FRWAssets/svg/moveftbg.svg';
import movenftbg from 'ui/FRWAssets/svg/movenftbg.svg';
import { useWallet } from 'ui/utils';

import MoveEvm from './MoveEvm';
import MoveFromChild from './MoveFromChild';
import MoveToChild from './MoveToChild';

interface MoveBoardProps {
  showMoveBoard: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}

const MoveBoard = (props: MoveBoardProps) => {
  const usewallet = useWallet();
  const history = useHistory();
  const { activeAccountType } = useProfiles();
  const [showSelectNft, setSelectBoard] = useState<boolean>(false);
  const [network, setNetwork] = useState<string>('');
  const [alertOpen, setAlertOpen] = useState<boolean>(false);

  // console.log('props.loggedInAccounts', props.current)

  const requestChildType = useCallback(async () => {
    const currentNetwork = await usewallet.getNetwork();
    setNetwork(currentNetwork);
  }, [usewallet]);

  useEffect(() => {
    requestChildType();
  }, [requestChildType]);

  const renderMoveComponent = () => {
    if (activeAccountType === 'evm') {
      // EVM child address
      return (
        <MoveEvm
          showMoveBoard={showSelectNft}
          handleCloseIconClicked={() => setSelectBoard(false)}
          handleCancelBtnClicked={() => setSelectBoard(false)}
          handleAddBtnClicked={() => setSelectBoard(false)}
          handleReturnHome={() => props.handleCancelBtnClicked()}
        />
      );
    }

    if (activeAccountType === 'child') {
      // We are moving FROM a flow child address
      return (
        <MoveFromChild
          showMoveBoard={showSelectNft}
          handleCloseIconClicked={() => setSelectBoard(false)}
          handleCancelBtnClicked={() => setSelectBoard(false)}
          handleAddBtnClicked={() => setSelectBoard(false)}
          handleReturnHome={() => props.handleCancelBtnClicked()}
        />
      );
    }

    // There is no child active, so we are moving TO a flow child address
    return (
      <MoveToChild
        showMoveBoard={showSelectNft}
        handleCloseIconClicked={() => setSelectBoard(false)}
        handleCancelBtnClicked={() => setSelectBoard(false)}
        handleAddBtnClicked={() => setSelectBoard(false)}
        handleReturnHome={() => props.handleCancelBtnClicked()}
      />
    );
  };

  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1100 !important' }}
      transitionDuration={300}
      open={props.showMoveBoard}
      PaperProps={{
        sx: {
          width: '100%',
          height: 'auto',
          background: '#222',
          borderRadius: '18px 18px 0px 0px',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', px: '16px' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            height: '24px',
            margin: '20px 0 12px',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: '40px' }}></Box>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color="text"
            sx={{
              fontSize: '20px',
              fontFamily: 'e-Ukraine',
              textAlign: 'center',
              lineHeight: '24px',
              fontWeight: '700',
            }}
          >
            {chrome.i18n.getMessage('move_assets')}
          </Typography>
          <Box>
            <IconButton onClick={props.handleCancelBtnClicked}>
              <CloseIcon fontSize="medium" sx={{ color: 'icon.navi', cursor: 'pointer' }} />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'column',
            display: 'flex',
          }}
        >
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color="text"
            sx={{
              fontSize: '12px',
              textAlign: 'center',
              lineHeight: '24px',
              padding: '0 65px',
              fontWeight: '400',
              color: '#FFFFFFCC',
            }}
          >
            {chrome.i18n.getMessage('What_type_of_assets_would_you_like_to_move')}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Box
        sx={{
          display: 'flex',
          gap: '16px',
          padding: '0 24px',
          mb: '51px',
          mt: '24px',
          justifyContent: 'space-between',
        }}
      >
        <Button
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '198px',
            width: '162px',
            backgroundImage: `url(${movenftbg})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            '&:hover': {
              opacity: 0.6,
            },
          }}
          onClick={() => {
            setSelectBoard(true);
          }}
        >
          <CardMedia
            component="img"
            sx={{ width: '147px', height: 'auto', display: 'inline' }}
            image={movenft}
          />
          <Typography
            sx={{ color: '#FFFFFF', fontSize: '14px', weight: '600', textTransform: 'capitalize' }}
          >
            {chrome.i18n.getMessage('Move')} NFTs
          </Typography>
        </Button>
        <Button
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '198px',
            width: '162px',
            backgroundImage: `url(${moveftbg})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            '&:hover': {
              opacity: 0.6,
            },
          }}
          onClick={() => {
            history.push('/dashboard/token/flow/send');
          }}
        >
          <CardMedia
            component="img"
            sx={{ width: '140px', height: 'auto', display: 'inline' }}
            image={moveft}
          />
          <Typography
            sx={{ color: '#FFFFFF', fontSize: '14px', weight: '600', textTransform: 'capitalize' }}
          >
            {chrome.i18n.getMessage('move_tokens')}
          </Typography>
        </Button>
      </Box>

      {network === 'mainnet' && (
        <LLComingSoon alertOpen={alertOpen} handleCloseIconClicked={() => setAlertOpen(false)} />
      )}
      {showSelectNft && renderMoveComponent()}
    </Drawer>
  );
};

export default MoveBoard;
