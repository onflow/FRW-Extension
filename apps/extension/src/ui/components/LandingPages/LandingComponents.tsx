import { Box, IconButton, Typography } from '@mui/material';
import React from 'react';

import { LLPinAlert } from '@/ui/components';
import Confetti from '@/ui/components/Confetti';
import BackButtonIcon from '@/ui/components/iconfont/IconBackButton';
import RegisterHeader from '@/ui/components/LandingPages/RegisterHeader';
import SlideLeftRight from '@/ui/components/SlideLeftRight';

const LandingComponents = ({
  activeIndex,
  direction,
  showBackButton,
  onBack,
  children,
  showConfetti,
  showRegisterHeader,
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'background.default',
      width: '100%',
      height: '100vh',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    {showConfetti && <Confetti />}
    {showRegisterHeader && <RegisterHeader />}
    <LLPinAlert open={showConfetti} />

    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: 744,
        marginTop: '80px',
        height: 'auto',
        transition: 'all .3s ease-in-out',
        borderRadius: '24px',
        boxShadow: '0px 24px 24px rgba(0,0,0,0.36)',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          padding: '24px 24px 0px 24px',
        }}
      >
        {showBackButton && (
          <IconButton onClick={onBack} size="small">
            <BackButtonIcon color="#5E5E5E" size={27} />
          </IconButton>
        )}

        <div style={{ flexGrow: 1 }}></div>

        <Typography
          variant="body1"
          sx={{
            color: '#5E5E5E',
            alignSelf: 'end',
            lineHeight: '37px',
            fontWeight: '700',
            fontSize: '16px',
          }}
        >
          {chrome.i18n.getMessage('STEP')} {activeIndex + 1}/6
        </Typography>
      </Box>

      <SlideLeftRight direction={direction === 'left' ? 'left' : 'right'} show={true}>
        {children}
      </SlideLeftRight>
    </Box>

    <Box sx={{ flexGrow: 1 }} />
  </Box>
);

export default LandingComponents;
