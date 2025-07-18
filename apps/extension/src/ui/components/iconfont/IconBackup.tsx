import React from 'react';

import { getIconColor } from './helper';

interface IconBackupProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconBackup: React.FC<IconBackupProps> = ({ size = 18, color, style: _style, ...rest }) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1536 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M1194.666667 995.584v-3.584a348.501333 348.501333 0 0 0-41.386667-693.248A497.92 497.92 0 0 0 206.336 412.757333a298.837333 298.837333 0 0 0 92.330667 582.826667H1194.666667z m-18.090667-130.304l-15.701333 2.304H830.378667A64.170667 64.170667 0 0 0 832 853.333333V651.093333l65.024 55.808a64 64 0 1 0 83.285333-97.28l-170.666666-146.176a64 64 0 0 0-83.285334 0l-170.666666 146.261334a64 64 0 1 0 83.285333 97.194666l65.024-55.722666V853.333333c0 4.864 0.512 9.642667 1.621333 14.250667H298.666667a170.666667 170.666667 0 0 1-52.821334-333.056l73.557334-23.893333 13.056-76.202667a369.92 369.92 0 0 1 703.488-84.48l32.682666 74.837333 81.664 1.962667a220.416 220.416 0 0 1 26.282667 438.613333z"
        fill={getIconColor(color, 0, '#E6E6E6')}
      />
    </svg>
  );
};

export default IconBackup;
