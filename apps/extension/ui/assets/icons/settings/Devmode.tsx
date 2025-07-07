import React from 'react';

export const DevmodeIcon = ({
  color = '#00EF8B',
  width = 24,
  height = 25,
}: {
  color?: string;
  width?: number;
  height?: number;
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 18.0841L22 12.0841L16 6.08411M8 6.08411L2 12.0841L8 18.0841"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
