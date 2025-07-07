import React from 'react';

import { getIconColor } from './helper';

interface IconEyeProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconEye: React.FC<IconEyeProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M611.413333 512c0 55.04-44.373333 99.413333-99.413333 99.413333S412.586667 567.04 412.586667 512 456.96 412.586667 512 412.586667s99.413333 44.373333 99.413333 99.413333z"
        fill={getIconColor(color, 0, '#333333')}
      />
      <path
        d="M886.613333 363.946667C791.466667 249.6 654.933333 183.893333 512 183.893333c-142.933333 0-279.466667 65.706667-374.186667 180.053334-70.4 84.48-70.4 211.626667 0 296.106666 94.72 114.346667 231.253333 180.053333 374.186667 180.053334 142.933333 0 279.466667-65.706667 374.613333-180.053334 69.973333-84.48 69.973333-211.626667 0-296.106666zM512 675.413333c-90.026667 0-163.413333-73.386667-163.413333-163.413333 0-90.026667 73.386667-163.413333 163.413333-163.413333 90.026667 0 163.413333 73.386667 163.413333 163.413333 0 90.026667-73.386667 163.413333-163.413333 163.413333z"
        fill={getIconColor(color, 1, '#333333')}
      />
    </svg>
  );
};

export default IconEye;
