import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Drawer, IconButton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import { type NFTModelV2 } from '@/shared/types/network-types';
import { consoleError } from '@/shared/utils/console-log';
import { LLSpinner } from '@/ui/components';
import { useWallet } from '@/ui/hooks/use-wallet';

interface AddNFTConfirmationProps {
  isConfirmationOpen: boolean;
  nftCollection: NFTModelV2 | null;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
}

const AddNFTConfirmation = ({
  isConfirmationOpen,
  nftCollection,
  handleCloseIconClicked,
  handleCancelBtnClicked,
  handleAddBtnClicked,
}: AddNFTConfirmationProps) => {
  const wallet = useWallet();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [, setTid] = useState<string>('');

  const enableStorage = async () => {
    // TODO: Replace it with real data
    if (!nftCollection) {
      return;
    }
    setSending(true);
    try {
      const txId = await wallet.enableNFTStorageLocal(nftCollection);
      if (txId) {
        await wallet.setDashIndex(0);
        wallet.listenTransaction(
          txId,
          true,
          `${nftCollection.name}`,
          `Your ${nftCollection.name} vault has been enabled. You are now able to receive ${nftCollection.name}!\nClick to view this transaction.`,
          nftCollection.logoURI!
        );
        setSending(false);
        setTid(txId);
        navigate(`/dashboard?activity=1&txId=${txId}`);
      }
      handleAddBtnClicked();
    } catch (err) {
      consoleError('err ->', err);
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
        <Grid size={1}></Grid>
        <Grid size={10}>
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
        <Grid size={1}>
          <IconButton onClick={handleCloseIconClicked}>
            <CloseIcon fontSize="medium" sx={{ color: 'icon.navi' }} />
          </IconButton>
        </Grid>
      </Grid>

      {nftCollection && (
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
              {nftCollection.name}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <img
            src={nftCollection.logoURI || ''}
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
      open={isConfirmationOpen}
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
