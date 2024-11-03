/* eslint-disable indent */
import React, { forwardRef, useImperativeHandle } from 'react';
import { Box } from '@mui/system';
import { makeStyles } from '@mui/styles';
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
import { Link, useHistory } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useEffect, useState } from 'react';
import { useWallet } from '@/ui/utils/WalletContext';
import EmptyStatus from './EmptyStatus';
import placeholder from 'ui/FRWAssets/image/placeholder.png';

interface ListTabProps {
  data: any;
  setCount: (count: any) => void;
  accessible: any;
  isActive: boolean;
  activeCollection: any;
}


const useStyles = makeStyles(() => ({
  collectionContainer: {
    width: '100%',
    justifyContent: 'center',
  },
  collectionCard: {
    display: 'flex',
    width: '100%',
    height: '64px',
    margin: '12px auto',
    boxShadow: 'none',
  },
  skeletonCard: {
    display: 'flex',
    backgroundColor: '#000000',
    width: '100%',
    height: '72px',
    margin: '12px auto',
    boxShadow: 'none',
    padding: 'auto',
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
    backgroundColor: '#282828',
    '&:hover': {
      color: '#787878',
      backgroundColor: '#787878',
    },
  },
}));

const ListTab = forwardRef((props: ListTabProps, ref) => {
  const history = useHistory();
  const classes = useStyles();
  const usewallet = useWallet();
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [collections, setCollections] = useState<any[]>([]);
  const [isCollectionEmpty, setCollectionEmpty] = useState(true);
  const [accesibleArray, setAccessible] = useState([{ id: '' }]);
  const [ownerAddress, setAddress] = useState('');

  useImperativeHandle(ref, () => ({
    reload: () => {
      usewallet.clearNFTCollection()
      setCollections([])
      setCollectionLoading(true);
      fetchLatestCollection(ownerAddress)
    }
  }));

  const fetchCollectionCache = async (address: string) => {
    setAccessible(props.accessible)
    try {
      setCollectionLoading(true);
      const list = await usewallet.getCollectionCache();
      if (list && list.length > 0) {
        setCollectionEmpty(false);
        setCollections(list);
        const count = list.reduce((acc, item) => acc + item.count, 0);
        props.setCount(count);
      } else {
        setCollectionEmpty(true);
        fetchLatestCollection(address);
      }
    } catch {
      setCollectionEmpty(true);
      fetchLatestCollection(address);
    } finally {
      setCollectionLoading(false);
    }
  };

  const fetchLatestCollection = async (address: string) => {
    try {
      const list = await usewallet.refreshCollection(address);
      setCollectionLoading(false);
      if (list && list.length > 0) {
        setCollectionEmpty(false);
        setCollections(list);
      } else {
        setCollectionEmpty(true);
      }
    } catch (err) {
      console.log(err)
      setCollectionLoading(false);
      setCollectionEmpty(true);
    }
  };

  useEffect(() => {
    if (props.data.ownerAddress) {
      fetchCollectionCache(props.data.ownerAddress);
      setAddress(props.data.ownerAddress);
    }
  }, [props.data.ownerAddress]);


  const extractContractAddress = (collection) => {
    return collection.split('.')[2];
  };

  const checkContractAddressInCollections = (nft) => {
    if (props.isActive) {
      return true
    }
    const contractAddressWithout0x = nft.collection.contract_name;
    const isActiveCollect =  props.activeCollection.some(collection => {
      const extractedAddress = extractContractAddress(collection);
      if (extractedAddress === contractAddressWithout0x) {
        console.log('nft is ', contractAddressWithout0x, extractedAddress, )
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
          accessible: props.accessible
        }
      });
    };
    return (
      <Card sx={{ borderRadius: '12px' }} className={classes.collectionCard}>
        <CardActionArea
          sx={{ backgroundColor: 'background.paper', borderRadius: '12px',paddingRight:'8px'  }}
          className={classes.actionarea}
          onClick={data.isAccessible && handleClick}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row'}}>
            <CardMedia
              component="img"
              sx={{
                width: '48px',
                height: '48px',
                padding: '8px',
                borderRadius: '12px',
                justifyContent: 'center',
                mt:'8px',
              }}
              image={data.logo || placeholder}
              alt={data.name}
            />
            <CardContent sx={{ flex: '1 0 auto', padding: '8px 4px' }}>
              <Grid container>
                <Grid item sx={{ width: '260px' }}>
                  <Typography
                    component="div"
                    variant="body1"
                    color="#fff"
                    sx={{ mb: 0 }}
                  >
                    {data.name}
                  </Typography>
                  {data.isAccessible ?

                    <Typography
                      variant="body1"
                      sx={{ fontSize: '14px' }}
                      color="#B2B2B2"
                      component="div"
                    >
                      {data.count}{' '}{chrome.i18n.getMessage('collectibles')}
                    </Typography>
                    :
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: 'neutral.text',
                        fontSize: '10px',
                        width:'80px',
                        fontFamily: 'Inter, sans-serif',
                        backgroundColor: 'neutral1.light'
                      }}
                    >
                      {chrome.i18n.getMessage('Inaccessible')}
                    </Box>

                  }
                </Grid>
                <Grid item>
                  <ArrowForwardIcon color="primary" sx={{ mt: '12px' }} />
                </Grid>
              </Grid>
            </CardContent>
          </Box>
        </CardActionArea>
      </Card>
    );
  };

  const createListCard = (props, index) => {
    console.log('isAccessible ', props)
    const isAccessible = checkContractAddressInCollections(props)
    console.log('isAccessible ', isAccessible, props)
    return (
      <CollectionView
        name={props.collection?  props.collection.name : props.name}
        logo={props.collection?  props.collection.logo : props.logo}
        key={props.collection ?  props.collection.name : props.name}
        count={props.count}
        index={index}
        contract_name={props.collection ?  props.collection.id : props.id}
        ownerAddress={ownerAddress}
        isAccessible={isAccessible}
      />
    );
  };

  return (
    <Container className={classes.collectionContainer}>
      {collectionLoading ? (
        <div>
          <Card
            sx={{
              borderRadius: '12px',
              backgroundColor: '#000000',
              padding: '12px',
            }}
            className={classes.skeletonCard}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <CardMedia
                sx={{
                  width: '48px',
                  height: '48px',
                  justifyContent: 'center',
                }}
              >
                <Skeleton variant="circular" width={48} height={48} />
              </CardMedia>
              <CardContent sx={{ flex: '1 0 auto', padding: '0 8px' }}>
                <Skeleton variant="text" width={280} />
                <Skeleton variant="text" width={150} />
              </CardContent>
            </Box>
          </Card>

          <Card
            sx={{
              borderRadius: '12px',
              backgroundColor: '#000000',
              padding: '12px',
            }}
            className={classes.skeletonCard}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <CardMedia
                sx={{
                  width: '48px',
                  height: '48px',
                  justifyContent: 'center',
                }}
              >
                <Skeleton variant="circular" width={48} height={48} />
              </CardMedia>
              <CardContent sx={{ flex: '1 0 auto', padding: '0 8px' }}>
                <Skeleton variant="text" width={280} />
                <Skeleton variant="text" width={150} />
              </CardContent>
            </Box>
          </Card>

          <Card
            sx={{
              borderRadius: '12px',
              backgroundColor: '#000000',
              padding: '12px',
            }}
            className={classes.skeletonCard}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <CardMedia
                sx={{
                  width: '48px',
                  height: '48px',
                  justifyContent: 'center',
                }}
              >
                <Skeleton variant="circular" width={48} height={48} />
              </CardMedia>
              <CardContent sx={{ flex: '1 0 auto', padding: '0 8px' }}>
                <Skeleton variant="text" width={280} />
                <Skeleton variant="text" width={150} />
              </CardContent>
            </Box>
          </Card>

          <Card
            sx={{
              borderRadius: '12px',
              backgroundColor: '#000000',
              padding: '12px',
            }}
            className={classes.skeletonCard}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <CardMedia
                sx={{
                  width: '48px',
                  height: '48px',
                  justifyContent: 'center',
                }}
              >
                <Skeleton variant="circular" width={48} height={48} />
              </CardMedia>
              <CardContent sx={{ flex: '1 0 auto', padding: '0 8px' }}>
                <Skeleton variant="text" width={280} />
                <Skeleton variant="text" width={150} />
              </CardContent>
            </Box>
          </Card>
        </div>
      ) : isCollectionEmpty ? (
        <EmptyStatus />
      ) : (
        collections.map(createListCard)
      )}
    </Container>
  );
});

export default ListTab;
