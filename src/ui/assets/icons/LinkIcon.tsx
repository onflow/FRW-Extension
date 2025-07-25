import React from 'react';

import { COLOR_GREY_ICONS_767676 } from '@/ui/style/color';

export const LinkIcon = ({
  color = COLOR_GREY_ICONS_767676,
  width = 21,
  height = 21,
}: {
  color?: string;
  width?: number;
  height?: number;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 21 21"
      fill="none"
    >
      <g clipPath="url(#clip0_2713_2905)">
        <path
          d="M9.2085 11.3335C9.56638 11.8119 10.023 12.2078 10.5473 12.4942C11.0716 12.7807 11.6514 12.9511 12.2474 12.9937C12.8433 13.0364 13.4415 12.9504 14.0013 12.7416C14.5611 12.5328 15.0694 12.206 15.4918 11.7835L17.9918 9.28347C18.7508 8.49762 19.1708 7.44511 19.1613 6.35263C19.1518 5.26014 18.7136 4.21509 17.9411 3.44256C17.1685 2.67002 16.1235 2.23182 15.031 2.22233C13.9385 2.21283 12.886 2.63281 12.1002 3.3918L10.6668 4.8168M12.5418 9.6668C12.184 9.18836 11.7274 8.79248 11.203 8.50602C10.6787 8.21955 10.0989 8.0492 9.50296 8.00652C8.907 7.96384 8.30884 8.04983 7.74905 8.25865C7.18925 8.46747 6.6809 8.79424 6.2585 9.2168L3.7585 11.7168C2.99951 12.5026 2.57953 13.5552 2.58902 14.6476C2.59852 15.7401 3.03672 16.7852 3.80926 17.5577C4.58179 18.3302 5.62684 18.7684 6.71933 18.7779C7.81181 18.7874 8.86432 18.3675 9.65017 17.6085L11.0752 16.1835"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2713_2905">
          <rect width="20" height="20" fill="white" transform="translate(0.875 0.5)" />
        </clipPath>
      </defs>
    </svg>
  );
};
