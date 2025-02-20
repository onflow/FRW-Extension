import { Card, CardMedia, CardContent, Grid, Skeleton, Typography, Box } from '@mui/material';
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
    // paddingLeft: '15px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'flex-start',
    padding: '10px 13px',
    // marginLeft: 'auto'
  },
  scroll: {
    width: '100%',
    margin: 0,
    // paddingLeft: '15px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignContent: 'flex-start',
    padding: '10px 13px',
    // marginLeft: 'auto'
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

  const mountedRef = useRef(true);
  const initialFetchDone = useRef(false);
  const addressRef = useRef('');
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
      const list = await usewallet.openapi.EvmNFTList(ownerAddress);
      const newList: any[] = [];
      list.nfts.forEach((item) => {
        const result = nfts.filter((nft) => nft.unique_id === item.unique_id);
        if (result.length === 0) {
          newList.push(item);
        }
      });
      const mergedList = [...nfts, ...newList];
      setNFTs(mergedList);
      setHasMore(mergedList.length < total);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nfts, ownerAddress, total, usewallet]);

  const { setCount } = props;

  const fetchNFT = useCallback(
    async (address: string, reload = true) => {
      if (loading) {
        return;
      }

      setNFTLoading(true);
      try {
        const response = await usewallet.openapi.EvmNFTList(ownerAddress);
        if (response.nfts) {
          const newList: any[] = [];
          response.nfts.forEach((item) => {
            const result = nfts.filter((nft) => nft.unique_id === item.unique_id);
            if (result.length === 0) {
              newList.push(item);
            }
          });
          const mergedList = [...nfts, ...newList];
          setNFTs(mergedList);

          const hasMore = mergedList.length > 0 && mergedList.length < total;
          setHasMore(hasMore);
        }

        setCount(response.nftCount);
        setTotal(response.nftCount);
      } finally {
        setNFTLoading(false);
        setHasMore(false);
      }
    },
    [
      loading,
      ownerAddress,
      nfts,
      total,
      usewallet,
      setNFTs,
      setNFTLoading,
      setCount,
      setTotal,
      setHasMore,
    ]
  );

  const fetchNFTCache = useCallback(
    async (address: string) => {
      if (loading) {
        console.log('⚠️ EVM: Skipping cache fetch - already loading');
        return;
      }

      console.log('🔍 EVM: Starting NFT cache fetch for:', address);
      setNFTLoading(true);

      try {
        console.log('📡 EVM: Making API call to fetch NFTs');
        const response = await usewallet.openapi.EvmNFTList(address);
        console.log('📦 EVM: Received response:', {
          hasNFTs: !!response?.nfts,
          nftCount: response?.nftCount,
        });

        if (!response) {
          console.log('⚠️ EVM: No response from cache, falling back to direct fetch');
          await fetchNFT(address);
          return;
        }

        const { nfts, nftCount } = response;

        if (nfts?.length) {
          console.log('✅ EVM: Setting NFTs:', {
            count: nfts.length,
            total: nftCount,
          });
          setNFTs(nfts);
          setTotal(nftCount);
          setCount(nftCount);
          setHasMore(nfts.length < nftCount);
        } else {
          console.log('⚠️ EVM: No NFTs in cache, falling back to direct fetch');
          await fetchNFT(address);
        }
      } catch (e) {
        console.error('❌ EVM: Cache fetch failed:', e);
        await fetchNFT(address);
      } finally {
        console.log('🏁 EVM: Completing cache fetch');
        setNFTLoading(false);
      }
    },
    [loading, usewallet, fetchNFT, setNFTs, setTotal, setCount, setHasMore]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const currentAddress = props.data.ownerAddress;
    if (
      !currentAddress ||
      !mountedRef.current ||
      initialFetchDone.current ||
      currentAddress === addressRef.current
    ) {
      return;
    }

    const initFetch = async () => {
      initialFetchDone.current = true;
      addressRef.current = currentAddress;
      await fetchNFTCache(currentAddress);
      setAddress(currentAddress);
    };

    initFetch();
  }, [props.data.ownerAddress, fetchNFTCache]);

  const createGridCard = (data: any, index: number) => {
    return (
      <GridView
        data={data}
        blockList={blockList}
        key={`${data.unique_id}-${index}`}
        accessible={props.accessible}
        index={index}
        ownerAddress={ownerAddress}
      />
    );
  };

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
