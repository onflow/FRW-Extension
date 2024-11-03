/* eslint-disable indent */
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useWallet } from 'ui/utils';
import { makeStyles } from '@mui/styles';
import { StyledEngineProvider } from '@mui/material/styles';
import {
  Card,
  CardMedia,
  CardContent,
  Grid,
  Skeleton,
  Typography,
  Box
} from '@mui/material';
import GridView from './GridView';
// import InfiniteScroll from 'react-infinite-scroll-component';
// import InfiniteScroll from 'react-infinite-scroller';
import { LLSpinner } from '@/ui/FRWComponent';
import InfiniteScroll from 'react-infinite-scroll-component';
import EmptyStatus from './EmptyStatus';

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

  const [total, setTotal] = useState(0);

  const [hasMore, setHasMore] = useState(true);

  const [blockList, setBlockList] = useState<string[]>([]);

  useImperativeHandle(ref, () => ({
    reload: () => {
      usewallet.clearNFTList()
      setNFTs([])
      setNFTLoading(true);
      fetchNFTCache(ownerAddress);
    }
  }));

  const nextPage = async () => {
    if (loadingMore) {
      return
    }

    setLoadingMore(true);
    const offset = nfts.length
    // pageIndex * 24;
    try {
      const list = await usewallet.openapi.EvmNFTList(ownerAddress);
      const newList: any[] = []
      list.nfts.forEach(item => {
        const result = nfts.filter(nft => nft.unique_id === item.unique_id)
        if (result.length == 0) {
          newList.push(item);
        }
      })
      const mergedList = [...nfts, ...newList]
      setNFTs(mergedList);
      const hasMore = mergedList.length > 0 && mergedList.length < total
      setHasMore(hasMore)
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchNFT = async (address: string, reload = true) => {
    if (loading) {
      return
    }

    setNFTLoading(true);
    try {
      const response = await usewallet.openapi.EvmNFTList(ownerAddress);
      if (response.nfts) {
        const newList: any[] = []
        response.nfts.forEach(item => {
          const result = nfts.filter(nft => nft.unique_id === item.unique_id)
          if (result.length == 0) {
            newList.push(item);
          }
        })
        const mergedList = [...nfts, ...newList]
        setNFTs(mergedList);

        const hasMore = mergedList.length > 0 && mergedList.length < total
        setHasMore(hasMore)
      }

      props.setCount(response.nftCount);
      setTotal(response.nftCount);
    } finally {
      setNFTLoading(false);
      setHasMore(false);
    }
  };

  const fetchNFTCache = async (address: string, reload = true) => {
    // setNFTLoading(true);
    try {
      const { nfts, nftCount } = await usewallet.openapi.EvmNFTList(address);
      props.setCount(nftCount);
      setTotal(nftCount);
      setNFTs(nfts);
      if (nfts.length == 0) {
        // setNFTLoading(false);
        fetchNFT(address);
      }
    } catch (e) {
      console.log('e ->', e)
    } finally {
      setNFTLoading(false);
      setHasMore(false);
    }
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
            <Skeleton
              variant="text"
              width={150}
              sx={{ margin: '0 auto' }}
            />
          </CardContent>
        </Card>
      ))}
    </Grid>
  )

  useEffect(() => {
    if (props.data.ownerAddress) {
      fetchNFTCache(props.data.ownerAddress);
      setAddress(props.data.ownerAddress);
    }
  }, []);

  const extractContractAddress = (collection) => {
    return collection.split('.')[2];
  };

  const createGridCard = (data, index) => {
    return (
      <GridView
        data={data}
        blockList={blockList}
        key={data.unique_id}
        accessible={props.accessible}
        index={index}
        ownerAddress={ownerAddress}
      />
    );
  };

  return (
    <StyledEngineProvider injectFirst>
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
                <Skeleton
                  variant="text"
                  width={150}
                  sx={{ margin: '0 auto' }}
                />
              </CardContent>
            </Card>
          ))}
        </Grid>
      ) : (
        total !== 0 ?
          <InfiniteScroll
            dataLength={nfts.length} //This is important field to render the next data
            next={nextPage}
            hasMore={hasMore}
            loader={loader}
            height={485}
            scrollableTarget="scrollableTab"
          >
            <Grid container className={classes.grid}>
              {nfts && nfts.map(createGridCard)}
              {nfts.length % 2 != 0 && <Card className={classes.cardNoHover} elevation={0} />}
            </Grid>

          </InfiniteScroll>
          :
          <EmptyStatus />
      )
      }
    </StyledEngineProvider>
  );
});

export default GridTab;
