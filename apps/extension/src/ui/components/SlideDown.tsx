import { Box, Slide } from '@mui/material';
import React, { useRef } from 'react';

const SlideDown = ({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactElement;
  container?: HTMLElement;
}) => {
  const containerRef = useRef<HTMLElement>(null);
  return (
    <>
      <Box position="relative" ref={containerRef} />
      <Slide in={show} direction="down" container={containerRef.current} mountOnEnter unmountOnExit>
        {children}
      </Slide>
    </>
  );
};

export default SlideDown;
