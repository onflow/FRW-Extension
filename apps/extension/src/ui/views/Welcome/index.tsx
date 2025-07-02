import { Typography, Button, CardMedia } from '@mui/material';
import { Box } from '@mui/system';
import React from 'react';
import { Link, useLocation } from 'react-router';

import appicon from '@/ui/assets/image/appicon.png';
import create from '@/ui/assets/svg/create.svg';
import importPng from '@/ui/assets/svg/import.svg';
import qr from '@/ui/assets/svg/scanIcon.svg';
import RegisterHeader from '@/ui/components/LandingPages/RegisterHeader';

const Welcome = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <RegisterHeader />

      <Box sx={{ flexGrow: 1 }} />

      <Box
        className="welcomeBox"
        sx={{
          height: '460px',
          backgroundColor: 'transparent',
          marginBottom: '80px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            px: '60px',
            backgroundColor: '#222',
            height: '380px',
            width: '625px',
            position: 'relative',
            borderRadius: '24px',
          }}
        >
          <img
            src={appicon}
            style={{
              borderRadius: '24px',
              margin: '0',
              width: '368px',
              position: 'absolute',
              right: '0px',
              top: '0px',
            }}
          />

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '20px',
              position: 'absolute',
              left: '-95px',
              top: '18px',
              width: '389px',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: '700',
                fontSize: '40px',
                WebkitBackgroundClip: 'text',
                color: '#fff',
                lineHeight: '56px',
              }}
            >
              {chrome.i18n.getMessage('Welcome_to_lilico')}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                pt: '16px',
                fontSize: '16px',
                margin: '24px 0 44px',
              }}
            >
              {chrome.i18n.getMessage('A_crypto_wallet_on_Flow')}{' '}
              <Box component="span" sx={{ color: 'primary.light' }}>
                {chrome.i18n.getMessage('Explorers_Collectors_and_Gamers')}
              </Box>
            </Typography>

            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/welcome/register"
              size="large"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '332px',
                height: '48px',
                borderRadius: '24px',
                textTransform: 'capitalize',
                marginBottom: '16px',
                paddingLeft: '32px',
              }}
            >
              <CardMedia
                component="img"
                sx={{ marginRight: '8px', width: '18px', height: '18px' }}
                image={create}
              />
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: '600', fontSize: '14px' }}
                color="primary.contrastText"
              >
                {chrome.i18n.getMessage('Create_a_new_wallet')}
              </Typography>
            </Button>

            <Button
              variant="contained"
              color="secondary"
              component={Link}
              to="/welcome/sync"
              size="large"
              sx={{
                display: 'flex',
                width: '332px',
                height: '48px',
                borderRadius: '24px',
                alignItems: 'center',
                justifyContent: 'flex-start',
                textTransform: 'capitalize',
                border: '1px solid #E5E5E5',
                marginBottom: '16px',
                backgroundColor: 'transparent',
                paddingLeft: '32px',
              }}
            >
              <CardMedia
                component="img"
                sx={{ marginRight: '8px', width: '18px', height: '18px' }}
                image={qr}
              />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#FFF',
                  '&:hover': {
                    color: 'background.paper',
                  },
                }}
              >
                {chrome.i18n.getMessage('Sync_with_Mobile_App')}
              </Typography>
            </Button>

            <Button
              variant="contained"
              color="secondary"
              component={Link}
              to="/welcome/accountimport"
              size="large"
              sx={{
                display: 'flex',
                width: '332px',
                height: '69px',
                borderRadius: '120px',
                alignItems: 'center',
                justifyContent: 'center',
                textTransform: 'capitalize',
                border: '1px solid #E5E5E5',
                backgroundColor: 'transparent',
                flexDirection: 'column',
                paddingLeft: '32px',
                '&:hover': {
                  color: 'background.paper',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <CardMedia
                  component="img"
                  sx={{ marginRight: '8px', width: '18px', height: '18px' }}
                  image={importPng}
                />
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#FFF',
                  }}
                >
                  {chrome.i18n.getMessage('Import__Wallet')}
                </Typography>
              </Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: '400',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.40)',
                }}
              >
                {chrome.i18n.getMessage('Support_Flow_Wallet_Blocto')}
              </Typography>
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />
    </Box>
  );
};

export default Welcome;
