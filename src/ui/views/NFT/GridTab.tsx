import { Card, CardMedia, CardContent, Grid, Skeleton, Box } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

import { LLSpinner } from '@/ui/FRWComponent';
import { useWallet } from 'ui/utils';

import EmptyStatus from '../EmptyStatus';

import GridView from './GridView';

// import InfiniteScroll from 'react-infinite-scroll-component';
// import InfiniteScroll from 'react-infinite-scroller';

interface GridTabProps {
  data: Data;
  accessible: any;
  isActive: boolean;
  setCount: (count: any) => void;
  activeCollection: any;
}

interface Data {
  ownerAddress: any;
}

const useStyles = makeStyles(() => ({
  titleWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 9px',
  },
  title: {
    fontSize: '22px',
    color: '#F2F2F2',
    lineHeight: '32px',
    fontWeight: 600,
    padding: '18px',
    flex: 1,
  },
  actionarea: {
    width: '100%',
    height: '100%',
    borderRadius: '8px',
    '&:hover': {
      // borderRadius: '8px',
      color: '#222222',
      backgroundColor: '#222222',
    },
  },
  card: {
    flex: '0 0 50%',
    padding: '13px 0 ',
    // height: '211px',
    backgroundColor: 'inherit',
    boxShadow: 'none',
    margin: 0,
    borderRadius: '8px',
    display: 'inline-block',
    '&:hover': {
      // borderRadius: '8px',
      color: '#222222',
      backgroundColor: '#222222',
    },
  },
  cardNoHover: {
    flex: '0 0 50%',
    padding: '13px 0 ',
    // height: '211px',
    backgroundColor: 'inherit',
    boxShadow: 'none',
    margin: 0,
    borderRadius: '8px',
    display: 'inline-block',
  },
  cardLastOne: {
    flex: '0 0 50%',
    padding: '13px 0 ',
    // height: '211px',
    backgroundColor: 'inherit',
    boxShadow: 'none',
    margin: 0,
    borderRadius: '8px',
    display: 'inline-block',
  },
  grid: {
    width: '100%',
    margin: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'flex-start',
    padding: '10px 13px',
  },
  scroll: {
    width: '100%',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignContent: 'flex-start',
    padding: '10px 13px',
    marginTop: '16px',
  },
  cardmedia: {
    height: '159px',
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
    borderRadius: '8px',
    margin: '0 auto',
    objectFit: 'cover',
  },
  content: {
    // height: '40px',
    padding: '5px 0',
    backgroundColor: 'inherit',
    borderRadius: '0 0 8px 8px',
  },
  nftname: {
    color: '#E6E6E6',
    fontSize: '14px',
  },
  nftprice: {
    color: '#808080',
    fontSize: '14px',
  },
}));

