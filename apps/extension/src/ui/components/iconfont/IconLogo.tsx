import { useTheme } from '@mui/material/styles';
import React from 'react';

interface IconLogoProps {
  width?: number;
  height?: number;
  color?: string[];
}

export const IconLogo: React.FC<IconLogoProps> = ({ width = 24, height = 24, color }) => {
  const theme = useTheme();

  const getIconColor = (colors: string[] | undefined, index: number, defaultColor: string) => {
    if (colors && colors[index]) {
      return colors[index];
    }
    return defaultColor;
  };

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
        fill={getIconColor(color, 0, theme.palette.success.main)}
      />
      <path d="M2 17L12 22L22 17" fill={getIconColor(color, 1, theme.palette.darkGray.main)} />
      <path d="M2 12L12 17L22 12" fill={getIconColor(color, 2, theme.palette.purple.main)} />
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        fill={getIconColor(color, 3, theme.palette.yellow.main)}
      />
    </svg>
  );
};
