import React from 'react';

import { getIconColor } from './helper';

interface IconFlowProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconFlow: React.FC<IconFlowProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M512 1024C794.775082 1024 1024 794.775082 1024 512S794.775082 0 512 0 0 229.224918 0 512 229.224918 1024 512 1024z"
        fill={getIconColor(color, 0, '#00EF8B')}
      />
      <path
        d="M736.675672 431.926557H592.073443v144.585443h144.602229V431.926557zM447.588721 630.683279a54.272 54.272 0 1 1-54.272-54.272h54.272V431.926557H393.316721a198.756721 198.756721 0 1 0 198.756722 198.756722v-54.272h-144.484722v54.272zM646.345443 359.625443h162.614557V215.04h-162.614557a198.974951 198.974951 0 0 0-198.756722 198.756721v18.129836h144.484722v-18.129836a54.272 54.272 0 0 1 54.272-54.171278z"
        fill={getIconColor(color, 1, '#FFFFFF')}
      />
      <path
        d="M447.588721 576.411279h144.484722V431.926557h-144.484722v144.484722z"
        fill={getIconColor(color, 2, '#16FF99')}
      />
    </svg>
  );
};

export default IconFlow;
