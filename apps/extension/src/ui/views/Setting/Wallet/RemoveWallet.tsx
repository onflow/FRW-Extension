import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Typography, Box, IconButton, Skeleton, Button } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';

import { type UserInfoResponse } from '@/shared/types/network-types';
import { withPrefix } from '@/shared/utils/address';
import { LLSecondaryButton } from '@/ui/components';
import { useWallet } from 'ui/utils';
import { openInternalPageInTab } from 'ui/utils/webapi';

import reset from '../../../assets/svg/reset.svg';

const RemoveWallet = ({ hideBackButton = false }) => {
  const navigate = useNavigate();

  const restPass = () => {
    usewallet.resetPwd();
  };

  const usewallet = useWallet();

  const [isLoading, setLoading] = useState(true);
  const [userWallet, setWallet] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [walletName, setWalletName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const [disableEdit, setEdit] = useState(true);

  const wallets = (data) => {
    return (data || []).map((wallet, index) => {
      return {
        id: index,
        name: 'Wallet',
        address: withPrefix(wallet.blockchain[0].address),
        key: index,
      };
    });
  };

  const [walletList, setWalletList] = useState([]);

  const setUserWallet = useCallback(async () => {
    const userInfo = await usewallet.getUserInfo(true);
    const wallet = await usewallet.getMainAccounts();
    await setWallet(wallet);
    await setUserInfo(userInfo);
  }, [usewallet]);

  useEffect(() => {
    setUserWallet();
  }, [setUserWallet]);

  useEffect(() => {
    const list = wallets(userWallet);
    setWalletList(list);
    if (list.length > 0) {
      const currentWallet = list[0];
      const walletName = currentWallet.name;
      const walletAddress = currentWallet.address;
      setWalletName(walletName);
      setWalletAddress(walletAddress);
    }

    setLoading(userWallet === null);
  }, [userWallet]);

  return (
    <div
      className="page"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {!hideBackButton && (
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            width: '100%',
            backgroundColor: '#121212',
            margin: 0,
            padding: 0,
          }}
        >
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: '100%',
              margin: '8px',
            }}
          >
            <ArrowBackIcon sx={{ color: 'icon.navi' }} />
          </IconButton>
        </Box>
      )}

      <Box
        sx={{
          width: '90%',
          margin: '20px auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <img src={reset} alt="reset" width="56px" style={{ margin: '5px auto' }} />
        <Typography variant="h6" component="div" sx={{ margin: '5px auto', textAlign: 'center' }}>
          {chrome.i18n.getMessage('Are__you__sure__you__want__to__reset__your__wallet')}
        </Typography>
        <Box
          sx={{
            width: '100%',
            backgroundColor: '#282828',
            py: '12px',
            borderRadius: '16px',
            padding: 0,
            margin: '10px 0',
          }}
        >
          <div style={{ margin: '11px', padding: '0 60px', alignSelf: 'center' }}>
            {!isLoading && walletName ? (
              <Typography display="inline-block" color="primary" variant="body1">
                {walletName}
              </Typography>
            ) : (
              <Skeleton variant="text" />
            )}
            {!isLoading && walletAddress ? (
              <Typography display="inline-block" color="text.secondary" variant="body2">
                <span> </span>
                {'(' + walletAddress + ')'}{' '}
              </Typography>
            ) : (
              <Skeleton variant="text" />
            )}
          </div>
        </Box>
      </Box>

      <Box
        sx={{
          width: '90%',
          marginBottom: '10px',
          border: '1px solid #4C4C4C',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <Typography color="text.secondary" sx={{ fontSize: '14px' }}>
          {chrome.i18n.getMessage(
            'Removing__the__wallet__from__Lilico__does__not__remove__the__wallet__from__Flow__blockchain'
          )}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1 }} />
      <Box
        sx={{
          width: '90%',
          margin: '20px auto',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: '18px',
        }}
      >
        <LLSecondaryButton
          label={chrome.i18n.getMessage('Cancel')}
          fullWidth
          onClick={() => navigate(-1)}
        />

        <Button
          variant="contained"
          disableElevation
          fullWidth
          color="error"
          onClick={restPass}
          sx={{
            height: '48px',
            borderRadius: '8px',
            textTransform: 'none',
          }}
        >
          <Typography color="primary.contrastText">{chrome.i18n.getMessage('Reset')}</Typography>
        </Button>
      </Box>
    </div>
  );
};

export default RemoveWallet;
