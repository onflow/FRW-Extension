import React from 'react';

import { getIconColor } from './helper';

interface IconAGroup762Props {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconAGroup762: React.FC<IconAGroup762Props> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M448 256m64 0l0 0q64 0 64 64l0 0q0 64-64 64l0 0q-64 0-64-64l0 0q0-64 64-64Z"
        fill={getIconColor(color, 0, '#E6E6E6')}
      />
      <path
        d="M448 448m64 0l0 0q64 0 64 64l0 192q0 64-64 64l0 0q-64 0-64-64l0-192q0-64 64-64Z"
        fill={getIconColor(color, 1, '#E6E6E6')}
      />
    </svg>
  );
};

export default IconAGroup762;
