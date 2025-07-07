import React from 'react';

import { getIconColor } from './helper';

interface IconBinanceProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconBinance: React.FC<IconBinanceProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M324.945455 512l-76.99394 76.993939L170.763636 512l76.99394-76.993939zM512.09697 324.848485l132.072727 132.072727 76.993939-76.993939L512.09697 170.666667 302.836364 379.927273l76.993939 76.993939z m264.145454 110.157576L699.248485 512l76.993939 76.993939 76.99394-76.993939zM512.09697 699.151515l-132.072728-132.072727-76.993939 76.993939L512.09697 853.333333l209.066666-209.260606-76.993939-76.993939z m0-110.157576l76.993939-76.993939-76.993939-76.993939-77.187879 76.993939z"
        fill={getIconColor(color, 0, '#F0B90B')}
      />
    </svg>
  );
};

export default IconBinance;
