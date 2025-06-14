import { Typography, Box, CardMedia } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React from 'react';
import { useHistory } from 'react-router-dom';

import packageJson from '@/../package.json';
import { LLHeader } from '@/ui/components';
import discord from 'ui/assets/image/discord.png';
import lilo from 'ui/assets/image/lilo.png';
import X from 'ui/assets/svg/xLogo.svg';
const { version } = packageJson;
const BETA_VERSION = process.env.BETA_VERSION;
// import '../../Unlock/style.css';

const useStyles = makeStyles(() => ({
  arrowback: {
    borderRadius: '100%',
    margin: '8px',
  },
  iconbox: {
    position: 'sticky',
    top: 0,
    width: '100%',
    minWidth: '100%',
    // backgroundColor: '#121212',
    margin: 0,
    padding: 0,
    justifyContent: 'space-between',
  },
  aboutTitle: {
    zIndex: 20,
    textAlign: 'center',
    top: 0,
    position: 'sticky',
  },
  list: {
    width: '90%',
    margin: '80px auto',
    padding: 0,
  },
  listItem: {
    width: '100%',
    padding: '24px 0',
  },
  itemButton: {
    margin: 0,
  },
  logoBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    alignItems: 'center',
  },
  mediaBox: {
    width: '65%',
    margin: '72px auto 16px auto',
    alignItems: 'center',
  },
  logo: {
    width: '84px',
    height: '84px',
    margin: '0 auto',
  },
  iconsBox: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}));

const BRANCH_NAME = process.env.BRANCH_NAME;

const COMMIT_SHA = process.env.COMMIT_SHA;

const About = () => {
  const classes = useStyles();

  const history = useHistory();

  return (
    <div className="page">
      <LLHeader title="" help={true} />

      <Box className={classes.logoBox}>
        {/* <img src={logo} alt='logo' className={classes.logo} /> */}

        <a href="https://wallet.flow.com" target="_blank">
          <Box
            className="logoContainer"
            style={{ height: '120px', width: '120px', marginTop: '12px' }}
          >
            <img src={lilo} style={{ height: '80px', width: '80px' }} />
          </Box>
        </a>

        <a href="https://wallet.flow.com" target="_blank">
          <Typography
            variant="h6"
            component="div"
            sx={{ textAlign: 'center', fontWeight: 600, mt: '5px' }}
          >
            Flow Wallet
          </Typography>
        </a>
        <Typography
          variant="body1"
          component="div"
          color="text.secondary"
          sx={{ textAlign: 'center', fontWeight: 300 }}
        >
          {chrome.i18n.getMessage('Version')} {`${version}`}
          {BETA_VERSION && ` (${BETA_VERSION})`}
        </Typography>

        {process.env.DEPLOYMENT_ENV !== 'production' && (
          <Typography
            variant="body1"
            component="div"
            color="text.secondary"
            sx={{ textAlign: 'center', fontWeight: 300 }}
          >
            {`${
              process.env.DEPLOYMENT_ENV === 'staging'
                ? 'staging'
                : BRANCH_NAME
                  ? BRANCH_NAME
                  : 'local'
            } ${COMMIT_SHA ? `\nCommit: ${COMMIT_SHA}` : ''}`}
          </Typography>
        )}

        {process.env.NODE_ENV !== 'production' && (
          <Typography
            variant="body1"
            component="div"
            color="text.secondary"
            sx={{ textAlign: 'center', fontWeight: 300 }}
          >
            (Debug)
          </Typography>
        )}
      </Box>

      <Box className={classes.mediaBox}>
        <Typography
          variant="body1"
          component="div"
          sx={{ margin: '24px auto', textAlign: 'center' }}
        >
          {chrome.i18n.getMessage('CONTACT__US')}
        </Typography>
        <Box
          className={classes.iconsBox}
          sx={{ width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center' }}
        >
          <a href="https://discord.com/invite/J6fFnh2xx6" target="_blank" style={{ width: '58px' }}>
            <Box
              sx={{
                alignSelf: 'center',
                display: 'flex !important',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <img src={discord} width="32px" height="32px" style={{ margin: '8px auto' }} />
              <Typography color="text" sx={{ textTransform: 'none' }} align="center">
                Discord
              </Typography>
            </Box>
          </a>
          {/* <Divider orientation="vertical" flexItem variant="middle" /> */}
          <a href="https://twitter.com/FlowCoreWallet" target="_blank" style={{ width: '58px' }}>
            <Box
              sx={{
                alignSelf: 'center',
                display: 'flex !important',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <CardMedia
                component="img"
                sx={{ margin: '8px auto', width: '32px', height: '32px' }}
                image={X}
              />
              <Typography color="text" sx={{ textTransform: 'none' }} align="center">
                X
              </Typography>
            </Box>
          </a>
        </Box>

        <Box
          sx={{ display: 'flex', gap: '4px', justifyContent: 'center', margin: '30px auto 0 auto' }}
        >
          <a href="https://lilico.app/about/privacy-policy" target="_blank">
            <Typography variant="overline" color="text.secondary">
              {chrome.i18n.getMessage('Privacy__Policy')}
            </Typography>
          </a>{' '}
          <a href="https://lilico.app/about/terms" target="_blank">
            <Typography variant="overline" color="text.secondary">
              {chrome.i18n.getMessage('Terms__of__Service')}
            </Typography>
          </a>
        </Box>

        <Typography
          style={{ lineHeight: 1.2 }}
          component="div"
          sx={{ textAlign: 'center' }}
          variant="overline"
          color="text.secondary"
        >
          {chrome.i18n.getMessage('Made__by')}
          <a href="https://flow.com" target="_blank">
            Flow Foundation
          </a>
          {chrome.i18n.getMessage('outblock__made')}
        </Typography>
      </Box>
    </div>
  );
};

export default About;
