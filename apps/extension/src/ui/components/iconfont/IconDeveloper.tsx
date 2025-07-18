import React from 'react';

import { getIconColor } from './helper';

interface IconDeveloperProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconDeveloper: React.FC<IconDeveloperProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1417 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M1026.126769 132.174769a69.316923 69.316923 0 0 1 97.752616 7.561846l277.267692 323.426462a69.316923 69.316923 0 0 1 0 90.269538l-277.267692 323.426462a69.316923 69.316923 0 0 1-105.235693-90.190769l238.67077-278.370462-238.67077-278.370461a69.316923 69.316923 0 0 1 7.483077-97.673847zM391.719385 884.420923a69.316923 69.316923 0 0 1-97.752616-7.561846L16.699077 553.432615a69.316923 69.316923 0 0 1 0-90.269538l277.267692-323.426462a69.316923 69.316923 0 0 1 105.235693 90.19077L160.610462 508.297846l238.592 278.370462a69.316923 69.316923 0 0 1-7.483077 97.673846zM842.673231 18.274462a69.316923 69.316923 0 0 1 48.600615 85.070769L660.322462 950.429538a69.316923 69.316923 0 0 1-133.750154-36.548923L757.523692 66.953846a69.316923 69.316923 0 0 1 85.07077-48.600615z"
        fill={getIconColor(color, 0, '#59A1DB')}
      />
    </svg>
  );
};

export default IconDeveloper;
