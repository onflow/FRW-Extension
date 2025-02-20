import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DoneIcon from '@mui/icons-material/Done';
import {
  Typography,
  Box,
  Card,
  CardActionArea,
  CardMedia,
  IconButton,
  CircularProgress,
} from '@mui/material';
import React from 'react';

import IconFlow from '../../../../components/iconfont/IconFlow';

import { type CollectionItem } from './AddList';

const CollectionCard = ({
  item,
  setAlertOpen,
  isLoading,
  onClick,
}: {
  item: CollectionItem;
  setAlertOpen: any;
  isLoading: boolean;
  onClick: any;
}) => {
  const { name, description, official_website: officialWebsite, logo, added } = item || {};
  const getDescriptionWordWrapped = (desc) => {
    if (desc.length < 60) return desc;
    const res = desc.split(' ').reduce((prev, curr) => {
      if (prev.length + curr.length + 1 > 60) return prev;
      return prev + ' ' + curr;
    }, '');
    return res.trim() + '...';
  };
  return (
    <Card
      sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        width: '100%',
        height: '64px',
        boxShadow: 'none',
        marginTop: '8px',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      {logo && (
        <Box
          sx={{
            width: '48px',
            height: '100%',
            display: 'flex',
            padding: '8px',
          }}
        >
          <CardMedia
            component="img"
            sx={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              objectFit: 'cover',
            }}
            image={logo}
          />
        </Box>
      )}
      <CardActionArea
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          padding: '8px 4px',
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: '8px',
            paddingRight: '8px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              height: '100%',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Typography
                component="div"
                color="#fff"
                sx={{ fontWeight: 600, fontSize: '16px', lineHeight: '26px' }}
                onClick={() => officialWebsite && window.open(officialWebsite, '_blank')}
              >
                {name}
              </Typography>
              <Box sx={{ marginLeft: '6px' }}>
                <IconFlow size={14} />
              </Box>
              <ArrowForwardIcon sx={{ color: '#FFFFFF', fontSize: '12px', marginLeft: '5px' }} />
            </Box>
            {description && (
              <Box sx={{ alignItems: 'center', height: '36px' }}>
                <Typography
                  color="#5E5E5E"
                  component="div"
                  sx={{ fontWeight: 400, fontSize: '12px', lineHeight: '18px', width: '200px' }}
                >
                  {getDescriptionWordWrapped(description)}
                </Typography>
              </Box>
            )}
          </Box>

          <IconButton
            onClick={() => {
              if (!added && !isLoading) onClick(item);
            }}
          >
            <Box
              sx={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: added ? '#FFFFFF' : 'black',
                padding: '2px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {isLoading ? (
                <CircularProgress color="primary" size={24} />
              ) : added ? (
                <DoneIcon sx={{ color: 'black', fontSize: '20px' }} />
              ) : (
                <AddIcon
                  sx={{ fontSize: '20px', color: 'white' }}
                  onClick={() => {
                    if (!added && !isLoading) {
                      setAlertOpen(true);
                    }
                  }}
                />
              )}
            </Box>
          </IconButton>
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default CollectionCard;
