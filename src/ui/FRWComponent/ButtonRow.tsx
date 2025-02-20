import { Box } from '@mui/material';
import React from 'react';

import buyIcon from '@/ui/FRWAssets/svg/buyIcon.svg';
import moveIcon from '@/ui/FRWAssets/svg/homeMove.svg';
import receiveIcon from '@/ui/FRWAssets/svg/receiveIcon.svg';
import sendIcon from '@/ui/FRWAssets/svg/sendIcon.svg';
import swapIcon from '@/ui/FRWAssets/svg/swapIcon.svg';

import { IconButton } from './IconButton';

interface ButtonRowProps {
  isActive?: boolean;
  onSendClick: () => void;
  onReceiveClick: () => void;
  onSwapClick: () => void;
  onBuyClick: () => void;
  onMoveClick: () => void;
  canMoveChild?: boolean;
}

export const ButtonRow: React.FC<ButtonRowProps> = ({
  onSendClick,
  onReceiveClick,
  onSwapClick,
  onBuyClick,
  onMoveClick,
  canMoveChild = true,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        px: '24px',
        pb: '16px',
        pt: '8px',
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      <IconButton messageKey="Send" onClick={onSendClick} icon={sendIcon} />
      <IconButton messageKey="Receive" onClick={onReceiveClick} icon={receiveIcon} />
      <IconButton messageKey="Swap" onClick={onSwapClick} icon={swapIcon} />
      <IconButton messageKey="Buy" onClick={onBuyClick} icon={buyIcon} />
      {canMoveChild && <IconButton messageKey="Move" onClick={onMoveClick} icon={moveIcon} />}
    </Box>
  );
};
