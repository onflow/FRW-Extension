import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import IconCheck from '@/ui/assets/check.svg';
import { LLPrimaryButton } from '@/ui/components';

export const LLLinkingLoading = ({ linkingDone, image, accountTitle, userInfo }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [count, setCount] = useState(0);
  const colorArray = [
    theme.palette.text.secondary + '4D', // 0.3 alpha
    theme.palette.text.secondary + '66', // 0.4 alpha
    theme.palette.text.secondary + '80', // 0.5 alpha
    theme.palette.text.secondary + '99', // 0.6 alpha
    theme.palette.text.secondary + 'B3', // 0.7 alpha
    theme.palette.text.secondary + 'CC', // 0.8 alpha
    theme.palette.text.secondary + 'E6', // 0.9 alpha
  ];

  const startCount = () => {
    let count = 0;
    setInterval(() => {
      count++;
      if (count === 15) {
        count = 0;
      }
      setCount(count);
    }, 500);
  };

  const startUsing = () => {
    setTimeout(() => {
      navigate('/');
    });
  };

  useEffect(() => {
    startCount();
  }, []);

  return (
    <div className="page">
      <Box sx={{ paddingX: '18px' }}>
        <Box
          sx={{
            marginTop: '18px',
            padding: '65px 30px',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            height: '100%',
            width: '100%',
            background: `linear-gradient(0deg, #32484C, ${theme.palette.primary.dark || '#11271D'})`,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.5 1fr 1fr',
              gridAutoFlow: 'column',
              justifyContent: 'center',
              alignItems: 'stretch',
              py: '16px',
              gap: '36px',
              marginBottom: '45px',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <img
                style={{
                  height: '60px',
                  width: '60px',
                  borderRadius: '30px',
                  backgroundColor: theme.palette.text.secondary,
                  objectFit: 'cover',
                }}
                src={image}
              />
              <Typography
                sx={{
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                  marginTop: '10px',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                {accountTitle}
              </Typography>
            </Box>
            <Box
              sx={{
                marginLeft: '-15px',
                marginRight: '-15px',
                marginTop: '0px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {colorArray.map((color, index) => (
                <Box sx={{ mx: '5px' }} key={index}>
                  {count === index ? (
                    <Box
                      sx={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '10px',
                        backgroundColor: theme.palette.success.main,
                      }}
                    />
                  ) : (
                    <Box
                      key={index}
                      sx={{
                        height: '5px',
                        width: '5px',
                        borderRadius: '5px',
                        backgroundColor: color,
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {userInfo && (
                <img
                  style={{
                    height: '60px',
                    width: '60px',
                    borderRadius: '30px',
                    backgroundColor: theme.palette.text.secondary,
                    objectFit: 'cover',
                  }}
                  src={userInfo.avatar}
                />
              )}
              <Typography
                sx={{
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                  marginTop: '10px',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                {userInfo?.nickname}
              </Typography>
            </Box>
          </Box>
          {/* <Typography variant="body1" color="text.secondary">{chrome.i18n.getMessage('Lo')}</Typography>     */}
          {linkingDone ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '100px',
              }}
            >
              <img
                style={{
                  display: 'inline',
                  backgroundColor: theme.palette.success.main,
                  borderRadius: '20px',
                  width: '24px',
                  height: '24px',
                  padding: '3px',
                  color: theme.palette.background.paper,
                }}
                src={IconCheck}
              />
              <Typography
                sx={{
                  fontSize: '16px',
                  marginTop: '7px',
                  color: theme.palette.text.secondary,
                  fontWeight: 'bold',
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                {chrome.i18n.getMessage('Linked_Successful')}
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{
                fontSize: '16px',
                color: theme.palette.text.secondary,
                fontWeight: 'bold',
                width: '100%',
                textAlign: 'center',
              }}
            >
              {chrome.i18n.getMessage('Linking_Child_Account')}...
            </Typography>
          )}
          {linkingDone && (
            <LLPrimaryButton onClick={startUsing} label="Start use" fullWidth type="submit" />
          )}
        </Box>
      </Box>
    </div>
  );
};
