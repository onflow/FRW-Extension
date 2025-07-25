import { Box, Slide } from '@mui/material';
import React, { useRef } from 'react';

const SlideRelative = React.forwardRef(
  (
    {
      show,
      direction,
      children,
    }: { show: boolean; direction: 'up' | 'down' | 'left' | 'right'; children: React.ReactElement },
    ref
  ) => {
    const containerRef = useRef<HTMLElement>(null);
    return (
      <>
        <Box position="relative" ref={containerRef} />
        <Slide
          in={!!show}
          direction={direction}
          container={containerRef.current}
          mountOnEnter
          unmountOnExit
        >
          <Box ref={ref}>{children}</Box>
        </Slide>
      </>
    );
  }
);

export default SlideRelative;
