import {
  Typography,
  Box,
  Card,
  CardActionArea,
  CardMedia,
  CardActions,
  IconButton,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router';

import rightarrow from '@/ui/assets/svg/rightarrow.svg';
import {
  COLOR_ACCENT_EVM_627EEA,
  COLOR_DARKMODE_BACKGROUND_CARDS_1A1A1A,
  COLOR_DARKMODE_TEXT_PRIMARY_FFFFFF,
  COLOR_GREEN_FLOW_DARKMODE_00EF8B,
} from '@/ui/style/color';

export const EnableEvmAccountCard = ({
  onEnableEvmClick,
  showCard = false,
}: {
  onEnableEvmClick: () => void;
  showCard: boolean;
}) => {
  const navigate = useNavigate();

  const gradientStyle: React.CSSProperties = {
    background: `linear-gradient(92deg, ${COLOR_GREEN_FLOW_DARKMODE_00EF8B} 63.42%, ${COLOR_ACCENT_EVM_627EEA} 91.99%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline',
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: 600,
    letterSpacing: '0.1px',
  };

  return (
    <Card
      sx={{
        display: 'flex',
        paddingLeft: '8px',
        paddingRight: '16px',
        paddingTop: '10px',
        paddingBottom: '10px',
        borderRadius: '16px',
        backgroundColor: showCard ? COLOR_DARKMODE_BACKGROUND_CARDS_1A1A1A : 'transparent',
        overflow: 'hidden',
        maxWidth: '500px',
      }}
      elevation={showCard ? 1 : 0}
    >
      <CardActionArea
        sx={{
          borderRadius: '12px',
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          paddingY: '8px',
          paddingLeft: '8px',
          paddingRight: '8px',
          cursor: 'pointer',
        }}
        onClick={onEnableEvmClick}
      >
        <Box>
          <Typography
            sx={{
              color: COLOR_DARKMODE_TEXT_PRIMARY_FFFFFF,
              fontSize: '12px',
              fontStyle: 'normal',
              fontWeight: 600,
              letterSpacing: '0.1px',
            }}
          >
            {chrome.i18n.getMessage('path_to_enable')}{' '}
            <span style={gradientStyle}>{chrome.i18n.getMessage('EVM_on_flow')}</span> !
          </Typography>
          <Typography
            sx={{
              color: ' rgba(255, 255, 255, 0.80)',
              fontSize: '10px',
              fontStyle: 'normal',
              fontWeight: 400,
              letterSpacing: '0.1px',
            }}
          >
            {chrome.i18n.getMessage('manage_multi_assets_seamlessly')}
          </Typography>
        </Box>

        <CardMedia
          sx={{
            width: '20px',
            height: '20px',
            display: 'block',
            marginLeft: '6px',
            padding: '0px',
          }}
          image={rightarrow}
        />
      </CardActionArea>
    </Card>
  );
};
