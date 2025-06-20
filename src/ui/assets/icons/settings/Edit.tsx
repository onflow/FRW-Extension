import React from 'react';

interface EditIconProps {
  color?: string;
  width?: number;
  height?: number;
}

export const EditIcon: React.FC<EditIconProps> = ({
  color = '#767676',
  width = 24,
  height = 25,
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
        d="M11 4.42088H4C3.46957 4.42088 2.96086 4.63159 2.58579 5.00667C2.21071 5.38174 2 5.89045 2 6.42088V20.4209C2 20.9513 2.21071 21.46 2.58579 21.8351C2.96086 22.2102 3.46957 22.4209 4 22.4209H18C18.5304 22.4209 19.0391 22.2102 19.4142 21.8351C19.7893 21.46 20 20.9513 20 20.4209V13.4209M18.5 2.92088C18.8978 2.52306 19.4374 2.29956 20 2.29956C20.5626 2.29956 21.1022 2.52306 21.5 2.92088C21.8978 3.31871 22.1213 3.85827 22.1213 4.42088C22.1213 4.98349 21.8978 5.52306 21.5 5.92088L12 15.4209L8 16.4209L9 12.4209L18.5 2.92088Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
