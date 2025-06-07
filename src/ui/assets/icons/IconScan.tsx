import React from 'react';

import { COLOR_GREEN_FLOW_DARKMODE_00EF8B } from '@/ui/style/color';

export const IconScan = ({
  width = 35,
  height = 34,
  color = COLOR_GREEN_FLOW_DARKMODE_00EF8B,
  ...props
}: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 35 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.17334 8.33119V6.66155C4.17334 5.77592 4.52435 4.92656 5.14915 4.30032C5.77394 3.67408 6.62135 3.32227 7.50495 3.32227H10.8366M4.17334 25.0276V26.6973C4.17334 27.5829 4.52435 28.4323 5.14915 29.0585C5.77394 29.6847 6.62135 30.0366 7.50495 30.0366H10.8366M24.163 3.32227H27.4946C28.3782 3.32227 29.2256 3.67408 29.8504 4.30032C30.4752 4.92656 30.8262 5.77592 30.8262 6.66155V8.33119M24.163 30.0366H27.4946C28.3782 30.0366 29.2256 29.6847 29.8504 29.0585C30.4752 28.4323 30.8262 27.5829 30.8262 26.6973V25.0276"
        stroke={color}
        strokeWidth="3.11667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.1646 15.6094H24.4223"
        stroke={color}
        strokeWidth="3.11667"
        strokeLinecap="round"
      />
    </svg>
  );
};
