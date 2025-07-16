import React from 'react';

import { getIconColor } from './helper';

interface IconLogoProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconLogo: React.FC<IconLogoProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M46.4 0m176 0l0 0q176 0 176 176l0 672q0 176-176 176l0 0q-176 0-176-176l0-672q0-176 176-176Z"
        fill={getIconColor(color, 0, '#41CC5D')}
      />
      <path
        d="M46.4 848c0-97.2032 78.7968-176 176-176h467.2c97.2032 0 176 78.7968 176 176s-78.7968 176-176 176H222.4c-97.2032 0-176-78.7968-176-176z"
        fill={getIconColor(color, 1, '#363636')}
      />
      <path
        d="M46.4 848c0 97.2032 78.7968 176 176 176s176-78.7968 176-176v-176H222.4c-97.2032 0-176 78.7968-176 176z"
        fill={getIconColor(color, 2, '#7678ED')}
      />
      <path
        d="M728 92.8m81.458701 81.458701l85.984185 85.984185q81.458701 81.458701 0 162.917402l-85.984185 85.984185q-81.458701 81.458701-162.917402 0l-85.984185-85.984185q-81.458701-81.458701 0-162.917402l85.984185-85.984185q81.458701-81.458701 162.917402 0Z"
        fill={getIconColor(color, 3, '#FFD500')}
      />
    </svg>
  );
};

export default IconLogo;
