import React from 'react';

import { getIconColor } from './helper';

interface IconChevronRightProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconChevronRight: React.FC<IconChevronRightProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M512 85.312C276.928 85.312 85.312 276.928 85.312 512c0 235.072 191.616 426.688 426.688 426.688 235.072 0 426.688-191.616 426.688-426.688 0-235.072-191.616-426.688-426.688-426.688zM579.392 532.48L494.08 635.328c-6.4 7.68-15.36 11.52-24.768 11.52a30.912 30.912 0 0 1-20.48-7.296 32.192 32.192 0 0 1-4.224-44.8L513.28 512 444.608 429.248a31.936 31.936 0 1 1 49.472-40.512L579.392 491.52a32.192 32.192 0 0 1 0 40.96z"
        fill={getIconColor(color, 0, '#787878')}
      />
    </svg>
  );
};

export default IconChevronRight;
