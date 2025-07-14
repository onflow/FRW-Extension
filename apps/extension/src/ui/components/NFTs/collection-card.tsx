import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import React from 'react';
import { useNavigate } from 'react-router';

import placeholder from '@/ui/assets/image/placeholder.png';

export const CollectionCard = ({
  name,
  logo,
  count,
  index,
  contractName,
  ownerAddress,
  isAccessible,
}: {
  name: string;
  logo: string;
  count: number;
  index: number;
  contractName: string;
  ownerAddress: string;
  isAccessible: boolean;
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/dashboard/nested/collectiondetail/${ownerAddress}.${contractName}.${count}`, {
      state: {
        collection: {
          name,
          logo,
          count,
          index,
          contract_name: contractName,
          ownerAddress,
          isAccessible,
        },
        ownerAddress,
        accessible: isAccessible,
      },
    });
  };
  return (
    <Card
      key={name}
      sx={{
        borderRadius: '12px',
        backgroundColor: '#000000',
        display: 'flex',
        width: '100%',
        height: '64px',
        boxShadow: 'none',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <CardActionArea
        sx={{
          borderRadius: '12px',
          paddingRight: '8px',
          width: '100%',
          height: '100%',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        }}
        onClick={isAccessible ? handleClick : undefined}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          <CardMedia
            component="img"
            sx={{
              width: '48px',
              height: '48px',
              padding: '8px',
              borderRadius: '12px',
              justifyContent: 'center',
              mt: '8px',
            }}
            image={logo || placeholder}
            alt={name}
          />
          <CardContent sx={{ flex: '1 0 auto', padding: '8px 4px' }}>
            <Grid container justifyContent="space-between" alignItems="center" sx={{ pr: 2 }}>
              <Grid sx={{ flex: 1 }}>
                <Typography component="div" variant="body1" color="#fff" sx={{ mb: 0 }}>
                  {name}
                </Typography>
                {isAccessible ? (
                  <Typography
                    variant="body1"
                    sx={{ fontSize: '14px' }}
                    color="#B2B2B2"
                    component="div"
                  >
                    {count} {chrome.i18n.getMessage('collectibles')}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      color: 'neutral.text',
                      fontSize: '10px',
                      width: '80px',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {chrome.i18n.getMessage('Inaccessible')}
                  </Box>
                )}
              </Grid>
              <Grid>
                <ArrowForwardIcon color="primary" />
              </Grid>
            </Grid>
          </CardContent>
        </Box>
      </CardActionArea>
    </Card>
  );
};
