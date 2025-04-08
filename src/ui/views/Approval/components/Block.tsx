import { Stack, Box, Typography, Divider, CardMedia, Link } from '@mui/material';
import { WalletUtils } from '@onflow/fcl';
import React, { useCallback, useEffect, useState } from 'react';

import flowgrey from 'ui/FRWAssets/svg/flow-grey.svg';
import linkGlobe from 'ui/FRWAssets/svg/linkGlobe.svg';
import { LLPrimaryButton, LLSecondaryButton, LLConnectLoading } from 'ui/FRWComponent';
import { useApproval, useWallet } from 'ui/utils';
// import { CHAINS_ENUM } from 'consts';

import CheckCircleIcon from '../../../../components/iconfont/IconCheckmark';

interface ConnectProps {
  host: string;
}

const Block = ({ host }: ConnectProps) => {
  const [, resolveApproval, rejectApproval] = useApproval();

  const handleCancel = useCallback(() => {
    rejectApproval('User rejected the request.');
  }, [rejectApproval]);

  return (
    <Box
      sx={{
        margin: '18px 18px 0px 18px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        height: '100%',
        background: 'linear-gradient(0deg, #121212, #11271D)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          margin: '18px',
          gap: '18px',
          marginTop: '30%',
        }}
      >
        <Typography
          sx={{
            textTransform: 'uppercase',
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
          variant="body1"
          color="error"
        >
          {host} is Blocked
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Typography variant="body2">
            This website is blocked as part of community-maintained list of malicious domains. If
            you believe the website has been blocked in error, please{' '}
            <Link
              href="https://github.com/Outblock/flow-blocklist"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'inline' }}
            >
              file an issue
            </Link>
            .
          </Typography>
        </Stack>
      </Box>
      <Box sx={{ flexGrow: 1 }} />
      <Stack direction="row" spacing={1} sx={{ paddingBottom: '32px' }}>
        <LLSecondaryButton
          label={chrome.i18n.getMessage('Cancel')}
          fullWidth
          onClick={handleCancel}
        />
      </Stack>
    </Box>
  );
};

export default Block;
