import React from 'react';

import { getIconColor } from './helper';

interface IconFlownsProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconFlowns: React.FC<IconFlownsProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M0 512C0 229.2224 229.2224 0 512 0s512 229.2224 512 512-229.2224 512-512 512S0 794.7776 0 512z"
        fill={getIconColor(color, 0, '#17233A')}
      />
      <path
        d="M520.0384 545.024a119.5008 119.5008 0 0 0 119.4752-119.4752h79.6672a199.168 199.168 0 0 1-199.168 199.168V545.024z"
        fill={getIconColor(color, 1, '#00E075')}
      />
      <path
        d="M520.0384 385.7152v79.6672a119.5008 119.5008 0 0 1 119.4752 119.5008h79.6672a199.168 199.168 0 0 0-199.168-199.168zM520.0128 704.3584a119.4752 119.4752 0 0 0 119.4752-119.4752h79.6672a199.168 199.168 0 0 1-199.1424 199.1424v-79.6672z"
        fill={getIconColor(color, 2, '#FFFFFF')}
      />
      <path
        d="M520.0128 784.0256a199.168 199.168 0 0 1-199.168-199.168h79.6672a119.5008 119.5008 0 0 0 119.5008 119.5008v79.6672z"
        fill={getIconColor(color, 3, '#00E075')}
      />
      <path
        d="M520.0128 624.6912a199.168 199.168 0 0 1-199.168-199.1424h79.6672a119.4752 119.4752 0 0 0 119.5008 119.5008v79.6416z"
        fill={getIconColor(color, 4, '#00E075')}
      />
      <path
        d="M520.0128 465.3824a119.4752 119.4752 0 0 0-119.5008 119.5008h-79.6416a199.168 199.168 0 0 1 199.1424-199.168v79.6672z"
        fill={getIconColor(color, 5, '#00E075')}
      />
      <path
        d="M520.0128 306.0736a119.4752 119.4752 0 0 0-119.5008 119.4752h-79.6416a199.168 199.168 0 0 1 199.1424-199.1424v79.6672z"
        fill={getIconColor(color, 6, '#00E075')}
      />
      <path
        d="M520.0384 226.4064a199.168 199.168 0 0 1 199.1424 199.168H639.488a119.5008 119.5008 0 0 0-119.5008-119.5008V226.4064z"
        fill={getIconColor(color, 7, '#00E075')}
      />
      <path
        d="M320.8704 425.5488h79.6416v278.8096a79.6672 79.6672 0 0 1-79.6416 79.6672V425.5488z"
        fill={getIconColor(color, 8, '#00E075')}
      />
    </svg>
  );
};

export default IconFlowns;
