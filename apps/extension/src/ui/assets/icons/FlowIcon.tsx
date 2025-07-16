import { useTheme } from '@mui/material/styles';
import React from 'react';

interface FlowIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export const FlowIcon: React.FC<FlowIconProps> = ({ width = 24, height = 24, color }) => {
  const theme = useTheme();
  const iconColor = color || theme.palette.primary.main;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 17L12 22L22 17"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 12L12 17L22 12"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
