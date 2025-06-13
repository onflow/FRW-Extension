import CloseIcon from '@mui/icons-material/Close';
import { Box, Typography, Drawer, Grid, Button, IconButton, CircularProgress } from '@mui/material';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { type TokenInfo } from '@/shared/types/token-info';
import IconPlus from '@/ui/components/iconfont/IconPlus';
import { useWallet } from 'ui/utils';

interface AddTokenConfirmationProps {
  isConfirmationOpen: boolean;
  data: TokenInfo | null;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}

const AddTokenConfirmation = (props: AddTokenConfirmationProps) => {
  const wallet = useWallet();
  const history = useHistory();
  const [sending, setSending] = useState(false);
  // const [tid, setTid] = useState<string>('');

  const enableStorage = async () => {
    // TODO: Replace it with real data
    if (!props.data) {
      return;
    }
    setSending(true);
    try {
      const txId = await wallet.enableTokenStorage(props.data.symbol);
      if (txId) {
        wallet.listenTransaction(
          txId,
          true,
          `Enable ${props.data.symbol}`,
          `Your ${props.data.symbol} vault has been enabled. You are now able to receive ${props.data.symbol}!\nClick to view this transaction.`,
          props.data.logoURI
        );
        props.handleAddBtnClicked();
        await wallet.setDashIndex(0);
        setSending(false);
        history.push(`/dashboard?activity=1&txId=${txId}`);
      }
    } catch (err) {
      setSending(false);
    }
  };

  const renderContent = () => (
    <Box
      px="18px"
      sx={{
        width: '100%',
        height: '100%',
        background: '#000000',
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
              {chrome.i18n.getMessage('Enable_token')}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={1}>
          <IconButton onClick={props.handleCloseIconClicked}>
            <CloseIcon fontSize="medium" sx={{ color: 'icon.navi', cursor: 'pointer' }} />
          </IconButton>
        </Grid>
      </Grid>

      {props.data && (
        <Box
          sx={{
            display: 'flex',
            mx: '28px',
            my: '28px',
            backgroundColor: '#000000',
            borderRadius: '16px',
            flexDirection: 'column',
            flexGrow: 1,
          }}
        >
          <Box
            sx={{
              borderRadius: '0px 0px 16px 16px',
              backgroundColor: '#000000',
              alignSelf: 'center',
              width: '40%',
            }}
          >
            <Typography variant="h6" sx={{ textAlign: 'center' }}>
              {props.data.name}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <img
            src={props.data.logoURI}
            style={{ width: '114px', height: '114px', alignSelf: 'center' }}
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
            <CircularProgress color="primary" size={20} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
              {chrome.i18n.getMessage('Working_on_it')}
            </Typography>
          </>
        ) : (
          <>
            <IconPlus size={20} color="#FFFFFF" />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
              {chrome.i18n.getMessage('Enable')}
            </Typography>
          </>
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

export default AddTokenConfirmation;
