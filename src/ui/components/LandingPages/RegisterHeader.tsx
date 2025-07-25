import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import { Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/system';
import React from 'react';

interface RegisterHeaderProps {
  showAppButton?: boolean;
}

const RegisterHeader = ({ showAppButton = false }: RegisterHeaderProps) => {
  const theme = useTheme();
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: '32px',
          pt: '40px',
          bgcolor: theme.palette.success.main,
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          size="large"
          sx={{
            display: 'flex',
            width: '332px',
            height: '48px',
            borderRadius: '24px',
            alignItems: 'center',
            justifyContent: 'flex-start',
            textTransform: 'capitalize',
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.darkGray.main,
            marginBottom: '16px',
            paddingLeft: '32px',
          }}
          startIcon={<PhoneAndroidRoundedIcon sx={{ color: theme.palette.darkGray.main }} />}
        >
          <Typography
            sx={{
              color: theme.palette.text.primary,
              textTransform: 'capitalize',
              marginLeft: '5px',
            }}
          >
            {chrome.i18n.getMessage('Download_Mobile_App')}
          </Typography>
        </Button>

        <Button
          variant="contained"
          color="secondary"
          size="large"
          sx={{
            display: 'flex',
            width: '332px',
            height: '48px',
            borderRadius: '24px',
            alignItems: 'center',
            justifyContent: 'flex-start',
            textTransform: 'capitalize',
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.darkGray.main,
            bgcolor: theme.palette.darkGray.main,
          }}
          startIcon={<HelpOutlineRoundedIcon sx={{ color: theme.palette.darkGray.main }} />}
        >
          <Typography
            sx={{
              color: theme.palette.text.primary,
              textTransform: 'capitalize',
              marginLeft: '5px',
            }}
          >
            {chrome.i18n.getMessage('Get_Help')}
          </Typography>
        </Button>
      </Box>
    </>
  );
};

export default RegisterHeader;
