import React, { useState, useEffect } from 'react';
import { Box, Button, ListItemButton, Typography, Drawer, IconButton, ListItem, ListItemIcon, ListItemText, Avatar, CardMedia } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useWallet } from 'ui/utils';
import { useHistory } from 'react-router-dom';
import popLock from 'ui/FRWAssets/svg/popLock.svg';
import homeMoveFt from 'ui/FRWAssets/svg/homeMoveFt.svg';
import moveSvg from 'ui/FRWAssets/svg/moveSvg.svg';
import MoveNfts from './MoveNfts';
import MoveEvm from './MoveEvm';




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
  const [childType, setChildType] = useState<string>('');

  // console.log('props.loggedInAccounts', props.current)

  const requestChildType = async () => {
    const result = await usewallet.getActiveWallet();
    setChildType(result);
  };

  useEffect(() => {
    requestChildType();
  }, [])

  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1500 !important' }}
      transitionDuration={300}
      open={props.showMoveBoard}
      PaperProps={{
        sx: { width: '100%', height: 'auto', background: '#222', borderRadius: '18px 18px 0px 0px', },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', px: '16px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '24px', margin: '20px 0', alignItems: 'center', }}>
          <Box sx={{ width: '40px' }}></Box>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color='text'
            sx={{ fontSize: '18px', textAlign: 'center', lineHeight: '24px', fontWeight: '700' }}
          >
            Move Assets
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
            sx={{ fontSize: '12px', textAlign: 'center', lineHeight: '24px', padding:'0 50px',fontWeight: '400', opacity: '0.8' }}
          >
            {`Would you like to move your assets to ${childType === 'evm' ? 'FLOW' : 'EVM'} account?`}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ display: 'flex', padding: '0 24px',mb: '24px', mt: '24px', justifyContent: 'space-between' }}>
        <Box>
          <Button onClick={() => {
            setSelectBoard(true);
          }}
          >
            <CardMedia component="img" sx={{ width: '148px', height: '180px', display: 'inline', borderRadius: '8px', paddingRight: '8px' }} image={moveSvg} />
          </Button>
        </Box>
        <Box>
          <Button>
            <CardMedia component="img" sx={{ width: '148px', height: '180px', display: 'inline', borderRadius: '8px', paddingRight: '8px' }} image={homeMoveFt} />
          </Button>
        </Box>
      </Box>
      <Button onClick={props.handleCancelBtnClicked}>
        <Typography
          variant="body1"
          component="div"
          display="inline"
          color='text'
          sx={{ fontSize: '14px', textAlign: 'center', lineHeight: '24px', marginBottom: '32px', fontWeight: '600', opacity: '0.8' }}
        >
          Maybe Later
        </Typography>
      </Button>
      {showSelectNft && (
        <>
          {childType === 'evm' ? (
            <MoveEvm
              showMoveBoard={showSelectNft}
              handleCloseIconClicked={() => setSelectBoard(false)}
              handleCancelBtnClicked={() => setSelectBoard(false)}
              handleAddBtnClicked={() => setSelectBoard(false)}
            />
          ) : (
            <MoveNfts
              showMoveBoard={showSelectNft}
              handleCloseIconClicked={() => setSelectBoard(false)}
              handleCancelBtnClicked={() => setSelectBoard(false)}
              handleAddBtnClicked={() => setSelectBoard(false)}
            />
          )}
        </>
      )}


    </Drawer>
  );
}


export default MoveBoard;