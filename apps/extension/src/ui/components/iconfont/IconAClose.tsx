import React from 'react';

import { getIconColor } from './helper';

interface IconACloseProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconAClose: React.FC<IconACloseProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M801.848889 734.037333L579.925333 512l221.980445-222.037333a47.957333 47.957333 0 1 0-67.811556-67.925334L512 444.017778 289.905778 222.037333a48.014222 48.014222 0 1 0-67.754667 67.982223L444.074667 512l-221.980445 221.980444a48.014222 48.014222 0 1 0 67.811556 67.982223L512 579.982222l222.094222 221.980445a48.071111 48.071111 0 0 0 67.754667-67.925334z"
        fill={getIconColor(color, 0, '#787878')}
      />
    </svg>
  );
};

export default IconAClose;
