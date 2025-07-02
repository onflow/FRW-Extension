import React from 'react';

import { getIconColor } from './helper';

interface IconSearchProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconSearch: React.FC<IconSearchProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M656.384 741.229714a399.847619 399.847619 0 1 1 70.753524-66.852571 46.470095 46.470095 0 0 1 0.975238 0.975238l245.272381 245.223619a48.761905 48.761905 0 1 1-68.998095 68.949333l-245.174858-245.223619a48.420571 48.420571 0 0 1-2.82819-3.072z m-23.405714-108.202666a302.32381 302.32381 0 1 0-427.544381-427.641905 302.32381 302.32381 0 0 0 427.593143 427.641905z"
        fill={getIconColor(color, 0, '#41CC5D')}
      />
    </svg>
  );
};

export default IconSearch;
