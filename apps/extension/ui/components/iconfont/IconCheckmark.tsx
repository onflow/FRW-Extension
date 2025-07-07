import React from 'react';

import { getIconColor } from './helper';

interface IconCheckmarkProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconCheckmark: React.FC<IconCheckmarkProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M512 85.333333C276.906667 85.333333 85.333333 276.906667 85.333333 512s191.573333 426.666667 426.666667 426.666667 426.666667-191.573333 426.666667-426.666667S747.093333 85.333333 512 85.333333z m153.173333 366.506667l-150.186666 150.186667c-6.4 6.4-14.506667 9.386667-22.613334 9.386666s-16.64-2.986667-22.613333-9.386666l-75.093333-75.093334c-12.8-12.373333-12.8-32.853333 0-45.226666 12.373333-12.373333 32.853333-12.373333 45.226666 0l52.48 52.48 127.573334-127.573334c12.373333-12.373333 32.426667-12.373333 45.226666 0 12.373333 12.373333 12.373333 32.853333 0 45.226667z"
        fill={getIconColor(color, 0, '#333333')}
      />
    </svg>
  );
};

export default IconCheckmark;
