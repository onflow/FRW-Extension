import React from 'react';

import { getIconColor } from './helper';

interface IconDropdownProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconDropdown: React.FC<IconDropdownProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 2048 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path d="M1024 1024L137.216 0h1773.568L1024 1024z" fill={getIconColor(color, 0, '#E6E6E6')} />
    </svg>
  );
};

export default IconDropdown;
