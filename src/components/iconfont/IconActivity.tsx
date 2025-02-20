import React from 'react';

interface IconActivityProps {
  sx?: React.CSSProperties;
  color?: string;
}

const IconActivity: React.FC<IconActivityProps> = ({ sx = {}, color = '#777E90' }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: '20px',
        height: '20px',
        ...sx,
      }}
    >
      <path
        d="M8.00016 14.6667C11.6821 14.6667 14.6668 11.6819 14.6668 8C14.6668 4.31811 11.6821 1.33334 8.00016 1.33334C4.31826 1.33334 1.3335 4.31811 1.3335 8C1.3335 11.6819 4.31826 14.6667 8.00016 14.6667Z"
        stroke={color}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 4V8L10.6667 9.33333"
        stroke={color}
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconActivity;
