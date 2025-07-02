import { Box, IconButton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import React from 'react';

import IconCopy from '@/ui/components/iconfont/IconCopy';

export const CredentialBox = ({ data }) => {
  return (
    <>
      <Box
        sx={{
          // border: '2px solid #5E5E5E',
          borderRadius: '12px',
          position: 'relative',
          padding: '5px 16px',
          lineBreak: 'anywhere',
          marginTop: '0px',
          backgroundColor: '#333333',
        }}
      >
        <Typography
          variant="body1"
          display="inline"
          color="text.secondary"
          sx={{
            alignSelf: 'center',
            fontSize: '14px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '24px',
            // color: '#E6E6E6',
            padding: '16px 0',
          }}
        >
          {data}
        </Typography>
        <Grid container direction="row" justifyContent="end" alignItems="end">
          <IconButton
            edge="end"
            onClick={() => {
              navigator.clipboard.writeText(data);
            }}
            // sx={{ marginLeft:'380px'}}
          >
            <IconCopy
              style={{
                height: '20px',
                width: '20px',
              }}
            />
          </IconButton>
        </Grid>
      </Box>
    </>
  );
};
