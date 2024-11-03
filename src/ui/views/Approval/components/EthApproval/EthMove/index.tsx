import React, { useState, useEffect } from 'react';
import { Box, Button, ListItemButton, Typography, Drawer, IconButton, ListItem, ListItemIcon, ListItemText, Avatar, CardMedia } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useWallet } from 'ui/utils';
import { useHistory } from 'react-router-dom';
import popLock from 'ui/FRWAssets/svg/popLock.svg';
import moveftbg from 'ui/FRWAssets/svg/moveftbg.svg';
import movenftbg from 'ui/FRWAssets/svg/movenftbg.svg';
import moveft from 'ui/FRWAssets/image/moveft.png';
import movenft from 'ui/FRWAssets/image/movenft.png';
import MoveNfts from './MoveNfts';
import MoveEvm from './MoveEvm';
import MoveFromFlow from './EvmMove/MoveFromFlow';
import MoveFromEvm from './EvmMove/MoveFromEvm';
import { add } from 'lodash';




interface MoveBoardProps {
  showMoveBoard: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}


const MoveBoard = (props: MoveBoardProps) => {


  const usewallet = useWallet();
  const history = useHistory();
  const [showSelectNft, setSelectBoard] = useState<boolean>(false);
  const [moveFtOpen, setMoveFt] = useState<boolean>(false);
  const [childType, setChildType] = useState<string>('');

  // console.log('props.loggedInAccounts', props.current)

  const requestChildType = async () => {
    const result = await usewallet.getActiveWallet();
    setChildType(result);
  };

  const closeFullPage = () => {
    setMoveFt(false);
    props.handleCancelBtnClicked();
  };

  useEffect(() => {
    requestChildType();
  }, [])

  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1000 !important' }}
      transitionDuration={300}
      open={props.showMoveBoard}
      PaperProps={{
        sx: { width: '100%', height: 'auto', background: '#222', borderRadius: '18px 18px 0px 0px', },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', px: '16px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '24px', margin: '20px 0 12px', alignItems: 'center', }}>
          <Box sx={{ width: '40px' }}></Box>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color='text'
            sx={{ fontSize: '20px', fontFamily: 'e-Ukraine', textAlign: 'center', lineHeight: '24px', fontWeight: '700' }}
          >
            {chrome.i18n.getMessage('move_assets')}
          </Typography>
          <Box>
            <IconButton onClick={props.handleCancelBtnClicked}>
              <CloseIcon
                fontSize="medium"
                sx={{ color: 'icon.navi', cursor: 'pointer' }}
              />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'column',
            display: 'flex'
          }}
        >
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color='text'
            sx={{ fontSize: '12px', textAlign: 'center', lineHeight: '24px', padding: '0 65px', fontWeight: '400', color: '#FFFFFFCC' }}
          >
            {chrome.i18n.getMessage('Would_you_like_to_move')}{`${childType === 'evm' ? 'FLOW' : 'EVM on FLOW'}`} {chrome.i18n.getMessage('lowercaseaccount')}?
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ display: 'flex', gap: '16px', padding: '0 24px', mb: '51px', mt: '24px', justifyContent: 'space-between' }}>
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
          <CardMedia component="img" sx={{ width: '147px', height: 'auto', display: 'inline' }} image={movenft} />
          <Typography sx={{ color: '#FFFFFF', fontSize: '14px', weight: '600', textTransform: 'capitalize' }}>{chrome.i18n.getMessage('Move')} NFTs</Typography>
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
            setMoveFt(true);
          }}>
          <CardMedia component="img" sx={{ width: '140px', height: 'auto', display: 'inline', }} image={moveft} />
          <Typography sx={{ color: '#FFFFFF', fontSize: '14px', weight: '600', textTransform: 'capitalize' }}>
            {chrome.i18n.getMessage('move_tokens')}
          </Typography>
        </Button>
      </Box>
      {showSelectNft && (
        <>
          {childType === 'evm' ? (
            <MoveEvm
              showMoveBoard={showSelectNft}
              handleCloseIconClicked={() => setSelectBoard(false)}
              handleCancelBtnClicked={() => setSelectBoard(false)}
              handleAddBtnClicked={() => setSelectBoard(false)}
              handleReturnHome={() => props.handleCancelBtnClicked()}
            />
          ) : (
            <MoveNfts
              showMoveBoard={showSelectNft}
              handleCloseIconClicked={() => setSelectBoard(false)}
              handleCancelBtnClicked={() => setSelectBoard(false)}
              handleAddBtnClicked={() => setSelectBoard(false)}
              handleReturnHome={() => props.handleCancelBtnClicked()}
            />
          )}
        </>
      )}

      {moveFtOpen && (
        childType === 'evm' ? (
          <MoveFromEvm
            isConfirmationOpen={moveFtOpen}
            data={{ amount: 0 }}
            handleCloseIconClicked={() => closeFullPage()}
            handleCancelBtnClicked={() => setMoveFt(false)}
            handleAddBtnClicked={() => {
              setMoveFt(false);
            }}
          />
        ) : (
          <MoveFromFlow
            isConfirmationOpen={moveFtOpen}
            data={{ amount: 0 }}
            handleCloseIconClicked={() => closeFullPage()}
            handleCancelBtnClicked={() => setMoveFt(false)}
            handleAddBtnClicked={() => {
              setMoveFt(false);
            }}
          />
        )
      )}


    </Drawer>
  );
}


export default MoveBoard;