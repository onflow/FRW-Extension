import React from 'react';
import { Box, ThemeProvider } from '@mui/system';
import { Button, Typography } from '@mui/material';
import theme from '../../style/LLTheme';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';

const RegisterHeader = () => {
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          px: '32px',
          pt: '40px',
        }}
      >
        {/* <Button
          variant="text"
          sx={{
            color: '#F9F9F9',
            backgroundColor: '#404040',
            px: '16px',
            py: '8px',
            borderRadius: '12px',
            textTransform: 'capitalize',
            ':hover': {
              bgcolor: '#6E6E6E',
            },
          }}
          startIcon={<PhoneAndroidRoundedIcon sx={{ color: '#5e5e5e'}} />}
        >
          Try Our New App
        </Button>*/}

        <div style={{ flexGrow: 1 }}></div>


        <Button
          variant="text"
          sx={{
            color: '#F9F9F9',
            backgroundColor: '#404040',
            px: '16px',
            py: '8px',
            borderRadius: '12px',
            textTransform: 'capitalize',
            ':hover': {
              bgcolor: '#41CC5D',
            },
          }}
          startIcon={<HelpOutlineRoundedIcon sx={{ color: '#5e5e5e'}} />}
        >
          <a href="https://wallet.flow.com/contact" target='_blank'>
            <Typography sx={{color: '#F9F9F9', textTransform: 'capitalize', marginLeft:'5px'}}>{chrome.i18n.getMessage('Need__Help')}</Typography>
          </a>
        </Button> 
      </Box>
    </ThemeProvider>
  );
};

export default RegisterHeader;
