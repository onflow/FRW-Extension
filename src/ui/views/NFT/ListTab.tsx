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
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/system';
import React, { forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { type NFTCollections } from '@/shared/types/nft-types';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useWallet } from '@/ui/utils/WalletContext';
import placeholder from 'ui/FRWAssets/image/placeholder.png';

import EmptyStatus from '../EmptyStatus';

interface ListTabProps {
  data: any;
  setCount: (count: any) => void;
  accessible: any;
  isActive: boolean;
  activeCollection: any;
}

interface State {
  collectionLoading: boolean;
  collections: NFTCollections[];
  isCollectionEmpty: boolean;
  ownerAddress: string;
}

const useStyles = makeStyles(() => ({
  collectionContainer: {
    width: '100%',
    justifyContent: 'center',
    padding: '0 8px',
  },
  collectionCard: {
    display: 'flex',
    width: '100%',
    height: '64px',
    margin: '12px auto',
    boxShadow: 'none',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
  },
  skeletonCard: {
    display: 'flex',
    width: '100%',
    height: '72px',
    margin: '12px auto',
    boxShadow: 'none',
    padding: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
  },
  collectionImg: {
    borderRadius: '12px',
    width: '48px',
    padding: '8px',
  },
  arrow: {
    position: 'absolute',
    top: 0,
  },
  actionarea: {
    width: '100%',
    height: '100%',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
}));

const ListTab = forwardRef((props: ListTabProps, ref) => {
  const history = useHistory();
  const classes = useStyles();
  const usewallet = useWallet();
  const { currentWallet } = useProfiles();
  const [state, setState] = useState<State>({
    collectionLoading: true,
    collections: [],
    isCollectionEmpty: true,
    ownerAddress: '',
  });

  const fetchLatestCollection = useCallback(
    async (address: string) => {
      if (!address) return;

      try {
        const list = await usewallet.refreshCollection(address);
        setState((prev) => ({
          ...prev,
          collectionLoading: false,
          collections: list || [],
          isCollectionEmpty: !list || list.length === 0,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          collectionLoading: false,
          collections: [],
          isCollectionEmpty: true,
        }));
      }
    },
    [usewallet]
  );

  const fetchCollectionCache = useCallback(
    async (address: string) => {
      if (!address || address === state.ownerAddress) return;

      try {
        setState((prev) => ({ ...prev, collectionLoading: true, ownerAddress: address }));

        const list = await usewallet.getCollectionCache(address);

        if (list && list.length > 0) {
          setState((prev) => ({
            ...prev,
            collections: list,
            isCollectionEmpty: false,
            collectionLoading: false,
          }));
        } else {
          await fetchLatestCollection(address);
        }
      } catch (error) {
        await fetchLatestCollection(address);
      }
    },
    [fetchLatestCollection, usewallet, state.ownerAddress]
  );

  useEffect(() => {
    const newAddress = currentWallet.address;
    let mounted = true;

    if (newAddress && newAddress !== state.ownerAddress) {
      fetchCollectionCache(newAddress).then(() => {
        if (!mounted) return;
      });
    }

    return () => {
      mounted = false;
    };
  }, [currentWallet, state.ownerAddress, fetchCollectionCache]);

  useImperativeHandle(
    ref,
    () => ({
      reload: () => {
        usewallet.clearNFTCollection();
        setState((prev) => ({
          ...prev,
          collections: [],
          collectionLoading: true,
        }));
        if (state.ownerAddress) {
          fetchLatestCollection(state.ownerAddress);
        }
      },
    }),
    [usewallet, fetchLatestCollection, state.ownerAddress]
  );

  const extractContractAddress = (collection) => {
    return collection.split('.')[2];
  };

  const checkContractAddressInCollections = (nft) => {
    if (props.isActive) {
      return true;
    }
    const contractAddressWithout0x = nft.collection.contract_name;
    const isActiveCollect = props.activeCollection.some((collection) => {
      const extractedAddress = extractContractAddress(collection);
      if (extractedAddress === contractAddressWithout0x) {
        console.log('nft is ', contractAddressWithout0x, extractedAddress);
      }
      return extractedAddress === contractAddressWithout0x;
    });
    return isActiveCollect;
  };

  const CollectionView = (data) => {
    const handleClick = () => {
      history.push({
        pathname: `/dashboard/nested/collectiondetail/${data.ownerAddress}.${data.contract_name}.${data.count}`,
        state: {
          collection: data,
          ownerAddress: data.ownerAddress,
          accessible: props.accessible,
        },
      });
    };
    return (
      <Card
        sx={{ borderRadius: '12px', backgroundColor: '#000000' }}
        className={classes.collectionCard}
      >
        <CardActionArea
          sx={{
            borderRadius: '12px',
            paddingRight: '8px',
          }}
          className={classes.actionarea}
          onClick={data.isAccessible && handleClick}
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
                  {data.isAccessible ? (
                    <Typography
                      variant="body1"
                      sx={{ fontSize: '14px' }}
                      color="#B2B2B2"
                      component="div"
                    >
                      {data.count} {chrome.i18n.getMessage('collectibles')}
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
    const isAccessible = checkContractAddressInCollections(props);
    return (
      <CollectionView
        name={props.collection ? props.collection.name : props.name}
        logo={props.collection ? props.collection.logo : props.logo}
        key={props.collection ? props.collection.name : props.name}
        count={props.count}
        index={index}
        contract_name={props.collection ? props.collection.id : props.id}
        ownerAddress={state.ownerAddress}
        isAccessible={isAccessible}
      />
    );
  };

  return (
    <Container className={classes.collectionContainer}>
      {state.collectionLoading ? (
        // Just show an empty box.. it's better that a skeleton
        <Box height={249}></Box>
      ) : state.isCollectionEmpty ? (
        <EmptyStatus />
      ) : (
        state.collections.map(createListCard)
      )}
    </Container>
  );
});

export default React.memo(ListTab);
