import { Box } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import React, { useState, useEffect } from 'react';

export const LLConnectLoading = ({ logo }) => {
  const [count, setCount] = useState(0);
  const colorArray = [
    'rgba(94,94,94,0.3)',
    'rgba(94,94,94,0.4)',
    'rgba(94,94,94,0.5)',
    'rgba(94,94,94,0.6)',
    'rgba(94,94,94,0.7)',
    'rgba(94,94,94,0.8)',
    'rgba(94,94,94,0.9)',
    'rgba(94,94,94,1)',
    'rgba(94,94,94,1)',
    'rgba(94,94,94,1)',
    'rgba(94,94,94,1)',
    'rgba(94,94,94,1)',
    'rgba(94,94,94,1)',
    'rgba(94,94,94,1)',
    'rgba(94,94,94,1)',
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

  useEffect(() => {
    startCount();
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height: '90vh',
        // background: 'rgba(0, 0, 0, 0.5)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: '16px',
          gap: '12px',
        }}
      >
        <Avatar src={logo} style={{ borderRadius: 12 }} sx={{ height: '64px', width: '64px' }} />
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
                  sx={{ height: '5px', width: '5px', borderRadius: '5px', backgroundColor: color }}
                />
              )}
            </Box>
          ))}
        </Box>
        <Avatar
          src="/images/icon-64.png"
          style={{ borderRadius: 12 }}
          sx={{ height: '64px', width: '64px' }}
        />
      </Box>
      {/* <Typography variant="body1" color="text.secondary">{chrome.i18n.getMessage('Lo')}</Typography>     */}
    </Box>
  );
};
