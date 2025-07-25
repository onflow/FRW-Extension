import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

interface SlidingTabSwitchProps {
  value: string;
  onChange: (val: string) => void;
  leftLabel?: string;
  rightLabel?: string;
  leftValue?: string;
  rightValue?: string;
}

const SlidingTabSwitch: React.FC<SlidingTabSwitchProps> = ({
  value,
  onChange,
  leftLabel = 'Collections',
  rightLabel = 'Coins',
  leftValue = 'one',
  rightValue = 'two',
}) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        background: theme.palette.background.card,
        borderRadius: '20px',
        p: '3px',
        width: '100%',
        position: 'relative',
        height: 40,
        mb: 2,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 3,
          left: value === leftValue ? 3 : 'calc(50% + 3px)',
          width: 'calc(50% - 6px)',
          height: 34,
          background: theme.palette.action.selected,
          borderRadius: '17px',
          transition: 'left 0.2s',
          zIndex: 1,
        }}
      />
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            flex: 1,
            textAlign: 'center',
            cursor: 'pointer',
            color: value === leftValue ? theme.palette.text.primary : theme.palette.text.secondary,
            fontWeight: 600,
            lineHeight: '34px',
            fontSize: '12px',
            userSelect: 'none',
          }}
          onClick={() => onChange(leftValue)}
        >
          {leftLabel}
        </Box>
        <Box
          sx={{
            flex: 1,
            textAlign: 'center',
            cursor: 'pointer',
            color: value === rightValue ? theme.palette.text.primary : theme.palette.text.secondary,
            fontWeight: 600,
            lineHeight: '34px',
            fontSize: '12px',
            userSelect: 'none',
          }}
          onClick={() => onChange(rightValue)}
        >
          {rightLabel}
        </Box>
      </Box>
    </Box>
  );
};

export default SlidingTabSwitch;
