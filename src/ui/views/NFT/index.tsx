import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  Button,
  Box,
  Container,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Grid,
  Typography,
  Skeleton,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { useProfiles } from '@/ui/hooks/useProfileHook';
import placeholder from 'ui/FRWAssets/image/placeholder.png';
import { useWallet } from 'ui/utils';

import EmptyStatus from '../EmptyStatus';

import EditNFTAddress from './EditNFTAddress';

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
  actionarea: {
    width: '100%',
    height: '100%',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
}));

interface State {
  collectionLoading: boolean;
  collections: any[];
  isCollectionEmpty: boolean;
  ownerAddress: string;
}

const NFTTab = () => {
  console.log('NFTTab');
  const classes = useStyles();
  const wallet = useWallet();
  const history = useHistory();
  const { currentWallet } = useProfiles();
  const [state, setState] = useState<State>({
    collectionLoading: true,
    collections: [],
    isCollectionEmpty: true,
    ownerAddress: '',
  });

  const [address, setAddress] = useState<string | null>('');
  const [isEdit] = useState<boolean>(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState<boolean>(false);
  const [nftCount, setCount] = useState<number>(0);
  const [accessible, setAccessible] = useState<any>([]);
  const [activeCollection, setActiveCollection] = useState<any>([]);
  const [isActive, setIsActive] = useState(true);
  const [childType, setChildType] = useState<string>('');

  const setCountMemoized = useCallback((count: number) => {
    setCount(count);
  }, []);

  const fetchLatestCollection = useCallback(
    async (address: string) => {
      if (!address) return;

      try {
        const list = await wallet.refreshCollection(address);
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
    [wallet]
  );

  const fetchCollectionCache = useCallback(
    async (address: string) => {
      if (!address || address === state.ownerAddress) return;

      try {
        setState((prev) => ({ ...prev, collectionLoading: true, ownerAddress: address }));

        const list = await wallet.getCollectionCache(address);

        if (list && list.length > 0) {
          const count = list.reduce((acc, item) => acc + item.count, 0);
          setCountMemoized(count);
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
    [fetchLatestCollection, wallet, state.ownerAddress, setCountMemoized]
  );

  const loadNFTs = useCallback(async () => {
    const isChild = await wallet.getActiveWallet();
    const address = await wallet.getCurrentAddress();
    setAddress(address);

    if (isChild) {
      setChildType(isChild);
      const parentaddress = await wallet.getMainWallet();
      const activec = await wallet.getChildAccountAllowTypes(parentaddress, address!);
      setActiveCollection(activec);
      const nftResult = await wallet.checkAccessibleNft(parentaddress);
      if (nftResult) {
        setAccessible(nftResult);
      }
      setIsActive(false);
    } else {
      setIsActive(true);
    }
  }, [wallet]);

  useEffect(() => {
    loadNFTs();
  }, [loadNFTs]);

  useEffect(() => {
    if (address && address !== state.ownerAddress) {
      fetchCollectionCache(address);
    }
  }, [address, state.ownerAddress, fetchCollectionCache]);

  const handleReload = useCallback(() => {
    wallet.clearNFTCollection();
    setState((prev) => ({
      ...prev,
      collections: [],
      collectionLoading: true,
    }));
    if (state.ownerAddress) {
      fetchLatestCollection(state.ownerAddress);
    }
  }, [wallet, state.ownerAddress, fetchLatestCollection]);

  const handleCollectionClick = (params) => {
    const { collection } = params;
    history.push({
      pathname: `/dashboard/nested/collectiondetail/${currentWallet.address}.${collection.id}.${nftCount}`,
      state: {
        collection: collection,
        ownerAddress: currentWallet.address,
        accessible: accessible,
      },
    });
  };

  return (
    <div id="scrollableTab">
      <Container className={classes.collectionContainer}>
        {state.collectionLoading ? (
          Array(4)
            .fill(0)
            .map((_, index) => (
              <Card
                key={index}
                sx={{ borderRadius: '12px', padding: '12px' }}
                className={classes.collectionCard}
              >
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  <CardMedia sx={{ width: '48px', height: '48px', justifyContent: 'center' }}>
                    <Skeleton variant="circular" width={48} height={48} />
                  </CardMedia>
                  <CardContent sx={{ flex: '1 0 auto', padding: '0 8px' }}>
                    <Skeleton variant="text" width={280} />
                    <Skeleton variant="text" width={150} />
                  </CardContent>
                </Box>
              </Card>
            ))
        ) : state.isCollectionEmpty ? (
          <EmptyStatus />
        ) : (
          state.collections.map((collection) => (
            <Card
              key={collection.collection?.name || collection.name}
              className={classes.collectionCard}
            >
              <CardActionArea
                className={classes.actionarea}
                onClick={() => handleCollectionClick(collection)}
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
                    image={collection.collection?.logo || collection.logo || placeholder}
                    alt={collection.collection?.name || collection.name}
                  />
                  <CardContent sx={{ flex: '1 0 auto', padding: '8px 4px' }}>
                    <Grid
                      container
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ pr: 2 }}
                    >
                      <Grid item sx={{ flex: 1 }}>
                        <Typography component="div" variant="body1" color="#fff" sx={{ mb: 0 }}>
                          {collection.collection?.name || collection.name}
                        </Typography>
                        {isActive ? (
                          <Typography
                            variant="body1"
                            sx={{ fontSize: '14px' }}
                            color="#B2B2B2"
                            component="div"
                          >
                            {collection.count} {chrome.i18n.getMessage('collectibles')}
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
          ))
        )}
      </Container>

      {!childType && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: '8px', mb: 2 }}>
          <Button
            component={Link}
            to="/dashboard/nested/add_list"
            variant="outlined"
            sx={{
              borderRadius: '20px',
              border: '1px solid #FFFFFF',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              padding: '6px 26px',
              minWidth: '132px',
              textTransform: 'capitalize',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid #FFFFFF',
              },
            }}
          >
            {chrome.i18n.getMessage('Add')}
          </Button>
        </Box>
      )}

      <EditNFTAddress
        isAddAddressOpen={isAddAddressOpen}
        handleCloseIconClicked={() => setIsAddAddressOpen(false)}
        handleCancelBtnClicked={() => setIsAddAddressOpen(false)}
        handleAddBtnClicked={() => {
          wallet.clearNFT();
          setIsAddAddressOpen(false);
          handleReload();
        }}
        setAddress={setAddress}
        address={address!}
        isEdit={isEdit}
      />
    </div>
  );
};

export default NFTTab;
