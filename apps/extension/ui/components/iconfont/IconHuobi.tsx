import React from 'react';

import { getIconColor } from './helper';

interface IconHuobiProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconHuobi: React.FC<IconHuobiProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M626.240198 314.576428c0-146.73954-71.492197-273.114636-125.94181-314.132382 0 0-4.188432-2.310859-3.755145 3.610717-4.477289 283.513501-149.339256 360.34956-228.91946 463.760496-183.713283 238.885039-12.998581 500.734238 161.182408 549.117846 97.056074 27.152592-22.530874-47.950322-37.984743-206.388586-18.920157-191.223574 235.41875-337.385399 235.41875-495.968091z"
        fill={getIconColor(color, 0, '#1B2143')}
      />
      <path
        d="M709.719976 411.199215c-1.155429-0.722143-2.744145-1.299858-3.755146 0.577715-3.033002 35.673884-39.42903 111.932228-85.646208 182.124567-156.705119 237.729609-67.448194 352.405982-17.187013 414.077029 29.174594 35.673884 0 0 72.792056-36.540456 89.979068-54.594042 148.328256-149.050399 156.993976-253.905622 14.298439-168.981557-87.090495-275.425495-123.197665-306.333233z"
        fill={getIconColor(color, 1, '#2CA6E0')}
      />
    </svg>
  );
};

export default IconHuobi;
