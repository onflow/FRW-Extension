import { Box, Typography, Switch } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

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
}) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        margin: '10px auto',
        backgroundColor: theme.palette.background.paper,
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
          sx={{ color: theme.palette.text.secondary, fontSize: '16px', fontWeight: 400 }}
        >
          {label}
        </Typography>
        <Switch checked={checked} onChange={onChange} disabled={disabled} />
      </Box>
    </Box>
  );
};

export default SettingsSwitchCard;