const GridTab = forwardRef((props: GridTabProps, ref) => {
  const classes = useStyles();

  const usewallet = useWallet();

  const [loading, setNFTLoading] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [ownerAddress, setAddress] = useState('');

  const [nfts, setNFTs] = useState<any[]>([]);

  const [total, setTotal] = useState(1);

  const [hasMore, setHasMore] = useState(true);

  const [blockList, setBlockList] = useState<string[]>([]);

  const [initialized, setInitialized] = useState(false);
  const initialFetchDone = useRef(false);
  const addressRef = useRef('');

  const mountedRef = useRef(true);

  const [scrollDirection, setScrollDirection] = useState('down');
  const lastScrollTop = useRef(0);

  const handleScroll = useCallback(
    (e: Event) => {
      if (loading) return;
      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;
      const direction = scrollTop > lastScrollTop.current ? 'down' : 'up';

      if (direction !== scrollDirection) {
        setScrollDirection(direction);
      }
      lastScrollTop.current = scrollTop;
    },
    [loading, scrollDirection]
  );

  useImperativeHandle(ref, () => ({
    reload: () => {
      usewallet.clearNFTList();
      setNFTs([]);
      setNFTLoading(true);
      fetchNFTCache(ownerAddress);
    },
  }));

  const nextPage = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    const offset = nfts.length;

    try {
      const response = await usewallet.refreshNft(ownerAddress, offset);
      if (!response || !response.nfts) return;

      const newList = response.nfts.filter(
        (item) => !nfts.some((nft) => nft.unique_id === item.unique_id)
      );

      if (newList.length > 0) {
        const mergedList = [...nfts, ...newList];
        setNFTs(mergedList);
        setHasMore(mergedList.length < total);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nfts, ownerAddress, total, usewallet]);

  const { setCount } = props;

  const fetchNFT = useCallback(
    async (address: string) => {
      if (!mountedRef.current) return;

      try {
        const response = await usewallet.refreshNft(address);
        console.log('🔄 NFT: Network response:', response);

        if (!mountedRef.current) return;

        if (!response || !response.nfts) {
          setNFTs([]);
          setTotal(0);
          setCount(0);
          setHasMore(false);
          return;
        }

        setNFTs(response.nfts);
        setTotal(response.nftCount);
        setCount(response.nftCount);
        setHasMore(response.nfts.length < response.nftCount);
        console.log('✅ NFT: Initial fetch complete', {
          itemCount: response.nfts.length,
          total: response.nftCount,
          hasMore: response.nfts.length < response.nftCount,
        });
      } catch (e) {
        console.error('❌ NFT: Network fetch failed:', e);
        setNFTs([]);
        setTotal(0);
        setCount(0);
        setHasMore(false);
      }
    },
    [mountedRef, usewallet, setNFTs, setTotal, setCount, setHasMore]
  );

  const fetchNFTCache = useCallback(
    async (address: string) => {
      if (!mountedRef.current || !address) {
        console.log('⏭️ NFT: Skipping - invalid state');
        return;
      }

      setNFTLoading(true);

      try {
        const response = await usewallet.getNFTListCache();
        console.log('📦 NFT: Cache response:', response);

        if (!mountedRef.current) return;

        if (!response || !response.nfts || response.nfts.length === 0) {
          console.log('⚠️ NFT: No cached NFTs, fetching from network');
          await fetchNFT(address);
          return;
        }

        setNFTs(response.nfts);
        setTotal(response.nftCount);
        setCount(response.nftCount);
        setHasMore(response.nfts.length < response.nftCount);
        setInitialized(true);
      } catch (e) {
        console.error('❌ NFT: Cache fetch failed:', e);
        if (!initialized) {
          await fetchNFT(address);
        }
      } finally {
        setNFTLoading(false);
      }
    },
    [
      mountedRef,
      usewallet,
      fetchNFT,
      setNFTs,
      setTotal,
      setCount,
      setHasMore,
      setInitialized,
      initialized,
      setNFTLoading,
    ]
  );

  // const hasMore = (): boolean => {
  //   return nfts && nfts.length < total
  //   // return false;
  // }

  useEffect(() => {
    if (
      !props.data.ownerAddress ||
      initialFetchDone.current ||
      props.data.ownerAddress === addressRef.current
    ) {
      console.log('⏭️ NFT: Skipping - already fetched or same address');
      return;
    }

    console.log('🔄 NFT: Initial load for address:', props.data.ownerAddress);
    initialFetchDone.current = true;
    addressRef.current = props.data.ownerAddress;
    fetchNFTCache(props.data.ownerAddress);
    setAddress(props.data.ownerAddress);
  }, [props.data.ownerAddress, fetchNFTCache]);

  const extractContractAddress = (collection) => {
    return collection.split('.')[2];
  };
  const checkContractAddressInCollections = (nft) => {
    if (props.isActive) {
      return true;
    }
    const contractAddressWithout0x = nft.collectionContractName;
    console.log('nft is ', contractAddressWithout0x);
    return props.activeCollection.some((collection) => {
      const extractedAddress = extractContractAddress(collection);
      return extractedAddress === contractAddressWithout0x;
    });
  };

  const createGridCard = (data, index) => {
    const isAccessibleNft = checkContractAddressInCollections(data);
    return (
      <GridView
        data={data}
        blockList={blockList}
        key={data.unique_id}
        accessible={props.accessible}
        index={index}
        ownerAddress={ownerAddress}
        isAccessibleNft={isAccessibleNft}
        collectionInfo={data}
      />
    );
  };

  const loader = (
    <Grid container className={classes.grid}>
      {[...Array(2).keys()].map((key) => (
        <Card className={classes.card} elevation={0} key={key}>
          <CardMedia className={classes.cardmedia}>
            <Skeleton
              variant="rectangular"
              width={150}
              height={150}
              sx={{ margin: '0 auto', borderRadius: '8px' }}
            />
          </CardMedia>
          <CardContent className={classes.content}>
            <Skeleton variant="text" width={150} sx={{ margin: '0 auto' }} />
          </CardContent>
        </Card>
      ))}
    </Grid>
  );

  return (
    <StyledEngineProvider injectFirst>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Grid container className={classes.grid}>
            {[...Array(4).keys()].map((key) => (
              <Card className={classes.card} elevation={0} key={key}>
                <CardMedia className={classes.cardmedia}>
                  <Skeleton
                    variant="rectangular"
                    width={150}
                    height={150}
                    sx={{ margin: '0 auto', borderRadius: '8px' }}
                  />
                </CardMedia>
                <CardContent className={classes.content}>
                  <Skeleton variant="text" width={150} sx={{ margin: '0 auto' }} />
                </CardContent>
              </Card>
            ))}
          </Grid>
        ) : total !== 0 ? (
          <InfiniteScroll
            dataLength={nfts.length}
            next={nextPage}
            hasMore={hasMore && scrollDirection === 'down'}
            loader={<LLSpinner />}
            height="calc(100vh - 160px)"
            style={{
              overflow: 'auto',
              paddingTop: '16px',
              marginTop: '-16px',
            }}
            scrollThreshold="100px"
            onScroll={(e: any) => {
              const target = e.target as HTMLElement;
              const scrollTop = target.scrollTop;
              const direction = scrollTop > lastScrollTop.current ? 'down' : 'up';
              setScrollDirection(direction);
              lastScrollTop.current = scrollTop;
            }}
          >
            <Grid container className={classes.grid}>
              {nfts && nfts.map(createGridCard)}
              {nfts.length % 2 !== 0 && <Card className={classes.cardNoHover} elevation={0} />}
            </Grid>
          </InfiniteScroll>
        ) : !loading && total === 0 ? (
          <EmptyStatus />
        ) : null}
      </Box>
    </StyledEngineProvider>
  );
});

export default GridTab;
