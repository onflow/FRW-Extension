import { Box, CircularProgress, IconButton, Skeleton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import React from 'react';

import { FlowIcon } from '@/ui/assets/icons/FlowIcon';
import { COLOR_DARK_GRAY_1A1A1A, networkColor } from '@/ui/style/color';
import { isEmoji } from '@/ui/utils';

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

const Icon = ({ icon, isPending }: { icon?: string; isPending?: boolean }) => {
  if (isPending) {
    return <FlowIcon width={36} height={36} showWhiteBackground />;
  }
  if (!icon) {
    return <Skeleton variant="circular" width="36px" height="36px" />;
  }

  if (isEmoji(icon)) {
    return <EmojiIcon emoji={icon} />;
  }
  return <ImageIcon image={icon} />;
};

/**
 * An Account Avatar component that displays an emoji and a parent emoji.
 * It also displays a spinning indicator if the account has a pending transaction.
 * It also displays a border if the account is active.
 * It also displays a pending transaction indicator if the account has a pending transaction.
 * @param network - The network of the account.
 * @param emoji - The emoji of the account.
 * @param color - The color of the account.
 * @param parentEmoji - The emoji of the parent account.
 * @param parentColor - The color of the parent account.
 * @param active - Whether the account is active.
 * @param spinning - Whether the account is spinning.
 * @param onClick - The function to call when the account is clicked.
 * @param isPending - Whether this account is pending creation (is in the process of being created).
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
  isPending = false,
}: {
  network?: string;
  emoji?: string;
  color?: string;
  parentEmoji?: string;
  parentColor?: string;
  active?: boolean;
  spinning?: boolean;
  onClick?: () => void;
  isPending?: boolean;
}) => {
  const loading = !network || (!isPending && (!emoji || !color));
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
          <Icon icon={emoji} isPending={isPending} />
        </IconButton>
      )}
      {!onClick && (
        <Box sx={sxProps}>
          <Icon icon={emoji} isPending={isPending} />
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
