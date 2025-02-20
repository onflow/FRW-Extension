import CloseIcon from '@mui/icons-material/Close';
import { Box, Typography, Drawer, Grid, Button, IconButton } from '@mui/material';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { type NFTModel } from '@/shared/types/network-types';
import { LLSpinner } from 'ui/FRWComponent';
import { useWallet } from 'ui/utils';

interface AddNFTConfirmationProps {
  isConfirmationOpen: boolean;
  data: NFTModel | null;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}

const AddNFTConfirmation = (props: AddNFTConfirmationProps) => {
  const wallet = useWallet();
  const history = useHistory();
  const [sending, setSending] = useState(false);
  const [, setTid] = useState<string>('');

  const enableStorage = async () => {
    // TODO: Replace it with real data
    if (!props.data) {
      return;
    }
    setSending(true);
    try {
      const txId = await wallet.enableNFTStorageLocal(props.data);
      if (txId) {
        await wallet.setDashIndex(0);
        wallet.listenTransaction(
          txId,
          true,
          `${props.data.name}`,
          `Your ${props.data.name} vault has been enabled. You are now able to receive ${props.data.name}!\nClick to view this transaction.`,
          props.data.logo!
        );
        setSending(false);
        setTid(txId);
        history.push(`/dashboard?activity=1&txId=${txId}`);
      }
      props.handleAddBtnClicked();
    } catch (err) {
      console.error('err ->', err);
      setSending(false);
    }
  };

  const renderContent = () => (
    <Box
      px="18px"
      sx={{
        // width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.5)',
        flexDirection: 'column',
        display: 'flex',
      }}
    >
      <Grid
        container
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Grid item xs={1}></Grid>
        <Grid item xs={10}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h1" align="center" py="14px" fontSize="20px">
              {chrome.i18n.getMessage('Enable__NFT__Collection')}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={1}>
          <IconButton onClick={props.handleCloseIconClicked}>
            <CloseIcon fontSize="medium" sx={{ color: 'icon.navi' }} />
          </IconButton>
        </Grid>
      </Grid>

      {props.data && (
        <Box
          sx={{
            display: 'flex',
            mx: '28px',
            my: '28px',
            backgroundColor: '#333333',
            borderRadius: '16px',
            flexDirection: 'column',
            flexGrow: 1,
          }}
        >
          <Box
            sx={{
              borderRadius: '0px 0px 16px 16px',
              backgroundColor: '#121212',
              alignSelf: 'center',
              width: '60%',
            }}
          >
            <Typography variant="h6" sx={{ textAlign: 'center' }}>
              {props.data.name}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <img
            src={props.data.logo || ''}
            style={{ height: '114px', alignSelf: 'center', borderRadius: '8px' }}
          />
          <Box sx={{ flexGrow: 1 }} />
        </Box>
      )}

      <Button
        onClick={enableStorage}
        disabled={sending}
        variant="contained"
        color="primary"
        size="large"
        sx={{
          height: '50px',
          width: '100%',
          borderRadius: '12px',
          textTransform: 'capitalize',
          display: 'flex',
          gap: '12px',
          marginBottom: '33px',
        }}
      >
        {sending ? (
          <>
            <LLSpinner size={28} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
              {chrome.i18n.getMessage('Working_on_it')}
            </Typography>
          </>
        ) : (
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
            {chrome.i18n.getMessage('Enable')}
          </Typography>
        )}
      </Button>
    </Box>
  );

  return (
    <Drawer
      anchor="bottom"
      open={props.isConfirmationOpen}
      transitionDuration={300}
      PaperProps={{
        sx: {
          width: '100%',
          height: '70%',
          bgcolor: 'background.paper',
          borderRadius: '18px 18px 0px 0px',
        },
      }}
    >
      {renderContent()}
    </Drawer>
  );
};

export default AddNFTConfirmation;
