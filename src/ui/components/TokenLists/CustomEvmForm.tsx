import { Typography, Box, Stack } from '@mui/material';
import React from 'react';

const CustomEvmForm = ({ coinInfo }) => {
  const renderContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', marginBottom: '50px' }}>
      <Box
        sx={{
          height: '1px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
          marginY: '16px',
        }}
      ></Box>
      <Stack spacing={2} sx={{ flexGrow: 1 }}>
        <Box sx={{ width: '100%' }}>
          <Typography
            sx={{
              color: 'var(--Basic-foreground-White, var(--Basic-foreground-White, #FFF))',
              fontFamily: 'Inter',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 700,
              lineHeight: '24px',
              letterSpacing: '-0.084px',
            }}
          >
            Token Name
          </Typography>
          <Box
            sx={{
              color:
                'var(--Basic-foreground-White-4-text, var(--White-4, rgba(255, 255, 255, 0.40)))',
              fontFamily: 'Inter',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: '24px', // 171.429%
              letterSpacing: '-0.084px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.40)',
              borderRadius: '16px',
              marginTop: '8px',
            }}
          >
            <Typography
              sx={{
                color:
                  'var(--Basic-foreground-White-4-text, var(--White-4, rgba(255, 255, 255, 0.40)))',
              }}
            >
              {coinInfo.coin}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: '100%' }}>
          <Typography
            sx={{
              color: 'var(--Basic-foreground-White, var(--Basic-foreground-White, #FFF))',
              fontFamily: 'Inter',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 700,
              lineHeight: '24px',
              letterSpacing: '-0.084px',
            }}
          >
            Token Symbol
          </Typography>
          <Box
            sx={{
              color:
                'var(--Basic-foreground-White-4-text, var(--White-4, rgba(255, 255, 255, 0.40)))',
              fontFamily: 'Inter',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: '24px', // 171.429%
              letterSpacing: '-0.084px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.40)',
              borderRadius: '16px',
              marginTop: '8px',
            }}
          >
            <Typography
              sx={{
                color:
                  'var(--Basic-foreground-White-4-text, var(--White-4, rgba(255, 255, 255, 0.40)))',
              }}
            >
              {coinInfo.unit}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ width: '100%' }}>
          <Typography
            sx={{
              color: 'var(--Basic-foreground-White, var(--Basic-foreground-White, #FFF))',
              fontFamily: 'Inter',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 700,
              lineHeight: '24px',
              letterSpacing: '-0.084px',
            }}
          >
            Token Decimal
          </Typography>
          <Box
            sx={{
              color:
                'var(--Basic-foreground-White-4-text, var(--White-4, rgba(255, 255, 255, 0.40)))',
              fontFamily: 'Inter',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: '24px', // 171.429%
              letterSpacing: '-0.084px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.40)',
              borderRadius: '16px',
              marginTop: '8px',
            }}
          >
            <Typography
              sx={{
                color:
                  'var(--Basic-foreground-White-4-text, var(--White-4, rgba(255, 255, 255, 0.40)))',
              }}
            >
              {coinInfo.decimals}
            </Typography>
          </Box>
        </Box>

        {coinInfo.flowIdentifier && (
          <Box sx={{ width: '100%' }}>
            <Typography
              sx={{
                color: 'var(--Basic-foreground-White, var(--Basic-foreground-White, #FFF))',
                fontFamily: 'Inter',
                fontSize: '14px',
                fontStyle: 'normal',
                fontWeight: 700,
                lineHeight: '24px',
                letterSpacing: '-0.084px',
              }}
            >
              Flow Identifier
            </Typography>
            <Box
              sx={{
                fontFamily: 'Inter',
                fontSize: '14px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '24px', // 171.429%
                letterSpacing: '-0.084px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.40)',
                borderRadius: '16px',
                marginTop: '8px',
              }}
            >
              <Typography
                sx={{
                  color:
                    'var(--Basic-foreground-White-4-text, var(--White-4, rgba(255, 255, 255, 0.40)))',
                }}
              >
                {coinInfo.flowIdentifier}
              </Typography>
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );

  return <Box>{renderContent()}</Box>;
};

export default CustomEvmForm;
