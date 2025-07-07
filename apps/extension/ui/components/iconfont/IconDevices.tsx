import React from 'react';

import { getIconColor } from './helper';

interface IconDevicesProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconDevices: React.FC<IconDevicesProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1182 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M248.674462 184.32c0-33.713231 27.963077-61.44 62.227692-61.44h638.582154c34.185846 0 62.227692-27.569231 62.227692-61.44 0-33.792-28.041846-61.44-62.227692-61.44H248.674462c-68.371692 0-124.376615 55.296-124.376616 122.88v676.155077h-31.035077c-51.593846 0-93.262769 41.117538-93.262769 92.16 0 50.963692 41.668923 92.16 93.262769 92.16h450.481231v-184.32H248.674462V184.32z m870.715076 61.518769H746.338462a61.991385 61.991385 0 0 0-62.148924 61.44v614.636308c0 33.870769 27.963077 61.44 62.227693 61.44h372.972307c34.185846 0 62.148923-27.569231 62.148924-61.44V307.278769c0-33.792-27.963077-61.44-62.227693-61.44z m-62.227692 553.117539h-248.595692V368.797538h248.595692v430.15877z"
        fill={getIconColor(color, 0, '#333333')}
      />
    </svg>
  );
};

export default IconDevices;
