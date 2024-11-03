import React from 'react';
import { Box, ThemeProvider } from '@mui/system';
import { Typography, Button, CssBaseline, CardMedia } from '@mui/material';
import theme from '../../style/LLTheme';
import RegisterHeader from '../Register/RegisterHeader';
import appicon from '../../FRWAssets/image/appicon.png';
import create from '../../FRWAssets/svg/create.svg';
import importPng from '../../FRWAssets/svg/import.svg';
import recover from '../../FRWAssets/svg/recover.svg';
import reset from '../../FRWAssets/svg/resetarrow.svg';
import { Link } from 'react-router-dom';
import IconFlow from '../../../components/iconfont/IconFlow';

const Forgot = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'info3.default',
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
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px',
              backgroundColor: '#222',
              width: '720px',
              position: 'relative',
              borderRadius: '24px'
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
                marginBottom:'40px',
              }}
            >
              {chrome.i18n.getMessage('Having_trouble')}
            </Typography>



            <Button
              variant="contained"
              component={Link}
              to="/resetpage"
              size="large"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '100%',
                backgroundColor: '#2C2C2C',
                height: '128px',
                borderRadius: '24px',
                textTransform: 'capitalize',
                marginBottom: '16px',
                padding: '24px 32px',
              }}
            >
              <CardMedia component="img" sx={{ marginRight: '16px', width: '48px', height: '48px', color: '#FFFFFFCC' }} image={reset} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', width: '100%', alignItems: 'start' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: '700',
                    fontSize: '18px',
                    color: 'rgba(255, 255, 255, 0.80)',

                  }}
                >
                  {chrome.i18n.getMessage('Reset_my_wallet')}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: '400', fontSize: '16px',
                    color: 'rgba(255, 255, 255, 0.40)',
                  }}
                >
                  {chrome.i18n.getMessage('If_you_have_your_recovery_phrase')}
                </Typography>
              </Box>
            </Button>

            <Button
              variant="contained"
              component={Link}
              to="/recoverpage"
              size="large"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                backgroundColor: '#2C2C2C',
                width: '100%',
                height: '128px',
                borderRadius: '24px',
                textTransform: 'capitalize',
                padding: '24px 32px',
                '&:hover': {
                  color: 'background.paper'
                }
              }}
            >
              <CardMedia component="img" sx={{ marginRight: '16px', width: '48px', height: '48px', color: '#FFFFFFCC' }} image={recover} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', width: '100%', alignItems: 'start' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: '700',
                    fontSize: '18px',
                    color: 'rgba(255, 255, 255, 0.80)',

                  }}
                >
                  {chrome.i18n.getMessage('Retrieve_local_sensitive_data')}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: '400', fontSize: '16px',
                    color: 'rgba(255, 255, 255, 0.40)',
                  }}
                >
                  {chrome.i18n.getMessage('It_seem_like_something_wrong')}
                </Typography>
              </Box>

            </Button>
          </Box>


        </Box>

        <Box sx={{ flexGrow: 1 }} />
      </Box>
    </ThemeProvider>
  );
};

export default Forgot;
