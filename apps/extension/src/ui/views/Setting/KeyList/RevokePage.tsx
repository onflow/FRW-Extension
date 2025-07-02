import { Typography, Box, Drawer, Stack, InputBase, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { consoleError } from '@/shared/utils/console-log';
import { useWallet } from 'ui/utils';

import closeCircle from '../../../assets/image/closeCircle.png';
import warning from '../../../assets/image/warning.png';
import { LLPrimaryButton } from '../../../components';

const StyledInput = styled(InputBase)(({ theme }) => ({
  zIndex: 1,
  color: (theme.palette as any).text,
  backgroundColor: (theme.palette as any).background.default,
  borderRadius: theme.spacing(2),
  marginTop: theme.spacing(2),
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(2),
    width: '100%',
  },
}));

interface RevokePageProps {
  isAddAddressOpen: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  keyIndex: string;
}

const RevokePage = (props: RevokePageProps) => {
  const wallet = useWallet();

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isValid, isDirty, isSubmitting },
  } = useForm({
    mode: 'all',
  });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    setIsLoading(true);
    wallet
      .revokeKey(props.keyIndex)
      .then(async (txId) => {
        wallet.listenTransaction(
          txId,
          true,
          'Revoke request submit',
          'You have submitted an revoke request for key index 2. \nClick to view this transaction.'
        );
        props.handleCloseIconClicked();
        await wallet.setDashIndex(0);
        setIsLoading(false);
        navigate(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((err) => {
        consoleError(err);
        setIsLoading(false);
        // setFailed(true);
      });
  };

  const onCancelBtnClicked = () => {
    props.handleCancelBtnClicked();
  };

  const renderContent = () => (
    <Box
      px="18px"
      sx={{
        width: 'auto',
        height: '415px',
        background: 'rgba(0, 0, 0, 0.5)',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <img src={warning} style={{ width: '48px', height: '48px', marginTop: '36px' }} />
      <Typography
        sx={{
          margin: '16px auto 0',
          fontSize: '24px',
          fontWeight: 700,
          color: '#FFFFFF',
          width: '267px',
        }}
      >
        Are you sure you want to revoke this key?
      </Typography>
      <Typography
        color="error.main"
        sx={{ margin: '16px auto 60px', fontSize: '14px', fontWeight: 400, width: '250px' }}
      >
        Once you revoke this key, there is no way to re-activate this key.
      </Typography>
      <Box>
        <LLPrimaryButton
          label={
            isLoading ? (
              <CircularProgress color="error" size={22} style={{ fontSize: '22px', margin: '0' }} />
            ) : (
              'Revoke'
            )
          }
          fullWidth
          onMouseDown={() => onSubmit()}
          sx={{
            margin: '8px 0',
            padding: '8px 0',
            backgroundColor: 'error.main',
            color: '#fff',
            borderRadius: '16px',
            textTransform: 'none',
          }}
        />
        <LLPrimaryButton
          label={'Maybe Later'}
          onClick={onCancelBtnClicked}
          sx={{ backgroundColor: 'rgba(0,0,0,0)', color: '#fff', textTransform: 'none' }}
        />
      </Box>
    </Box>
  );

  return (
    <Drawer
      anchor="bottom"
      open={props.isAddAddressOpen}
      transitionDuration={300}
      PaperProps={{
        sx: {
          width: '100%',
          height: '415px',
          borderRadius: '18px 18px 0px 0px',
        },
      }}
    >
      {renderContent()}
    </Drawer>
  );
};

export default RevokePage;
