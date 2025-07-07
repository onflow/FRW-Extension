import { Box, CardMedia, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router';

import packageJson from '@/../package.json';
import discord from '@/ui/assets/image/discord.png';
import lilo from '@/ui/assets/image/lilo.png';
import X from '@/ui/assets/svg/xLogo.svg';
import { LLHeader } from '@/ui/components';
const { version } = packageJson;
const BETA_VERSION = process.env.BETA_VERSION;
// import '../../Unlock/style.css';

const BRANCH_NAME = process.env.BRANCH_NAME;

const COMMIT_SHA = process.env.COMMIT_SHA;

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="page">
      <LLHeader title="" help={true} goBackLink="/dashboard/setting" />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
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

      <Box sx={{ width: '65%', margin: '72px auto 16px auto', alignItems: 'center' }}>
        <Typography
          variant="body1"
          component="div"
          sx={{ margin: '24px auto', textAlign: 'center' }}
        >
          {chrome.i18n.getMessage('CONTACT__US')}
        </Typography>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
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
