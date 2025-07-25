import React from 'react';

interface MobileIconProps {
  color?: string;
  width?: number;
  height?: number;
}

export const MobileIcon: React.FC<MobileIconProps> = ({
  color = '#00EF8B',
  width = 29,
  height = 29,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 29 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.529 21.365H14.5407M8.6957 2.6983H20.3624C21.651 2.6983 22.6957 3.74297 22.6957 5.03164V23.6983C22.6957 24.987 21.651 26.0316 20.3624 26.0316H8.6957C7.40703 26.0316 6.36237 24.987 6.36237 23.6983V5.03164C6.36237 3.74297 7.40703 2.6983 8.6957 2.6983Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
