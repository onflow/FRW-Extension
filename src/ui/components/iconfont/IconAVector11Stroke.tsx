import React from 'react';

import { getIconColor } from './helper';

interface IconAVector11StrokeProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconAVector11Stroke: React.FC<IconAVector11StrokeProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M235.52 16.091429a54.857143 54.857143 0 0 1 77.531429 0l438.857142 438.857142a54.857143 54.857143 0 0 1 0 77.531429l-438.857142 438.857143a54.857143 54.857143 0 0 1-77.531429-77.531429l400.091429-400.091428L235.52 93.622857a54.857143 54.857143 0 0 1 0-77.531428z"
        fill={getIconColor(color, 0, '#E6E6E6')}
      />
    </svg>
  );
};

export default IconAVector11Stroke;
