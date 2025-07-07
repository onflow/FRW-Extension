import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import { IconButton, Typography, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid';
import React from 'react';
import { useNavigate } from 'react-router';

interface LLHeaderProps {
  title: string | JSX.Element;
  help: boolean | JSX.Element;
  goBackLink?: string; // Optional link
  right?: React.ReactNode;
}

export const LLHeader = (props: LLHeaderProps) => {
  //   const { label, ...inherentProps } = props;
  const navigate = useNavigate();
  const handleGoBack = () => {
    if (props.goBackLink) {
      navigate(props.goBackLink);
    } else {
      // Fall back to browser history
      navigate(-1);
    }
  };

  return (
    <Grid
      container
      sx={{
        justifyContent: 'start',
        alignItems: 'center',
        px: '8px',
      }}
    >
      <Grid size={1}>
        <IconButton onClick={handleGoBack}>
          <ArrowBackIcon sx={{ color: 'icon.navi' }} />
        </IconButton>
      </Grid>
      <Grid size={10}>
        <Typography variant="h1" align="center" py="14px" fontWeight="bold" fontSize="16px">
          {props.title}
        </Typography>
      </Grid>
      {props.right ? (
        <Grid size={1} sx={{ pl: 0, display: 'flex', justifyContent: 'flex-end' }}>
          {props.right}
        </Grid>
      ) : (
        props.help && (
          <Grid size={1} sx={{ pl: 0 }}>
            <a href="https://wallet.flow.com/contact" target="_blank">
              <IconButton>
                <Tooltip title={chrome.i18n.getMessage('Need__Help')} arrow>
                  <HelpOutlineRoundedIcon sx={{ color: 'icon.navi' }} />
                </Tooltip>
              </IconButton>
            </a>
          </Grid>
        )
      )}
    </Grid>
  );
};
