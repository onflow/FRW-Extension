import React from 'react';

import { getIconColor } from './helper';

interface IconSettingProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconSetting: React.FC<IconSettingProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1131 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M28.887579 394.509474a215.578947 215.578947 0 0 0 0 215.578947l165.564632 286.72a215.578947 215.578947 0 0 0 186.691368 107.789474h331.075368a215.578947 215.578947 0 0 0 186.691369-107.789474l165.564631-286.72a215.578947 215.578947 0 0 0 0-215.578947L898.910316 107.789474a215.578947 215.578947 0 0 0-186.691369-107.789474H381.143579a215.578947 215.578947 0 0 0-186.691368 107.789474L28.887579 394.509474z m711.141053 107.789473a193.320421 193.320421 0 1 1-386.694737 0 193.320421 193.320421 0 0 1 386.694737 0z"
        fill={getIconColor(color, 0, '#787878')}
      />
    </svg>
  );
};

export default IconSetting;
