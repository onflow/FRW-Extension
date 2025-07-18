import React from 'react';

import { getIconColor } from './helper';

interface IconSwitchProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconSwitch: React.FC<IconSwitchProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M1024 512A512 512 0 1 1 0 512a512 512 0 0 1 1024 0z m-416.914286 318.171429a36.571429 36.571429 0 0 0 36.571429-36.571429V364.836571l63.634286 55.881143A36.571429 36.571429 0 1 0 755.565714 365.714286l-124.342857-109.129143a36.571429 36.571429 0 0 0-60.708571 27.428571v509.586286a36.571429 36.571429 0 0 0 36.571428 36.571429zM375.881143 284.013714v426.788572l-58.587429-53.394286a36.571429 36.571429 0 1 0-49.298285 54.052571l119.881142 109.129143a36.571429 36.571429 0 0 0 61.147429-27.062857V284.086857a36.571429 36.571429 0 1 0-73.142857 0z"
        fill={getIconColor(color, 0, '#E6E6E6')}
      />
    </svg>
  );
};

export default IconSwitch;
