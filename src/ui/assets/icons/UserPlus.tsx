import React from 'react';

export const UserPlus = ({
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
      <g clipPath="url(#clip0_2958_26607)">
        <path
          d="M23.1665 29.75V26.9167C23.1665 25.4138 22.5695 23.9724 21.5068 22.9097C20.4441 21.847 19.0027 21.25 17.4998 21.25H7.58317C6.08028 21.25 4.63894 21.847 3.57623 22.9097C2.51353 23.9724 1.9165 25.4138 1.9165 26.9167V29.75M28.8332 11.3333V19.8333M33.0832 15.5833H24.5832M18.2082 9.91667C18.2082 13.0463 15.6711 15.5833 12.5415 15.5833C9.41189 15.5833 6.87484 13.0463 6.87484 9.91667C6.87484 6.78705 9.41189 4.25 12.5415 4.25C15.6711 4.25 18.2082 6.78705 18.2082 9.91667Z"
          stroke={color}
          strokeWidth="2.83333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2958_26607">
          <rect width={width} height={height} fill={color} transform="translate(0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};
