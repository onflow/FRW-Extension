import React from 'react';

import { getIconColor } from './helper';

interface IconCreateProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconCreate: React.FC<IconCreateProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M594.285714 73.142857a73.142857 73.142857 0 0 0-146.285714 0v356.571429H73.142857a73.142857 73.142857 0 0 0 0 146.285714h374.857143V950.857143a73.142857 73.142857 0 1 0 146.285714 0V576H950.857143a73.142857 73.142857 0 1 0 0-146.285714H594.285714V73.142857z"
        fill={getIconColor(color, 0, '#E6E6E6')}
      />
    </svg>
  );
};

export default IconCreate;
