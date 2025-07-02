import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Typography, IconButton, Box, Link, CardMedia } from '@mui/material';
import BN from 'bignumber.js';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';

import { consoleError } from '@/shared/utils/console-log';
import { EnableEvm } from '@/ui/components/EnableEvm';
import { LLPrimaryButton, LLSpinner } from 'ui/components';
import { useWallet } from 'ui/utils';

const Enable = () => {
  const expiry_time = 60000;
  const navigate = useNavigate();
  const wallet = useWallet();
  const [claiming, setClaiming] = useState(false);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState('');

  const handleClaiming = async () => {
    setClaiming(true);
    wallet
      .createCoaEmpty()
      .then(async (txId) => {
        wallet.listenTransaction(
          txId,
          true,
          'Create EVM complete',
          `Your EVM on Flow address has been created. \nClick to view this transaction.`
        );
        await wallet.setDashIndex(0);
        navigate(`/dashboard?activity=1&txId=${txId}`);

        setClaiming(false);
      })
      .catch((err) => {
        consoleError(err);
        setClaiming(false);
      });
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#121212',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          padding: '20px 0 0',
          marginLeft: '18px',
          justifyContent: 'space-between',
        }}
      >
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon
            sx={{
              color: 'icon.navi',
            }}
          />
        </IconButton>
      </Box>
      <EnableEvm />

      <Box sx={{ padding: '18px' }}>
        {claiming ? (
          <Box
            sx={{
              borderRadius: '12px',
              height: '50px',
              width: '100%',
              fontSize: '18px',
              textTransform: 'none !important',
              display: 'flex',
              justifyContent: 'center',
              backgroundColor: '#FFFFFFCC',
              alignItems: 'center',
            }}
          >
            {failed ? (
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold', fontSize: '14px' }}
                color="error"
              >
                {chrome.i18n.getMessage('Submission_error') + error}
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
          <LLPrimaryButton
            label={chrome.i18n.getMessage('Enable')}
            onClick={handleClaiming}
            sx={{
              borderRadius: '14px',
              height: '50px',
              width: '100%',
              fontSize: '18px',
              fontWeight: '700',
              textTransform: 'none !important',
            }}
          />
        )}
      </Box>
      <Box
        sx={{
          borderRadius: '12px',
          fontSize: '18px',
          textTransform: 'none !important',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: '48px',
        }}
      >
        <Link
          href="https://flow.com/upgrade/crescendo/evm"
          target="_blank"
          underline="none"
          sx={{ textDecoration: 'none' }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 'normal', fontSize: '14px', color: 'rgba(255, 255, 255, 0.80)' }}
          >
            {chrome.i18n.getMessage('Learn__more')}
          </Typography>
        </Link>
      </Box>
    </Box>
  );
};

export default Enable;
