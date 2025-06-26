import { Box, Typography, Switch } from '@mui/material';
import React from 'react';

import { COLOR_WHITE_ALPHA_40_FFFFFF66, COLOR_WHITE_ALPHA_80_FFFFFFCC } from '@/ui/style/color';

interface SettingsSwitchCardProps {
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const SettingsSwitchCard: React.FC<SettingsSwitchCardProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => (
  <Box
    sx={{
      margin: '10px auto',
      backgroundColor: '#282828',
      padding: '18px',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '16px',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: '0px',
    }}
  >
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography
        variant="body1"
        sx={{ color: COLOR_WHITE_ALPHA_80_FFFFFFCC, fontSize: '16px', fontWeight: 400 }}
      >
        {label}
      </Typography>
      <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </Box>
  </Box>
);

export default SettingsSwitchCard;
