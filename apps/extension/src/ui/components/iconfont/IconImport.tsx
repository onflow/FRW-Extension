import React from 'react';

import { getIconColor } from './helper';

interface IconImportProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconImport: React.FC<IconImportProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M449.316571 0a73.142857 73.142857 0 0 0 0 146.285714H877.714286v731.428572H449.316571a73.142857 73.142857 0 1 0 0 146.285714H950.857143a73.142857 73.142857 0 0 0 73.142857-73.142857V73.142857a73.142857 73.142857 0 0 0-73.142857-73.142857H449.316571z"
        fill={getIconColor(color, 0, '#E6E6E6')}
      />
      <path
        d="M393.801143 314.733714A73.142857 73.142857 0 0 0 288.914286 416.694857l49.956571 51.419429H73.142857a73.142857 73.142857 0 0 0 0 146.285714h265.728l-49.956571 51.419429a73.142857 73.142857 0 0 0 104.886857 101.961142l170.642286-175.542857a73.142857 73.142857 0 0 0 0-101.961143l-170.642286-175.542857z"
        fill={getIconColor(color, 1, '#E6E6E6')}
      />
    </svg>
  );
};

export default IconImport;
