import React, { useState } from 'react';
import { Box, ThemeProvider } from '@mui/system';
import { Button, Typography, IconButton, CssBaseline } from '@mui/material';
import theme from '../../../style/LLTheme';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import IconCopy from '../../../../components/iconfont/IconCopy';
import { Presets } from 'react-component-transition';
import InfoIcon from '@mui/icons-material/Info';

const RecoveryPhrase = ({ handleClick, mnemonic }) => {
  const [canGoNext, setCanGoNext] = useState(false);
  const [isCoverBlur, coverBlur] = useState(true);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="registerBox"
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }} color='neutral.contrastText'>
          {chrome.i18n.getMessage('Recovery')}
          <Box display="inline" color="primary.main">
            {chrome.i18n.getMessage('Phrase')}
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Write__down__this__phrase__in__this__exact__order__and__keep__them__safe')}
        </Typography>

        <Box
          sx={{
            border: '2px solid #5E5E5E',
            borderRadius: '12px',
            mt: '8px',
            position: 'relative',
            // overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignContent: 'flex-start',
              flexWrap: 'wrap',
              minHeight: '172px',
              position: 'relative',
              // gridTemplateColumns: 'repeat(6, 1fr)',
              // gridAutoFlow: 'column',
              borderRadius: '12px',
              backgroundColor: '#333333',
              transition: 'all .3s linear',
              // margin: '-2%',
              py: '16px',
              px: '24px',
              filter: isCoverBlur ? 'blur(5px)' : 'none',
            }}
          >
            {mnemonic.split(' ').map((word, i) => {
              return (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginRight: '16px', marginBottom: '12px', }} key={i}>
                  <Box sx={{
                    topx: 0,
                    lineHeight: '26px',
                    textAlign: 'center',
                    color: 'neutral1.main',
                    backgroundColor: 'neutral1.light',
                    width: '26px',
                    height: '26px',
                    borderRadius: '26px',
                    top: 0,
                    marginRight: '8px',
                    textIndent: '-1px',
                    fontWeight: 'bold'
                  }}>{i + 1}</Box>
                  <Typography
                    key={'key_' + i}
                    variant="body1"
                    sx={{ color: '#f9f9f9' }}
                  >
                    {word}
                  </Typography>
                </Box>
              );
            })}

            <IconButton
              onClick={() => {
                coverBlur(!isCoverBlur);
              }}
              component="span"
              sx={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                height: '40px',
                width: '40px',
                my: '16px',
                mx: '24px',
                backgroundColor: 'neutral1.main',
                transition: 'all .3s ease-in-out',
                justifySelf: 'end',
                opacity: isCoverBlur ? 0 : 1,
                // visibility: isCoverBlur ? 'hidden' : 'visible',
                //   ':hover': {
                //     bgcolor: '#41CC5D',
                //   },
              }}
            >
              <LockRoundedIcon />
            </IconButton>
          </Box>

          {isCoverBlur && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                height: '100%',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'all .3s ease-in-out',
                visibility: isCoverBlur ? 'visible' : 'hidden',
              }}
            >
              <IconButton
                onClick={() => {
                  coverBlur(!isCoverBlur);
                  setCanGoNext(true);
                }}
                component="span"
                sx={{
                  backgroundColor: 'neutral1.main',
                  //   ':hover': {
                  //     bgcolor: '#41CC5D',
                  //   },
                }}
              >
                <LockOpenRoundedIcon />
              </IconButton>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                {chrome.i18n.getMessage('Click__here__to__reveal__phrase')}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex' }}>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(mnemonic);
            }}
            variant="text"
            color="primary"
            startIcon={<IconCopy />}
            sx={{
              // height: '40px',
              // width: '40px',
              justifySelf: 'center',
              marginLeft: '3px',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {chrome.i18n.getMessage('Copy')}
            </Typography>
          </Button>
          <Box sx={{ flexGrow: 1 }} />
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>

          <Presets.TransitionSlideUp>
            <Box
              sx={{
                width: '95%',
                backgroundColor: 'error.light',
                mx: 'auto',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                py: '8px',
              }}
            >
              {/* <CardMedia style={{ color:'#E54040', width:'24px',height:'24px', margin: '0 12px 0' }} image={empty} />   */}
              <InfoIcon fontSize='medium' style={{ margin: '0px 12px auto 12px', color: '#E54040' }} />
              <Typography variant="body1" color="error.main" sx={{ fontSize: '14px' }}>
                {chrome.i18n.getMessage('Please__notice__that__If__you__lose__you__can__not__access')}
              </Typography>
            </Box>
          </Presets.TransitionSlideUp>
          <Button
            disabled={!canGoNext}
            onClick={handleClick}
            variant="contained"
            color="secondary"
            size="large"
            sx={{
              height: '56px',
              borderRadius: '12px',
              textTransform: 'capitalize',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'bold' }}
              color="background.paper"
            >
              {chrome.i18n.getMessage('Okay__I__have__saved__it__properly')}
            </Typography>
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default RecoveryPhrase;
