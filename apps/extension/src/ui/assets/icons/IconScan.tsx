import { useTheme } from '@mui/material/styles';
import React from 'react';

interface IconScanProps {
  width?: number;
  height?: number;
  color?: string;
}

export const IconScan: React.FC<IconScanProps> = ({ width = 24, height = 24, color }) => {
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
        d="M3 7V5C3 3.89543 3.89543 3 5 3H7M7 21H5C3.89543 21 3 20.1046 3 19V17M21 17V19C21 20.1046 20.1046 21 19 21H17M17 3H19C20.1046 3 21 3.89543 21 5V7"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
