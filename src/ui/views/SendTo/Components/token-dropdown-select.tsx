import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Button, Typography } from '@mui/material';
import React from 'react';

import { type ExtendedTokenInfo } from '@onflow/frw-shared/types';

import IconCheckmark from '@/ui/components/iconfont/IconCheckmark';

interface TokenDropdownSelectProps {
  token: ExtendedTokenInfo;
  onClick: () => void;
}

const TokenDropdownSelect: React.FC<TokenDropdownSelectProps> = ({ token, onClick }) => {
  return (
    <Button
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        padding: '3px 9px 3px 10px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '39px',
        color: '#FFFFFF',
        textTransform: 'none',
        minWidth: 'auto',
        height: '30px',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        },
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: '#FFFFFF',
          fontWeight: 600,
          fontSize: '12px',
          letterSpacing: '-0.072px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {token.symbol}
      </Typography>
      {token.isVerified && <IconCheckmark color="#41CC5D" size={10} />}
      <KeyboardArrowDownIcon
        sx={{
          color: '#FFFFFF',
          fontSize: '14px',
          marginLeft: token.isVerified ? '8.556px' : '0px',
        }}
      />
    </Button>
  );
};

export default TokenDropdownSelect;
