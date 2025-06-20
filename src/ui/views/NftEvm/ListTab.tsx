import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  Typography,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Container,
  Grid,
  Skeleton,
} from '@mui/material';
import { Box } from '@mui/system';
import React, { forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import ListSkeleton from '@/ui/components/NFTs/ListSkeleton';
import { useWallet } from '@/ui/utils/WalletContext';
import placeholder from 'ui/assets/image/placeholder.png';

import EmptyStatus from '../EmptyStatus';

interface ListTabProps {
  data: any;
  setCount: (count: any) => void;
  accessible: any;
  isActive: boolean;
}

const ListTab = forwardRef((props: ListTabProps, ref) => {
  const { accessible, setCount, data } = props;
  const history = useHistory();
  const usewallet = useWallet();
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [collections, setCollections] = useState<any[]>([]);
  const [isCollectionEmpty, setCollectionEmpty] = useState(true);
  const [accesibleArray, setAccessible] = useState([{ id: '' }]);
  const [ownerAddress, setAddress] = useState('');

  const fetchLatestCollection = useCallback(
    async (addr: string) => {
      try {
        setCollectionLoading(true);
        const list = await usewallet.getEvmNftId(addr);
        if (list && list.length > 0) {
          setCollectionEmpty(false);
          setCollections(list);
          const count = list.reduce((acc, item) => acc + item.count, 0);
          setCount(count);
        } else {
          setCollectionEmpty(true);
        }
      } catch (err) {
        setCollectionEmpty(true);
      } finally {
        setCollectionLoading(false);
      }
    },
    [usewallet, setCount]
  );

  // Only fetch when ownerAddress changes
  useEffect(() => {
    if (data.ownerAddress && data.ownerAddress !== ownerAddress) {
      setAddress(data.ownerAddress);
      setAccessible(accessible);
      fetchLatestCollection(data.ownerAddress);
    }
  }, [data.ownerAddress, accessible, ownerAddress, fetchLatestCollection]);

  // Expose reload method through ref
  useImperativeHandle(ref, () => ({
    reload: async () => {
      if (ownerAddress) {
        try {
          setCollectionLoading(true);
          const list = await usewallet.getEvmNftId(ownerAddress);
          if (list && list.length > 0) {
            setCollectionEmpty(false);
            setCollections(list);
            const count = list.reduce((acc, item) => acc + item.count, 0);
            setCount(count);
          } else {
            setCollectionEmpty(true);
          }
        } catch (err) {
          setCollectionEmpty(true);
        } finally {
          setCollectionLoading(false);
        }
      }
    },
  }));

  const CollectionView = (data) => {
    const handleClick = () => {
      history.push({
        pathname: `/dashboard/nested/evm/collectiondetail/${data.ownerAddress}.${data.contract_name}.${data.count}`,
        state: {
          collection: data,
          ownerAddress: data.ownerAddress,
          accessible: accessible,
        },
      });
    };
    return (
      <Card
        sx={{
          borderRadius: '12px',
          backgroundColor: '#000000',
          display: 'flex',
          width: '100%',
          height: '64px',
          margin: '12px auto',
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
          onClick={handleClick}
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
              image={data.logo || placeholder}
              alt={data.name}
            />
            <CardContent sx={{ flex: '1 0 auto', padding: '8px 4px' }}>
              <Grid container justifyContent="space-between" alignItems="center" sx={{ pr: 2 }}>
                <Grid item sx={{ flex: 1 }}>
                  <Typography component="div" variant="body1" color="#fff" sx={{ mb: 0 }}>
                    {data.name}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontSize: '14px' }}
                    color="#B2B2B2"
                    component="div"
                  >
                    {data.count} {chrome.i18n.getMessage('collectibles')}
                  </Typography>
                </Grid>
                <Grid item>
                  <ArrowForwardIcon color="primary" />
                </Grid>
              </Grid>
            </CardContent>
          </Box>
        </CardActionArea>
      </Card>
    );
  };

  const createListCard = (props, index) => {
    return (
      <CollectionView
        name={props.collection ? props.collection.name : props.name}
        logo={props.collection ? props.collection.logo : props.logo}
        key={props.collection ? props.collection.name : props.name}
        count={props.count}
        index={index}
        contract_name={props.collection ? props.collection.id : props.id}
        ownerAddress={ownerAddress}
      />
    );
  };

  return (
    <Container
      sx={{
        width: '100%',
        justifyContent: 'center',
        padding: '0 8px',
      }}
    >
      {collectionLoading ? (
        <ListSkeleton />
      ) : isCollectionEmpty ? (
        <EmptyStatus />
      ) : (
        collections.map(createListCard)
      )}
    </Container>
  );
});

export default ListTab;
