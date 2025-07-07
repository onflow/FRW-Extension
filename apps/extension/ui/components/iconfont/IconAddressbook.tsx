import React from 'react';

import { getIconColor } from './helper';

interface IconAddressbookProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconAddressbook: React.FC<IconAddressbookProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M713.142857 0a73.142857 73.142857 0 0 1 73.142857 73.142857v164.571429H950.857143a73.142857 73.142857 0 1 1 0 146.285714h-164.571429V621.714286H950.857143a73.142857 73.142857 0 1 1 0 146.285714h-164.571429V950.857143a73.142857 73.142857 0 1 1-146.285714 0v-182.857143H402.285714V950.857143a73.142857 73.142857 0 1 1-146.285714 0v-182.857143H73.142857a73.142857 73.142857 0 1 1 0-146.285714h182.857143V384H73.142857a73.142857 73.142857 0 0 1 0-146.285714h182.857143V73.142857a73.142857 73.142857 0 0 1 146.285714 0v164.571429h237.714286V73.142857a73.142857 73.142857 0 0 1 73.142857-73.142857zM402.285714 384V621.714286h237.714286V384H402.285714z"
        fill={getIconColor(color, 0, '#E6E6E6')}
      />
    </svg>
  );
};

export default IconAddressbook;
