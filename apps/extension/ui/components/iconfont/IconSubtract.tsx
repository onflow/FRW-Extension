import React from 'react';

import { getIconColor } from './helper';

interface IconSubtractProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

const DEFAULT_STYLE: React.CSSProperties = {
  display: 'block',
};

const IconSubtract: React.FC<IconSubtractProps> = ({
  size = 18,
  color,
  style: _style,
  ...rest
}) => {
  const style = _style ? { ...DEFAULT_STYLE, ..._style } : DEFAULT_STYLE;

  return (
    <svg viewBox="0 0 1137 1024" width={size + 'px'} height={size + 'px'} style={style} {...rest}>
      <path
        d="M11.946371 861.102694L472.763423 60.468265a106.322705 106.322705 0 0 1 191.824591 0L1125.518841 861.102694C1162.893917 935.852846 1110.045446 1024 1029.578102 1024H107.830223C27.362879 1024-24.660724 934.999534 11.946371 861.102694zM568.874825 351.021082a42.665612 42.665612 0 0 0-42.665612 42.665612v208.208186a42.665612 42.665612 0 0 0 85.331224 0v-208.208186a42.665612 42.665612 0 0 0-42.665612-42.665612z m0 449.979987a42.665612 42.665612 0 1 0 0-85.331224 42.665612 42.665612 0 0 0 0 85.331224z"
        fill={getIconColor(color, 0, '#41CC5D')}
      />
    </svg>
  );
};

export default IconSubtract;
