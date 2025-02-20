import { CardMedia } from '@mui/material';
import React from 'react';

import coinIcon from '@/ui/FRWAssets/svg/coinsIcon.svg';

const IconWallet = (props) => (
  <CardMedia
    sx={{
      width: '20px',
      height: '20px',
      color: '#FFFFFF',
      ...props.sx,
    }}
    image={coinIcon}
    {...props}
  />
);

export default IconWallet;
