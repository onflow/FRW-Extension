import Box from '@mui/material/Box';
import CircularProgress, {
  circularProgressClasses,
  type CircularProgressProps,
} from '@mui/material/CircularProgress';
import React from 'react';

// Inspired by the former Facebook spinners.
function LLCircularProgress(props: CircularProgressProps) {
  return (
    <Box sx={{ position: 'relative', display: 'flex' }}>
      <CircularProgress
        variant="determinate"
        sx={{
          color: 'neutral2.main',
        }}
        size={40}
        thickness={5}
        {...props}
        value={100}
      />
      <CircularProgress
        variant="indeterminate"
        // disableShrink
        sx={{
          color: 'primary.main',
          animationDuration: '2000ms',
          position: 'absolute',
          left: 0,
          [`& .${circularProgressClasses.circle}`]: {
            strokeLinecap: 'round',
          },
        }}
        size={40}
        thickness={5}
        value={10}
        {...props}
      />
    </Box>
  );
}

export const LLSpinner = (props: CircularProgressProps) => {
  //   const { label, ...inherentProps } = props;
  return <LLCircularProgress {...props} />;
};
