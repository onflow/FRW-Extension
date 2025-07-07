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

import IconFlow from '@/ui/components/iconfont/IconFlow';

import { type CollectionItem } from './AddList';

const CollectionCard = ({
  item,
  setAlertOpen,
  isLoading,
  onClick,
}: {
  item: CollectionItem;
  setAlertOpen: (open: boolean) => void;
  isLoading: boolean;
  onClick: (item: CollectionItem) => void;
}) => {
  const {
    name,
    description,
    extensions: { website: officialWebsite },
    logoURI: logo,
    added,
  } = item || {};
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
        height: '84px',
        boxShadow: 'none',
        marginTop: '8px',
        alignItems: 'center',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <CardActionArea
        sx={{
          height: '100%',
          padding: '8px 4px',
          backgroundColor: 'transparent',
          display: 'flex',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          overflow: 'hidden',
        }}
        onClick={() => officialWebsite && window.open(officialWebsite, '_blank')}
      >
        {logo ? (
          <CardMedia
            component="img"
            sx={{
              width: '48px',
              height: '48px',
              marginLeft: '4px',
              marginRight: '4px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            }}
            image={logo}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://www.google.com/s2/favicons?sz=256&domain_url=${officialWebsite}`;
            }}
          />
        ) : (
          <Box
            sx={{
              width: '48px',
              height: '48px',
              marginLeft: '4px',
              marginRight: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
            }}
          />
        )}
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: '8px',
            paddingRight: '8px',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              height: '100%',
              width: '100%',
              flexDirection: 'column',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Typography
                component="div"
                color="#fff"
                sx={{
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '26px',
                  textWrapMode: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
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
                  sx={{
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '18px',
                    width: '200px',
                    overflow: 'hidden',
                  }}
                >
                  {getDescriptionWordWrapped(description)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardActionArea>

      <IconButton
        sx={{
          maxHeight: 'fit-content',
          maxWidth: 'fit-content',
        }}
        onClick={(event) => {
          event.stopPropagation();
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
            <AddIcon sx={{ fontSize: '20px', color: 'white' }} />
          )}
        </Box>
      </IconButton>
    </Card>
  );
};

export default CollectionCard;
