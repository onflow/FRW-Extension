import React from 'react';

import { getIconColor } from './helper';

interface IconVectorProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconVector: React.FC<IconVectorProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M958.272 433.28H224.192l320.768-320.768c25.6-25.6 25.6-67.648 0-93.312-25.6-25.6-67.072-25.6-92.672 0L19.2 452.288c-25.6 25.6-25.6 67.008 0 92.672l433.088 433.024a65.408 65.408 0 1 0 92.672-92.608L224.256 564.672h734.08A65.92 65.92 0 0 0 1024 498.944a65.92 65.92 0 0 0-65.728-65.728z"
        fill={getIconColor(color, 0, '#787878')}
      />
    </svg>
  );
};

export default IconVector;
