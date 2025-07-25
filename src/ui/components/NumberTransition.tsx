import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import React, { useEffect, useState } from 'react';

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-1em);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface NumberTransitionProps {
  number: string;
  delay?: number;
}

export const NumberTransition = ({ number, delay = 0 }: NumberTransitionProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, number]);

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        position: 'relative',
        height: '1.2em',
        overflow: 'hidden',
        '& > span': {
          display: 'inline-block',
          visibility: show ? 'visible' : 'hidden',
          animation: show ? `${slideDown} 300ms ease forwards` : 'none',
          animationDelay: `${delay}ms`,
        },
      }}
    >
      <span>{number}</span>
    </Box>
  );
};
