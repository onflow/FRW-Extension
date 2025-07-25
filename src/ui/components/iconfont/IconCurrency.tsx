import React from 'react';

import { getIconColor } from './helper';

interface IconCurrencyProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconCurrency: React.FC<IconCurrencyProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1066 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M0 512C0 228.650667 232.789333 0 518.570667 0c285.738667 0 518.528 228.650667 518.528 512s-232.789333 512-518.528 512C232.789333 1024 0 795.349333 0 512z m518.570667-418.901333c-235.562667 0-425.472 188.16-425.472 418.901333 0 230.698667 189.866667 418.901333 425.472 418.901333 235.52 0 425.429333-188.16 425.429333-418.901333 0-230.741333-189.866667-418.901333-425.429333-418.901333zM311.594667 542.293333a42.666667 42.666667 0 0 1 0-60.586666l176.938666-175.445334a42.666667 42.666667 0 0 1 60.074667 0l176.896 175.445334a42.666667 42.666667 0 0 1 0 60.586666l-176.896 175.445334a42.666667 42.666667 0 0 1-60.117333 0L311.637333 542.293333z"
        fill={getIconColor(color, 0, '#FFD500')}
      />
    </svg>
  );
};

export default IconCurrency;
