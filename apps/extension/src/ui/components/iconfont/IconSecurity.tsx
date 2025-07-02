import React from 'react';

import { getIconColor } from './helper';

interface IconSecurityProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconSecurity: React.FC<IconSecurityProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M96 512c0 229.76 186.24 416 416 416s416-186.24 416-416S741.76 96 512 96 96 282.24 96 512zM512 0c282.752 0 512 229.248 512 512s-229.248 512-512 512S0 794.752 0 512 229.248 0 512 0z"
        fill={getIconColor(color, 0, '#579AF2')}
      />
      <path
        d="M554.453333 502.912a106.666667 106.666667 0 1 0-86.272 0L404.608 725.333333h213.333333l-63.530666-222.421333z"
        fill={getIconColor(color, 1, '#579AF2')}
      />
    </svg>
  );
};

export default IconSecurity;
