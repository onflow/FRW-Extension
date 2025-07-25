import { Avatar, Skeleton, type AvatarProps } from '@mui/material';
import React from 'react';

type TokenAvatarProps = AvatarProps & {
  symbol?: string; // The token symbol - if undefined, the avatar is loading
  width?: number;
  height?: number;
};

const TokenAvatar: React.FC<TokenAvatarProps> = ({ symbol, width = 36, height = 36, ...props }) => {
  if (!symbol) {
    return <Skeleton variant="circular" width={width} height={height} />;
  }
  return (
    <Avatar
      {...props}
      sx={{
        width,
        height,
        fontSize: width && width <= 24 ? (width <= 18 ? '10px' : '14px') : undefined,
      }}
      variant="circular"
    >
      {symbol.charAt(0)}
    </Avatar>
  );
};

export default TokenAvatar;
