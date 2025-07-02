import React from 'react';

import { getIconColor } from './helper';

interface IconGoogleDriveProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconGoogleDrive: React.FC<IconGoogleDriveProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M362.666667 128h298.666666l298.666667 512H661.333333z"
        fill={getIconColor(color, 0, '#FFC107')}
      />
      <path
        d="M210.666667 896l150.677333-256H960l-149.333333 256z"
        fill={getIconColor(color, 1, '#1976D2')}
      />
      <path
        d="M64 642.666667L210.666667 896 512 384 362.666667 128z"
        fill={getIconColor(color, 2, '#4CAF50')}
      />
    </svg>
  );
};

export default IconGoogleDrive;
