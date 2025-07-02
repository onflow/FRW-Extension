import React from 'react';

import { getIconColor } from './helper';

interface IconBackButtonProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconBackButton: React.FC<IconBackButtonProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M518.363429 24.393143h-12.690286C240.420571 24.393143 24.393143 240.384 24.393143 505.673143v12.653714c0 265.289143 216.027429 481.28 481.28 481.28h12.690286c265.252571 0 481.28-215.990857 481.28-481.28v-12.653714c0-265.289143-216.027429-481.28-481.28-481.28zM662.674286 548.571429h-213.065143l57.526857 58.038857c14.628571 14.116571 14.628571 37.046857 0 51.675428a36.571429 36.571429 0 0 1-25.856 10.715429c-9.252571 0-18.505143-3.876571-25.819429-10.715429l-119.954285-120.429714a36.790857 36.790857 0 0 1 0-51.712L455.460571 365.714286a36.790857 36.790857 0 0 1 51.675429 0c14.628571 14.628571 14.628571 37.558857 0 51.675428L449.609143 475.428571h213.065143c20.48 0 36.571429 16.566857 36.571428 36.571429 0 20.004571-16.091429 36.571429-36.571428 36.571429z"
        fill={getIconColor(color, 0, '#333333')}
      />
    </svg>
  );
};

export default IconBackButton;
