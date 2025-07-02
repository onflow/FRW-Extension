import React from 'react';

import { getIconColor } from './helper';

interface IconCoinbaseProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconCoinbase: React.FC<IconCoinbaseProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M512 0c282.8 0 512 229.2 512 512s-229.2 512-512 512S0 794.8 0 512 229.2 0 512 0z"
        fill={getIconColor(color, 0, '#0052FF')}
      />
      <path
        d="M512.1 692c-99.4 0-180-80.5-180-180s80.6-180 180-180c89.1 0 163.1 65 177.3 150h181.3c-15.3-184.8-170-330-358.7-330-198.8 0-360 161.2-360 360s161.2 360 360 360c188.7 0 343.4-145.2 358.7-330H689.3c-14.3 85-88.1 150-177.2 150z"
        fill={getIconColor(color, 1, '#FFFFFF')}
      />
    </svg>
  );
};

export default IconCoinbase;
