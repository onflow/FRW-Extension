import React from 'react';

import { getIconColor } from './helper';

interface IconPlayStoreProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconPlayStore: React.FC<IconPlayStoreProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M288 840.1152L672.8448 619.52l-71.68-65.7152L288 840.1152zM668.5952 405.3248l-373.76-217.1648 305.92 279.04 67.84-61.8752zM194.56 183.4752v655.36L553.3952 510.72 194.56 183.4752zM816.2304 491.0848l-89.6-52.0448-78.08 71.2448 82.7648 75.52 84.9152-48.64c11.9296-6.8096 13.2096-18.3296 13.2096-23.04 0-4.6848-1.28-16.2048-13.2096-23.04z"
        fill={getIconColor(color, 0, '#333333')}
      />
    </svg>
  );
};

export default IconPlayStore;
