import { Box, Button, CardMedia, Stack, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router';

import NotFoundIcon from '@/ui/assets/svg/notfound.svg';

export const LLNotFound = ({ setShowDialog }) => {
  const navigate = useNavigate();

  return (
    <>
      <Box className="registerBox ">
        <CardMedia
          sx={{ margin: '0 auto', width: '172px', height: '120px', display: 'block' }}
          image={NotFoundIcon}
        />
        <Typography variant="h4">
          <Box display="inline-block" color="primary.main">
            {chrome.i18n.getMessage('Sorry')}
          </Box>{' '}
          {chrome.i18n.getMessage('we_couldnt_find_any_address_linked_to_your_recovery_phrase')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Please_try_your_recovery_phrase_again_or_create_a_new_account')}
          <Box display="inline" color="primary.main">
            {' '}
            {chrome.i18n.getMessage('with_current_recovery_phrase')}
          </Box>
          .
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: '24px' }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setShowDialog(false)}
            disableElevation
            fullWidth
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: '600',
              height: '56px',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: '600' }} color="background.paper">
              {chrome.i18n.getMessage('Try__again')}
            </Typography>
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/welcome')}
            disableElevation
            fullWidth
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: '600',
              height: '56px',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: '600' }} color="primary.contrastText">
              {chrome.i18n.getMessage('Create_a_new_wallet')}
            </Typography>
          </Button>
        </Stack>
      </Box>
    </>
  );
};
