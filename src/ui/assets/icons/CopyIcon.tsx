import React from 'react';

export const CopyIcon = ({
  width = 25,
  height = 25,
  color = 'white',
}: {
  width?: number;
  height?: number;
  color?: string;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.875 15.5H4.875C4.34457 15.5 3.83586 15.2893 3.46079 14.9142C3.08571 14.5391 2.875 14.0304 2.875 13.5V4.5C2.875 3.96957 3.08571 3.46086 3.46079 3.08579C3.83586 2.71071 4.34457 2.5 4.875 2.5H13.875C14.4054 2.5 14.9141 2.71071 15.2892 3.08579C15.6643 3.46086 15.875 3.96957 15.875 4.5V5.5M11.875 9.5H20.875C21.9796 9.5 22.875 10.3954 22.875 11.5V20.5C22.875 21.6046 21.9796 22.5 20.875 22.5H11.875C10.7704 22.5 9.875 21.6046 9.875 20.5V11.5C9.875 10.3954 10.7704 9.5 11.875 9.5Z"
      stroke={color}
      strokeOpacity="0.501961"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
