import React from 'react';

import { getIconColor } from './helper';

interface IconUserSwitchProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconUserSwitch: React.FC<IconUserSwitchProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1024 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M707.764706 210.823529a210.823529 210.823529 0 1 1-421.647059 0 210.823529 210.823529 0 0 1 421.647059 0z m-90.352941 0a120.470588 120.470588 0 1 0-240.941177 0 120.470588 120.470588 0 0 0 240.941177 0zM150.588235 903.529412c0-167.996235 163.237647-316.235294 380.747294-316.235294 79.932235 0 153.6 20.48 214.377412 54.934588a45.176471 45.176471 0 0 0 44.574118-78.546824C715.715765 521.336471 626.627765 496.941176 531.335529 496.941176 278.407529 496.941176 60.235294 672.286118 60.235294 903.529412a45.176471 45.176471 0 0 0 90.352941 0zM496.941176 871.062588a30.117647 30.117647 0 0 1 30.117648-30.117647h379.964235a30.117647 30.117647 0 0 1 22.588235 49.995294l-81.377882 92.702118a30.117647 30.117647 0 1 1-45.296941-39.755294l37.526588-42.706824H527.058824a30.117647 30.117647 0 0 1-30.117648-30.117647z"
        fill={getIconColor(color, 0, '#E6E6E6')}
      />
      <path
        d="M907.023059 721.799529H595.245176l35.538824-38.912a30.117647 30.117647 0 1 0-44.574118-40.598588L504.771765 731.678118a30.117647 30.117647 0 0 0 22.287059 50.356706h379.964235a30.117647 30.117647 0 1 0 0-60.235295z"
        fill={getIconColor(color, 1, '#E6E6E6')}
      />
    </svg>
  );
};

export default IconUserSwitch;
