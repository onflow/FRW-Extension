import React from 'react';

export const CheckSquareIcon = ({
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
      viewBox="0 0 35 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.25 15.5833L17.5 19.8333L31.6667 5.66667M30.25 17V26.9167C30.25 27.6681 29.9515 28.3888 29.4201 28.9201C28.8888 29.4515 28.1681 29.75 27.4167 29.75H7.58333C6.83189 29.75 6.11122 29.4515 5.57986 28.9201C5.04851 28.3888 4.75 27.6681 4.75 26.9167V7.08333C4.75 6.33189 5.04851 5.61122 5.57986 5.07986C6.11122 4.54851 6.83189 4.25 7.58333 4.25H23.1667"
        stroke={color}
        strokeWidth="2.83333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
