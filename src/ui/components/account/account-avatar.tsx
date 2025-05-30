import { Avatar, Box, CircularProgress, IconButton, Skeleton, Typography } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { margin } from '@mui/system';
import React from 'react';

import { COLOR_DARK_GRAY_1A1A1A, networkColor } from '@/ui/style/color';

const EmojiIcon = ({ emoji }: { emoji: string }) => {
  return (
    <Typography
      sx={{
        fontSize: '18px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: '18px',
      }}
    >
      {emoji}
    </Typography>
  );
};

const ImageIcon = ({ image, size = 24 }: { image: string; size?: number }) => {
  return (
    <img
      src={image}
      style={{
        width: size,
        height: size,
        borderRadius: size,
      }}
    />
  );
};

const Icon = ({ icon }: { icon: string }) => {
  if (icon.startsWith('http')) {
    return <ImageIcon image={icon} />;
  }
  return <EmojiIcon emoji={icon} />;
};

/**
 * An Account Avatar component that displays an emoji and a parent emoji.
 * It also displays a spinning indicator if the account has a pending transaction.
 * It also displays a border if the account is active.
 */
export const AccountAvatar = ({
  network,
  emoji,
  color,
  parentEmoji,
  parentColor,
  active = false,
  spinning = false,
  onClick,
}: {
  network?: string;
  emoji?: string;
  color?: string;
  parentEmoji?: string;
  parentColor?: string;
  active?: boolean;
  spinning?: boolean;
  onClick?: () => void;
}) => {
  const loading = !network || !emoji || !color;
  if (loading) {
    return <Skeleton variant="circular" width="36px" height="36px" sx={{ marginLeft: '8px' }} />;
  }
  // These are used either on the IconButton or the Box
  const sxProps = {
    zIndex: 1,
    display: 'flex',
    height: '36px',
    width: '36px',
    borderRadius: '36px',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color,
    padding: '0px',
    boxSizing: 'content-box',
    outlineStyle: 'solid',
    outlineWidth: spinning || !active ? '0px' : '1px',
    outlineOffset: spinning || !active ? '0px' : '2px',
    outlineColor: active && !spinning ? networkColor(network) : 'transparent',
    '&:hover': {
      backgroundColor: color ? alpha(color, 0.8) : undefined,
    },
  };
  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
      {spinning && (
        <CircularProgress
          size={'44px'}
          sx={{
            position: 'absolute',
            left: '-4px',
            color: networkColor(network),
            zIndex: 0,
          }}
        />
      )}
      {onClick && (
        <IconButton onClick={onClick} sx={sxProps}>
          <Icon icon={emoji} />
        </IconButton>
      )}
      {!onClick && (
        <Box sx={sxProps}>
          <Icon icon={emoji} />
        </Box>
      )}

      {parentEmoji && (
        <Box
          onClick={onClick}
          sx={{
            zIndex: 2,
            position: 'absolute',
            display: 'flex',
            height: '18px',
            width: '18px',
            left: -6,
            top: -1,
            boxSizing: 'content-box',
            borderRadius: '18px',
            outlineStyle: 'solid',
            outlineWidth: '2px',
            outlineColor: COLOR_DARK_GRAY_1A1A1A,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: parentColor,
            cursor: 'pointer',
            padding: '0px',
          }}
        >
          <Typography sx={{ fontSize: '12px', fontWeight: '600' }}>{parentEmoji}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default AccountAvatar;
