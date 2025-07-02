import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, Typography, Stack, InputBase } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

import { consoleError } from '@/shared/utils/console-log';
import { useWallet } from 'ui/utils';

import { LLPrimaryButton, LLSpinner } from '../../../components';

const StyledInput = styled(InputBase)(({ theme }) => ({
  zIndex: 1,
  color: theme.palette.text,
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.spacing(2),
  marginTop: '9px',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(2),
    width: '100%',
  },
}));

interface EditAccountProps {
  isAddAddressOpen: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  childAccount?: any;
  address?: string;
  userInfo?: any;
}

export interface AddressBookValues {
  name: string;
  address: string;
}

const EditAccount = ({
  isAddAddressOpen,
  handleCloseIconClicked,
  handleCancelBtnClicked,
  childAccount,
  address,
}: EditAccountProps) => {
  const wallet = useWallet();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  const [name, setName] = useState<string>(childAccount?.name || '');
  const [desc, setDesc] = useState<string>(childAccount?.description || '');

  const onSubmit = async () => {
    setIsLoading(true);
    wallet
      .editChildAccount(address!, name, desc, childAccount.thumbnail.url)
      .then(async (txId) => {
        setIsLoading(false);
        handleCancelBtnClicked();
        wallet.listenTransaction(
          txId,
          true,
          `${address} unlinked`,
          `You have unlinked the child account ${address} from your account. \nClick to view this transaction.`
        );
        await wallet.setDashIndex(0);
        navigate(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((error) => {
        consoleError('EditAccount - failed to edit child account', error);

        setIsLoading(false);
        setFailed(false);
      });
  };

  const renderContent = () => (
    <Box
      px="18px"
      sx={{
        width: '100%',
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
          <Typography variant="h1" align="center" py="14px" fontSize="18px">
            {chrome.i18n.getMessage('Edit_Linked_Account')}
          </Typography>
        </Grid>
        <Grid size={1}>
          <CloseIcon
            fontSize="medium"
            sx={{ color: 'icon.navi', cursor: 'pointer', align: 'center' }}
            onClick={handleCloseIconClicked}
          />
        </Grid>
      </Grid>
      <Box
        sx={{
          overflow: 'hidden',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            color: '#5E5E5E',
          }}
        >
          {chrome.i18n.getMessage('Name')}
        </Typography>
        <StyledInput
          autoComplete="off"
          sx={{ height: '56px' }}
          value={name} // Set the value prop to the "name" state variable
          onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const newValue: string = event.target.value;
            setName(newValue);
          }}
        />
      </Box>
      <Box
        sx={{
          overflow: 'hidden',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            color: '#5E5E5E',
          }}
        >
          {chrome.i18n.getMessage('Description')}
        </Typography>
        <StyledInput
          autoComplete="off"
          sx={{ height: 'auto' }}
          multiline // Set the multiline prop to enable multiple lines
          rows={4} // Set the number of rows to display (you can adjust this value as needed)
          value={desc} // Set the value prop to the "name" state variable
          onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const newValue: string = event.target.value;
            setDesc(newValue);
          }}
        />
      </Box>
      <Box sx={{ flexGrow: 1 }}></Box>
      <Stack direction="row" spacing={1} sx={{ paddingBottom: '32px' }}>
        {isLoading ? (
          <Box
            sx={{
              borderRadius: '12px',
              height: '50px',
              width: '100%',
              fontSize: '18px',
              textTransform: 'none !important',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: '#f2f2f2',
              alignItems: 'center',
            }}
          >
            {failed ? (
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', fontSize: '14px' }}
                color="error"
              >
                {chrome.i18n.getMessage('Submission_error')}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                <LLSpinner size={28} />
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold' }}
                  color="background.paper"
                >
                  {chrome.i18n.getMessage('Working_on_it')}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <LLPrimaryButton label="Confirm" fullWidth type="submit" onClick={onSubmit} />
        )}
      </Stack>
    </Box>
  );

  return (
    <Drawer
      anchor="bottom"
      open={isAddAddressOpen}
      transitionDuration={300}
      PaperProps={{
        sx: {
          width: '100%',
          height: '410px',
          bgcolor: 'background.paper',
          overflow: 'hidden',
          borderRadius: '18px 18px 0px 0px',
        },
      }}
    >
      {renderContent()}
    </Drawer>
  );
};

export default EditAccount;
