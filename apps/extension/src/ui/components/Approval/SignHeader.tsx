import { Box, CardMedia, Typography } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

import IconCheck from 'ui/assets/check.svg';
import { LLPrimaryButton } from 'ui/components';

export const SignHeader = ({ linkingDone, image, accountTitle, userInfo }) => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const colorArray = [
    'rgba(94,94,94,0.3)',
    'rgba(94,94,94,0.4)',
    'rgba(94,94,94,0.5)',
    'rgba(94,94,94,0.6)',
    'rgba(94,94,94,0.7)',
    'rgba(94,94,94,0.8)',
    'rgba(94,94,94,0.9)',
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
            background: 'linear-gradient(0deg, #32484C, #11271D)',
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
                  backgroundColor: 'text.secondary',
                  objectFit: 'cover',
                }}
                src={image}
              />
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#f2f2f2',
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
                        backgroundColor: '#41CC5D',
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
                    backgroundColor: 'text.secondary',
                    objectFit: 'cover',
                  }}
                  src={userInfo.avatar}
                />
              )}
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#f2f2f2',
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
                  backgroundColor: '#00E075',
                  borderRadius: '20px',
                  width: '24px',
                  height: '24px',
                  padding: '3px',
                  color: '#000',
                }}
                src={IconCheck}
              />
              <Typography
                sx={{
                  fontSize: '16px',
                  marginTop: '7px',
                  color: '#E6E6E6',
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
                color: '#E6E6E6',
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
