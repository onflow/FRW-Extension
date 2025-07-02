import React from 'react';

import { getIconColor } from './helper';

interface IconAboutProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconAbout: React.FC<IconAboutProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M448 320a64 64 0 1 1 128 0 64 64 0 0 1-128 0zM512 448a64 64 0 0 0-64 64v192a64 64 0 1 0 128 0V512a64 64 0 0 0-64-64z"
        fill={getIconColor(color, 0, '#E6E6E6')}
      />
      <path
        d="M512 1024A512 512 0 1 0 512 0a512 512 0 0 0 0 1024z m0-96a416 416 0 1 1 0-832 416 416 0 0 1 0 832z"
        fill={getIconColor(color, 1, '#E6E6E6')}
      />
    </svg>
  );
};

export default IconAbout;
