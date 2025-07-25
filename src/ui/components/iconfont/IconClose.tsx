import React from 'react';

import { getIconColor } from './helper';

interface IconCloseProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconClose: React.FC<IconCloseProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M512 85.333333C276.906667 85.333333 85.333333 276.906667 85.333333 512s191.573333 426.666667 426.666667 426.666667 426.666667-191.573333 426.666667-426.666667S747.093333 85.333333 512 85.333333z m103.253333 485.973334c12.8 12.8 12.373333 32.853333 0 45.226666-6.4 5.973333-14.506667 9.386667-22.613333 9.386667s-16.64-3.413333-22.613333-9.813333L512 557.653333l-57.6 58.453334c-6.4 6.4-14.506667 9.813333-23.04 9.813333-8.106667 0-16.213333-3.413333-22.186667-9.386667-12.8-12.373333-12.8-32.426667-0.426666-45.226666L467.2 512l-58.453333-59.306667c-12.373333-12.8-12.373333-32.853333 0.426666-45.226666 12.373333-12.373333 32.853333-12.373333 45.226667 0.426666L512 466.346667l58.026667-58.453334a31.829333 31.829333 0 1 1 45.226666 44.8L556.8 512l58.453333 59.306667z"
        fill={getIconColor(color, 0, '#333333')}
      />
    </svg>
  );
};

export default IconClose;
