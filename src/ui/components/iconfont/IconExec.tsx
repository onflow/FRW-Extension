import React from 'react';

import { getIconColor } from './helper';

interface IconExecProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconExec: React.FC<IconExecProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M555.511467 933.262222a48.64 48.64 0 0 0 48.64 84.195556l153.6-88.689778a48.64 48.64 0 0 0 17.806222-66.389333l-88.746667-153.6a48.64 48.64 0 1 0-84.195555 48.64l27.477333 47.559111-328.078222-81.976889a82.432 82.432 0 0 1 19.512889-162.360889h369.436444v-0.170667a179.655111 179.655111 0 0 0 36.067556-353.792L393.435022 123.335111l56.490667-32.597333a48.64 48.64 0 0 0-48.64-84.195556l-153.6 88.632889a48.64 48.64 0 0 0-17.749333 66.446222l88.689777 153.6a48.64 48.64 0 0 0 84.195556-48.64l-27.477333-47.559111 328.135111 81.976889a82.432 82.432 0 0 1-19.569778 162.360889H314.530133v0.170667a179.655111 179.655111 0 0 0-36.124444 353.792l333.596444 83.342222-56.490666 32.597333z"
        fill={getIconColor(color, 0, '#41CC5D')}
      />
    </svg>
  );
};

export default IconExec;
