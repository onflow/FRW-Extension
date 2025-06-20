import React from 'react';

export const AboutIcon = ({
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
        d="M12 16.0841V12.0841M12 8.08411H12.01M22 12.0841C22 17.607 17.5228 22.0841 12 22.0841C6.47715 22.0841 2 17.607 2 12.0841C2 6.56126 6.47715 2.08411 12 2.08411C17.5228 2.08411 22 6.56126 22 12.0841Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
