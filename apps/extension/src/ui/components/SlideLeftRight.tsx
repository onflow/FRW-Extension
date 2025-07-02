import { Box, Slide } from '@mui/material';
import React from 'react';

const SlideLeftRight = React.forwardRef(
  (
    {
      show,
      direction = 'left',
      children,
    }: {
      show: boolean;
      direction: 'left' | 'right';
      children: React.ReactElement;
    },
    ref
  ) => {
    const showIt = !!show;
    if (showIt) {
      return children;
    } else {
      return null;
    }
  }
);

export default SlideLeftRight;
