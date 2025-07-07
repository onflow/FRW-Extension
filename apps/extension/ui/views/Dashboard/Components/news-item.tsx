import CloseIcon from '@mui/icons-material/Close';
import { Card, CardContent, CardMedia, IconButton, Typography, Box, Tooltip } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

import type { NewsItem } from '@/shared/types/network-types';
import { useNews } from '@/ui/hooks/use-news';
import { openInTab } from '@/ui/utils/webapi';

export const NewsItemCard = ({ item }: { item: NewsItem }) => {
  const { dismissNews, markAsRead } = useNews();
  const cardRef = useRef<HTMLDivElement>(null);
  const [, setItemIsRead] = useState(false);
  const [, setIsDismissed] = useState(false);

  // Handle auto-dismiss for 'once' display type, and mark as read for other display type
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    // Check if the item is visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          timeoutId = setTimeout(() => {
            setItemIsRead(true);
            if (item.displayType === 'once') {
              dismissNews(item.id);
              setIsDismissed(true);
            } else {
              markAsRead(item.id);
            }
          }, 2000);
        } else {
          clearTimeout(timeoutId);
        }
      });
    });

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [item.id, dismissNews, markAsRead, item.displayType]);

  // Check if item is expired
  const isExpired = item.expiryTime && new Date(item.expiryTime) < new Date();

  // Don't render if expired
  if (isExpired) return null;

  // Render image-type news item
  if (item.type === 'image') {
    return (
      <Card
        ref={cardRef}
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        <CardMedia
          component="img"
          src={item.image}
          alt={item.title || ''}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </Card>
    );
  }

  // Render message-type news item
  return (
    <Card
      ref={cardRef}
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        height: '100%',
        position: 'relative',
      }}
    >
      {item.displayType === 'click' && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            dismissNews(item.id);
            setIsDismissed(true);
          }}
          sx={{
            position: 'absolute',
            right: '12px',
            top: '12px',
            color: 'text.secondary',
          }}
        >
          <CloseIcon />
        </IconButton>
      )}

      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '16px',
        }}
      >
        {item.icon && (
          <CardMedia
            component="img"
            src={item.icon}
            alt=""
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              flexShrink: 0,
              marginRight: '12px',
            }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0, pr: 4 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 500,
              mb: 0.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.title}
          </Typography>
          {item.body && (
            <Tooltip title={item.body} arrow enterDelay={500}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: item.url ? 'pointer' : 'default',
                }}
                onClick={item.url ? () => item.url && openInTab(item.url) : undefined}
              >
                {item.body}
              </Typography>
            </Tooltip>
          )}
          {item.url && !item.body && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <Box
                component="span"
                onClick={() => item.url && openInTab(item.url)}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': {
                    color: 'success.dark',
                  },
                }}
              >
                View More
              </Box>
              )
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
