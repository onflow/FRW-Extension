import { Box, ButtonBase, Typography } from '@mui/material';
import React from 'react';

import flowGrey from '@/ui/assets/svg/flow-grey.svg';

const StackingCard = () => {
  const openFlowPort = async () => {
    await chrome.tabs.create({
      url: 'https://port.flow.com',
    });
  };

  return (
    <ButtonBase onClick={openFlowPort}>
      <Box
        sx={{
          width: '100%',
          backgroundColor: 'background.default',
          display: 'flex',
          px: '18px',
          py: '12px',
          borderRadius: '12px',
          justifyContent: 'flex-satrt',
          alignItems: 'center',
          '&:hover': {
            backgroundColor: 'neutral.main',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '2px', flexDirection: 'column' }}>
          <Typography variant="body1" sx={{ fontSize: '16px', fontWeight: '600' }}>
            {chrome.i18n.getMessage('Earn_More_Flow')}
          </Typography>
          <Typography
            variant="body1"
            color="neutral2.main"
            sx={{ fontWeight: 'medium', fontSize: '14px' }}
          >
            {chrome.i18n.getMessage('Stake_tokens_and_earn_rewards')}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <img
          src={flowGrey}
          style={{ width: '60px', height: '60px', borderRadius: '30px', padding: '5px' }}
        />
      </Box>
    </ButtonBase>
  );
};

export default StackingCard;
