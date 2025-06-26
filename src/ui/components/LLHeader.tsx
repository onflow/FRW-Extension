import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import { IconButton, Typography, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid';
import React from 'react';
import { useHistory, Link } from 'react-router-dom';

interface LLHeaderProps {
  title: string | JSX.Element;
  help: boolean | JSX.Element;
  goBackLink?: string; // Optional link
}

export const LLHeader = (props: LLHeaderProps) => {
  //   const { label, ...inherentProps } = props;
  const history = useHistory();

  const handleGoBack = () => {
    if (props.goBackLink) {
      // Use custom link if provided
      history.push(props.goBackLink);
    } else {
      // Fall back to browser history
      history.goBack();
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
      {/* <Grid2 size={1}> */}
      {/* </Grid2> */}
      {props.help && (
        <Grid size={1} sx={{ pl: 0 }}>
          <a href="https://wallet.flow.com/contact" target="_blank">
            <IconButton>
              <Tooltip title={chrome.i18n.getMessage('Need__Help')} arrow>
                {/* <a href="https://wallet.flow.com/contact" target='_blank'> */}
                <HelpOutlineRoundedIcon sx={{ color: 'icon.navi' }} />
                {/* </a> */}
              </Tooltip>
            </IconButton>
          </a>
        </Grid>
      )}
    </Grid>
  );
};
