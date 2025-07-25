import React from 'react';

import { getIconColor } from './helper';

interface IconCopyProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconCopy: React.FC<IconCopyProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1109 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M191.914667 159.573333h501.76a170.666667 170.666667 0 0 1 170.666666 170.666667V853.333333c0 3.669333 0 7.424-0.341333 11.093334h21.333333a170.666667 170.666667 0 0 0 170.666667-170.666667V170.666667a170.666667 170.666667 0 0 0-170.666667-170.666667h-523.093333a170.666667 170.666667 0 0 0-170.325333 159.573333z"
        fill={getIconColor(color, 0, '#787878')}
        opacity=".75"
      />
      <path
        d="M0 159.658667m170.666667 0l523.093333 0q170.666667 0 170.666667 170.666666l0 523.093334q0 170.666667-170.666667 170.666666l-523.093333 0q-170.666667 0-170.666667-170.666666l0-523.093334q0-170.666667 170.666667-170.666666Z"
        fill={getIconColor(color, 1, '#787878')}
      />
    </svg>
  );
};

export default IconCopy;
