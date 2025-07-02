import { Typography, Card, CardActionArea, CardMedia, CardContent, Box } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';

import type { PostMedia } from '@/ui/utils/url';
import fallback from 'ui/assets/image/errorImage.png';

interface GridViewProps {
  data: any;
  accessible?: any[];
  blockList?: any[];
  index: number;
  ownerAddress: string;
  isAccessibleNft?: boolean;
  fromLinked?: boolean;
  collectionInfo?: any;
  isEvm?: boolean;
  searchTerm?: string;
}

const GridView = (props: GridViewProps) => {
  const {
    data,
    accessible,
    blockList = [],
    index,
    ownerAddress,
    isAccessibleNft = true,
    fromLinked = false,
    collectionInfo,
    isEvm = false,
    searchTerm,
  } = props;

  const [loaded, setLoaded] = useState(false);
  const [isAccessible, setAccessible] = useState(true);
  const [media, setGetMediea] = useState<PostMedia | null>(null);
  const fetchMedia = useCallback(async () => {
    setGetMediea(data.postMedia || data.media);

    if (accessible) {
      accessible.forEach((item) => {
        const parts = item.id.split('.');
        // Check both possible contract name fields
        const contractName = data.contractName || data.collectionContractName;

        if (parts[2] === contractName && item.idList.includes(data.id)) {
          setAccessible(true);
        } else {
          setAccessible(false);
        }
      });
    }
  }, [data, accessible]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const TilteWordWrapped = (desc) => {
    if (!desc) return null;
    if (desc.length < 30) return desc;
    const res = desc.split(' ').reduce((prev, curr) => {
      if (prev.length + curr.length + 1 > 30) return prev;
      return prev + ' ' + curr;
    }, '');
    return res.trim() + '...';
  };

  const replaceIPFS = (url: string | null): string => {
    if (!url) {
      return '';
    }

    const lilicoEndpoint = 'https://gateway.pinata.cloud/ipfs/';

    const replacedURL = url
      .replace('ipfs://', lilicoEndpoint)
      .replace('https://ipfs.infura.io/ipfs/', lilicoEndpoint)
      .replace('https://ipfs.io/ipfs/', lilicoEndpoint)
      .replace('https://lilico.app/api/ipfs/', lilicoEndpoint);

    return replacedURL;
  };

  const getUri = () => {
    return (
      <>
        {loaded ? (
          <div />
        ) : (
          <div
            style={{
              background: '#222222',
              height: '100%',
              width: '100%',
              borderRadius: '8px',
            }}
          />
        )}

        {media &&
          (media.image ? (
            <img
              src={replaceIPFS(media.image)}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                margin: '0 auto',
                objectFit: 'cover',
              }}
              onLoad={() => setLoaded(true)}
              onError={({ currentTarget }) => {
                currentTarget.onerror = null; // prevents looping
                currentTarget.src = fallback;
              }}
            />
          ) : (
            <>
              <video
                loop
                autoPlay
                muted
                preload="auto"
                onLoadedData={() => setLoaded(true)}
                style={{
                  margin: '0 auto',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              >
                <source src={replaceIPFS(media.video)} type="video/mp4" />
              </video>
            </>
          ))}
      </>
    );
  };

  // Determine the correct path and state based on NFT type
  const detailPath = isEvm
    ? `/dashboard/nftevm/detail/${index}`
    : `/dashboard/nested/${fromLinked ? 'linkednftdetail' : 'nftdetail'}/${index}`;

  const navigateState = {
    nft: data,
    media: media,
    index: index,
    ownerAddress: ownerAddress,
  };

  // Handle navigation state saving for both NFT types
  const navigateWithState = () => {
    const state: Record<string, any> = {
      nft: data,
      media: media,
      index: index,
      ownerAddress: ownerAddress,
      isAccessibleNft,
    };

    // Only add collectionInfo if it's available
    if (collectionInfo) {
      state.collectionInfo = collectionInfo;
    }

    // Save search term if available
    if (searchTerm) {
      state.searchTerm = searchTerm;
    }

    localStorage.setItem('nftDetailState', JSON.stringify(state));
  };

  return (
    <Card
      sx={{
        flex: '0 0 50%',
        backgroundColor: 'inherit',
        boxShadow: 'none',
        margin: 0,
        borderRadius: '8px',
        padding: '8px',
        display: 'inline-block',
        '&:hover': {
          color: '#222222',
          backgroundColor: '#222222',
        },
      }}
      elevation={0}
    >
      <CardActionArea
        component={Link}
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '8px',
          '&:hover': {
            color: '#222222',
            backgroundColor: '#222222',
          },
        }}
        to={detailPath}
        onClick={navigateWithState}
      >
        <CardMedia
          sx={{
            height: '159px',
            width: '100%',
            overflow: 'hidden',
            justifyContent: 'center',
          }}
        >
          {getUri()}
        </CardMedia>
        <CardContent
          sx={{
            padding: '5px 0',
            backgroundColor: 'inherit',
            borderRadius: '0 0 8px 8px',
          }}
        >
          <Typography
            sx={{
              color: '#E6E6E6',
              fontSize: '14px',
              fontWeight: '700',
            }}
          >
            {TilteWordWrapped(media?.title || data?.name) || ''}
            {!isAccessibleNft && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  color: 'neutral.text',
                  marginTop: '2px',
                  fontSize: '10px',
                  fontFamily: 'Inter, sans-serif',
                  backgroundColor: 'neutral1.light',
                }}
              >
                {chrome.i18n.getMessage('Inaccessible')}
              </Box>
            )}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default GridView;
