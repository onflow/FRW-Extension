import React from 'react';

export const LockIcon = ({
  color = 'white',
  width = 34,
  height = 34,
}: {
  color?: string;
  width?: number;
  height?: number;
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.91667 15.583V9.91634C9.91667 8.03772 10.6629 6.23605 11.9913 4.90767C13.3197 3.57929 15.1214 2.83301 17 2.83301C18.8786 2.83301 20.6803 3.57929 22.0087 4.90767C23.3371 6.23605 24.0833 8.03772 24.0833 9.91634V15.583M7.08333 15.583H26.9167C28.4815 15.583 29.75 16.8515 29.75 18.4163V28.333C29.75 29.8978 28.4815 31.1663 26.9167 31.1663H7.08333C5.51853 31.1663 4.25 29.8978 4.25 28.333V18.4163C4.25 16.8515 5.51853 15.583 7.08333 15.583Z"
        stroke={color}
        strokeWidth="2.83333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
