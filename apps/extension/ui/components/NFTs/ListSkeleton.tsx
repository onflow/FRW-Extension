import { Card, Box, Skeleton } from '@mui/material';
import React from 'react';

const LoadingSkeleton = () => (
  <Box>
    {[...Array(3)].map((_, index) => (
      <Card
        key={index}
        sx={{
          backgroundColor: '#000000',
          display: 'flex',
          width: '100%',
          height: '72px',
          margin: '12px auto',
          boxShadow: 'none',
          padding: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', p: 1 }}>
          <Skeleton
            variant="rectangular"
            sx={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
            }}
          />
          <Box sx={{ flex: 1, ml: 1 }}>
            <Skeleton
              variant="text"
              sx={{
                width: '140px',
                height: '24px',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              }}
            />
            <Skeleton
              variant="text"
              sx={{
                width: '80px',
                height: '20px',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton
              variant="circular"
              sx={{
                width: '24px',
                height: '24px',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              }}
            />
          </Box>
        </Box>
      </Card>
    ))}
  </Box>
);

export default LoadingSkeleton;
