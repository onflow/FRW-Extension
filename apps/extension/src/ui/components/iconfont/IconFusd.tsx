import React from 'react';

import { getIconColor } from './helper';

interface IconFusdProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconFusd: React.FC<IconFusdProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M511.04 1022.144c282.272 0 511.104-228.8 511.104-511.072C1022.144 228.8 793.344 0 511.04 0 228.8 0 0 228.8 0 511.04c0 282.272 228.8 511.104 511.04 511.104z"
        fill={getIconColor(color, 0, '#00EF8B')}
      />
      <path
        d="M511.04 347.52a40.896 40.896 0 0 1-40.864 40.896H184v327.072h286.176a40.864 40.864 0 0 0 40.896-40.864 40.896 40.896 0 0 1 40.864-40.896h286.208V306.656h-286.208a40.896 40.896 0 0 0-40.864 40.864z"
        fill={getIconColor(color, 1, '#FDFBF9')}
      />
      <path
        d="M511.072 409.024l-102.048 102.048 102.08 102.048 102.016-102.08-102.048-102.016z"
        fill={getIconColor(color, 2, '#16FF99')}
      />
    </svg>
  );
};

export default IconFusd;
