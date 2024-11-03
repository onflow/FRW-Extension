import React from 'react';
import { Grid, IconButton, Typography, Tooltip} from '@mui/material';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from '@mui/material/styles';
import { useHistory } from 'react-router-dom';


interface LLHeaderProps {
    title: string | JSX.Element;
    help: boolean | JSX.Element;
  }

export const LLHeader = (props: LLHeaderProps) => {
//   const { label, ...inherentProps } = props;
  const history = useHistory();

  return (
    <Grid
      container
      sx={{
        justifyContent: 'start',
        alignItems: 'center',
        px: '8px',
      }}
    >
      <Grid item xs={1}>
        <IconButton onClick={history.goBack}>
          <ArrowBackIcon sx={{ color: 'icon.navi' }} />
        </IconButton>
      </Grid>
      <Grid item xs={10}>
        <Typography
          variant="h1"
          align="center"
          py="14px"
          fontWeight="bold"
          fontSize="20px"
        >
          {props.title}
        </Typography>
      </Grid>
      {/* <Grid item xs={1}> */}
      {/* </Grid> */}
      {props.help && <Grid item xs={1} sx={{pl: 0}}>
        <a href="https://wallet.flow.com/contact" target='_blank'>
          <IconButton>
            <Tooltip title={chrome.i18n.getMessage('Need__Help')} arrow>
              {/* <a href="https://wallet.flow.com/contact" target='_blank'> */}
              <HelpOutlineRoundedIcon  sx={{ color: 'icon.navi' }} />
              {/* </a> */}
            </Tooltip>
          </IconButton> 
        </a>
      </Grid>}
    </Grid>
  );
};
