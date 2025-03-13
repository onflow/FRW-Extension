import { Typography, CardMedia } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/system';
import React from 'react';
import { QRCode } from 'react-qrcode-logo';

import scanIcon from 'ui/assets/scan.svg';
import lilo from 'ui/FRWAssets/image/lilo.png';

const useStyles = makeStyles(() => ({
  customInputLabel: {
    '& legend': {
      visibility: 'visible',
    },
  },
  inputBox: {
    height: '64px',
    padding: '16px',
    zIndex: '999',
    backgroundColor: '#282828',
    border: '2px solid #4C4C4C',
    borderRadius: '12px',
    boxSizing: 'border-box',
    '&.Mui-focused': {
      border: '2px solid #FAFAFA',
      boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
    },
  },
}));

interface SyncQrProps {
  uri: string;
  loadingString: string | null;
  secondLine: string;
}

const SyncQr = ({ uri, loadingString, secondLine }: SyncQrProps) => {
  const classes = useStyles();

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '0 24px 20px',
          height: '380px',
          width: '100%',
          position: 'relative',
          borderRadius: '24px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '353px',
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
            }}
          >
            {chrome.i18n.getMessage('Sync_')}{' '}
            <span style={{ display: 'inline-block', width: '353px' }}>
              {chrome.i18n.getMessage('Lilico')}
            </span>
          </Typography>
          <Box sx={{ position: 'relative' }}>
            <Typography
              variant="body1"
              sx={{ color: 'primary.light', fontSize: '16px', margin: '24px 0 32px' }}
            >
              {chrome.i18n.getMessage('Open_your_Flow_Reference_on_Mobil')}
            </Typography>{' '}
            <CardMedia
              component="img"
              sx={{
                width: '20px',
                height: '20px',
                top: '27px',
                right: '-2px',
                position: 'absolute',
              }}
              image={scanIcon}
            />
          </Box>
          <Typography variant="body1" sx={{ color: '#8C9BAB', pt: '12px', fontSize: '12px' }}>
            {chrome.i18n.getMessage(' Note_Your_recovery_phrase_will_not')}
          </Typography>
        </Box>

        <Box
          sx={{
            padding: '0 24px 0 50px',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            width: '347px',
          }}
        >
          {uri && (
            <Box>
              <Box sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    borderRadius: '24px',
                    width: '277px',
                    height: '277px',
                    display: 'flex',
                    overflow: 'hidden',
                  }}
                >
                  <QRCode
                    size={237}
                    style={{
                      height: 'auto',
                      maxWidth: '100%',
                      width: '100%',
                      borderRadius: '24px',
                    }}
                    value={uri}
                    logoImage={lilo}
                    eyeColor={'#41CC5D'}
                    eyeRadius={24}
                    quietZone={20}
                  />
                </Box>
                {loadingString && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '277px',
                      height: '277px',
                      position: 'absolute',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      top: '0',
                      borderRadius: '24px',
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        width: '150px',
                        color: '#41CC5D',
                        lineHeight: '24px',
                        fontWeight: '700',
                        pt: '14px',
                        fontSize: '14px',
                        textAlign: 'center',
                      }}
                    >
                      {loadingString}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        width: '150px',
                        color: '#41CC5D',
                        lineHeight: '24px',
                        fontWeight: '700',
                        fontSize: '14px',
                        textAlign: 'center',
                      }}
                    >
                      {secondLine}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography
                variant="body1"
                sx={{
                  color: ' rgba(255, 255, 255, 0.80))',
                  pt: '14px',
                  fontSize: '14px',
                  textAlign: 'center',
                }}
              >
                {chrome.i18n.getMessage('Scan_QR_Code_with_Mobile')}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default SyncQr;
