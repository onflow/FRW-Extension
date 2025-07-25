import React from 'react';

import { getIconColor } from './helper';

interface IconLockProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconLock: React.FC<IconLockProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M785.066667 273.066667a273.066667 273.066667 0 1 0-546.133334 0v68.266666a204.8 204.8 0 0 0-204.8 204.8v273.066667a204.8 204.8 0 0 0 204.8 204.8h546.133334a204.8 204.8 0 0 0 204.8-204.8V546.133333a204.8 204.8 0 0 0-204.8-204.8V273.066667zM648.533333 341.333333H375.466667V273.066667a136.533333 136.533333 0 1 1 273.066666 0v68.266666zM170.666667 546.133333a68.266667 68.266667 0 0 1 68.266666-68.266666h546.133334a68.266667 68.266667 0 0 1 68.266666 68.266666v273.066667a68.266667 68.266667 0 0 1-68.266666 68.266667H238.933333a68.266667 68.266667 0 0 1-68.266666-68.266667V546.133333z"
        fill={getIconColor(color, 0, '#E6E6E6')}
      />
    </svg>
  );
};

export default IconLock;
