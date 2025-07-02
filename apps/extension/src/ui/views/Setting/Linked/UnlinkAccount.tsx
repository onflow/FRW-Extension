import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, Typography, Stack, InputBase } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { useForm, type FieldValues } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { type WalletAccount } from '@/shared/types/wallet-types';
import { consoleError } from '@/shared/utils/console-log';
import UnlinkSVG from 'ui/assets/svg/unlink.svg';
import { useWallet } from 'ui/utils';

import { LLPrimaryButton, LLSecondaryButton, LLSpinner } from '../../../components';

interface UnlinkAccountProps {
  isAddAddressOpen: boolean;
  handleCloseIconClicked: () => void;
  handleCancelBtnClicked: () => void;
  handleAddBtnClicked: () => void;
  childAccount?: WalletAccount;
  address?: string;
  userInfo?: any;
}

export interface AddressBookValues {
  name: string;
  address: string;
}

const UnlinkAccount = (props: UnlinkAccountProps) => {
  const navigate = useNavigate();

  const wallet = useWallet();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isValid, isDirty, isSubmitting },
  } = useForm({
    mode: 'all',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit = async (data: FieldValues) => {
    setIsLoading(true);
    wallet
      .unlinkChildAccountV2(props.address!)
      .then(async (txId) => {
        setIsLoading(false);
        props.handleCancelBtnClicked();
        wallet.listenTransaction(
          txId,
          true,
          `${props.address} unlinked`,
          `You have unlinked the child account ${props.address} from your account. \nClick to view this transaction.`
        );
        await wallet.setDashIndex(0);
        navigate(`/dashboard?activity=1&txId=${txId}`);
      })
      .catch((err) => {
        setIsLoading(false);
        consoleError('failed to unlink account', err);
      });
  };

  const onCancelBtnClicked = () => {
    props.handleCancelBtnClicked();
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
            {chrome.i18n.getMessage('Unlink_Confirmation')}
          </Typography>
        </Grid>
        <Grid size={1}>
          <CloseIcon
            fontSize="medium"
            sx={{ color: 'icon.navi', cursor: 'pointer', align: 'center' }}
            onClick={props.handleCloseIconClicked}
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', gap: '18px', marginBottom: '0px' }}>
        <Stack
          direction="column"
          spacing="12px"
          sx={{ justifyContent: 'space-between', width: '80%', margin: '0 auto' }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '83px',
                alignItems: 'center',
              }}
            >
              {props.childAccount && (
                <img
                  style={{
                    height: '60px',
                    width: '60px',
                    borderRadius: '30px',
                    backgroundColor: 'text.secondary',
                    objectFit: 'cover',
                  }}
                  src={props?.childAccount.icon}
                />
              )}
              {props.childAccount && (
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: '#5E5E5E',
                    width: '100%',
                    textAlign: 'center',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {props.childAccount.name}
                </Typography>
              )}
            </Box>

            <img src={UnlinkSVG} />

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '83px',
                alignItems: 'center',
              }}
            >
              {props.userInfo && (
                <img
                  style={{
                    height: '60px',
                    width: '60px',
                    borderRadius: '30px',
                    backgroundColor: 'text.secondary',
                    objectFit: 'cover',
                  }}
                  src={props.userInfo.avatar}
                />
              )}
              {props.userInfo && (
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: '#5E5E5E',
                    width: '100%',
                    textAlign: 'center',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {props.userInfo?.nickname}
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>
      </Box>
      <Box
        sx={{
          overflow: 'hidden',
          marginTop: '24px',
          marginBottom: '40px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          padding: '16px 20px',
          justifyContent: 'space-between',
          backgroundColor: '#292929',
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            textTransform: 'uppercase',
            color: '#5E5E5E',
          }}
        >
          {chrome.i18n.getMessage('Things_you_should_know')}
        </Typography>
        <Typography sx={{ fontSize: '14px' }} color="text.secondary">
          {chrome.i18n.getMessage('Unlink_Message')}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1 }}></Box>
      <Stack direction="row" spacing={1} sx={{ paddingBottom: '32px' }}>
        <LLSecondaryButton
          label={chrome.i18n.getMessage('Cancel')}
          fullWidth
          onClick={onCancelBtnClicked}
        />
        <LLPrimaryButton
          label={isLoading ? <LLSpinner size={28} /> : 'Confirm'}
          fullWidth
          type="submit"
          onClick={onSubmit}
        />
      </Stack>
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

export default UnlinkAccount;
