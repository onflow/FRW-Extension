import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import {
  Typography,
  Card,
  Button,
  Box,
  IconButton,
  CardMedia,
  CardContent,
  Skeleton,
  ButtonBase,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { StyledEngineProvider } from '@mui/material/styles';
import React, { useState, useEffect, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useHistory, useParams, useLocation } from 'react-router-dom';

import { consoleError } from '@/shared/utils/console-log';
import { LLSpinner } from '@/ui/components';
import GridView from '@/ui/components/NFTs/GridView';
import { type PostMedia } from '@/ui/utils/url';
import { useWallet } from 'ui/utils';

interface CollectionDisplay {
  name: string;
  squareImage: SquareImage;
  externalURL: string;
}

interface Info {
  collectionDisplay: CollectionDisplay;
}

interface Result {
  info: Info;
  nftCount: number;
  nfts: Array<NFT>;
}

interface File {
  url: string;
}

interface SquareImage {
  file: File;
}

interface NFT {
  id: string;
  unique_id: string;
  name: string;
  description: string;
  thumbnail: string;
  postMedia: PostMedia;
}

interface CollectionDetailState {
  collection: any;
  ownerAddress: any;
  accessible: any;
}

const LinkedCollection = (props) => {
  const usewallet = useWallet();

  const location = useParams();

  const uselocation = useLocation<CollectionDetailState>();

  const history = useHistory();
  const [list, setLists] = useState<any[]>([]);
  const [ownerAddress, setOwnerAddress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [pageIndex, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const collection_info = location['collection_address_name'].split('.');
  const address = collection_info[0];
  const collection_name = collection_info[1];
  const nftCount = collection_info[2];

  const getCollection = useCallback(
    async (ownerAddress, collection, offset = 0) => {
      return await usewallet.getSingleCollection(ownerAddress, collection, offset);
    },
    [usewallet]
  );

  const fetchCollection = useCallback(async () => {
    // const { collection, ownerAddress } = await getInfo();
    setOwnerAddress(address);
    setLoading(true);

    try {
      const res = await getCollection(address, collection_name);
      setInfo(res?.collection);
      setTotal(res?.nftCount || 0);
      setLists(res?.nfts || []);
    } catch (err) {
      consoleError('err   ', err);
      // Handle the error if needed
    } finally {
      setLoading(false);
    }
  }, [address, collection_name, getCollection]);

  const nextPage = async () => {
    if (loadingMore) {
      return;
    }
    setLoadingMore(true);
    const offset = pageIndex * 24;
    try {
      const res = await getCollection(address, collection_name, offset);

      setInfo(res?.collection);
      setTotal(res?.nftCount || 0);

      if (res?.nfts) {
        const newPage = pageIndex + 1;
        setPage(newPage);
        const newList: any[] = [];
        res.nfts.forEach((item) => {
          const result = list.filter((nft) => nft.id === item.id);
          if (result.length === 0) {
            newList.push(item);
          }
        });

        const mergedList = [...list, ...newList];
        setLists(mergedList);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  function truncate(str, n) {
    return str.length > n ? str.slice(0, n - 1) + '...' : str;
  }

  const hasMore = (): boolean => {
    if (list && list.length === 0) {
      return true;
    }
    return list.length < total;
  };

  const loader = (
    <Box sx={{ display: 'flex', py: '8px', justifyContent: 'center' }}>
      <LLSpinner size={28} />
    </Box>
  );

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  const createGridCard = (data, index) => {
    return (
      <GridView
        data={data}
        blockList={[]}
        accessible={uselocation.state ? uselocation.state.accessible : []}
        key={data.unique_id}
        index={index}
        ownerAddress={ownerAddress}
        fromLinked={true}
        collectionInfo={info}
      />
    );
  };

  return (
    <StyledEngineProvider injectFirst>
      <div className="page" id="scrollableDiv" style={{ overflow: 'auto' }}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#121212',
            width: '100%',
            margin: 0,
            padding: 0,
            zIndex: 5,
          }}
        >
          <IconButton
            onClick={() => history.goBack()}
            sx={{
              borderRadius: '100%',
              margin: '8px',
            }}
          >
            <ArrowBackIcon sx={{ color: 'icon.navi' }} />
          </IconButton>
        </Box>

        {info ? (
          <>
            <Grid container sx={{ width: '100%', p: '0 25px 18px 25px' }}>
              <Grid
                sx={{
                  justifyContent: 'center',
                  backgroundColor: '#121212',
                  width: '108px',
                  height: '108px',
                }}
              >
                <img
                  src={info?.collectionDisplay?.squareImage?.file?.url || info?.logo}
                  alt="collection avatar"
                  style={{ borderRadius: '12px', width: '100%', height: '100%' }}
                />
              </Grid>
              <Grid sx={{ ml: 0, pl: '18px' }}>
                <Typography component="div" color="text.primary" variant="h6">
                  {truncate(info?.name || info.contract_name, 16)}
                </Typography>

                <Tooltip title={chrome.i18n.getMessage('Refresh')} arrow>
                  <ButtonBase sx={{ flexGrow: 1, justifyContent: 'flex-start' }}>
                    <Typography component="div" color="text.secondary" variant="body1">
                      {total | 0} {chrome.i18n.getMessage('NFTs')}
                    </Typography>
                    <IconButton
                      aria-label="close"
                      color="primary"
                      size="small"
                      // onClick={onCloseBtnClicked}
                    >
                      <ReplayRoundedIcon fontSize="inherit" />
                    </IconButton>
                  </ButtonBase>
                </Tooltip>

                <Box sx={{ p: 0, mt: '10px' }}>
                  {info.marketplace && (
                    <Button
                      startIcon={
                        <StorefrontOutlinedIcon
                          width="16px"
                          color="primary"
                          sx={{ ml: '4px', mr: 0 }}
                        />
                      }
                      sx={{
                        backgroundColor: 'neutral2.main',
                        color: 'text.secondary',
                        borderRadius: '12px',
                        textTransform: 'none',
                        p: '10px 8px',
                        mr: '10px',
                      }}
                    >
                      <a
                        href={info.marketplace}
                        target="_blank"
                        style={{ textTransform: 'none', color: 'inherit', ml: 0 }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '14px' }}>
                          {chrome.i18n.getMessage('Market')}
                        </Typography>
                      </a>
                    </Button>
                  )}
                  {info.collectionDisplay?.externalURL && (
                    <Button
                      startIcon={
                        <PublicOutlinedIcon
                          width="16px"
                          color="primary"
                          sx={{ ml: '4px', mr: 0 }}
                        />
                      }
                      sx={{
                        backgroundColor: 'neutral2.main',
                        color: 'text.secondary',
                        borderRadius: '12px',
                        textTransform: 'none',
                        p: '10px 8px',
                      }}
                    >
                      <a
                        href={info.collectionDisplay?.externalURL?.url}
                        target="_blank"
                        style={{ textTransform: 'none', color: 'inherit', ml: 0 }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '14px' }}>
                          {chrome.i18n.getMessage('Website')}
                        </Typography>
                      </a>
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>

            {loading ? (
              <Grid
                container
                sx={{
                  width: '100%',
                  minHeight: '360px',
                  backgroundColor: '#1B1B1B',
                  borderRadius: '16px 16px 0 0',
                  padding: '10px 13px',
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignContent: 'flex-start',
                  marginBottom: '20px',
                  overflow: 'auto',
                }}
              >
                {[...Array(4).keys()].map((key) => (
                  <Card
                    sx={{
                      width: '185px',
                      height: '225px',
                      backgroundColor: '#1B1B1B',
                      padding: '0',
                      boxShadow: 'none',
                      margin: 0,
                      borderRadius: '8px',
                    }}
                    elevation={0}
                    key={key}
                  >
                    <CardMedia
                      sx={{
                        height: '159px',
                        width: '100%',
                        justifyContent: 'center',
                      }}
                    >
                      <Skeleton
                        variant="rectangular"
                        width={150}
                        height={150}
                        sx={{ margin: '0 auto', borderRadius: '8px' }}
                      />
                    </CardMedia>
                    <CardContent
                      sx={{
                        height: '40px',
                        padding: '5px 0',
                        backgroundColor: 'inherit',
                        borderRadius: '0 0 8px 8px',
                      }}
                    >
                      <Skeleton variant="text" width={150} sx={{ margin: '0 auto' }} />
                    </CardContent>
                  </Card>
                ))}
              </Grid>
            ) : (
              info && (
                <InfiniteScroll
                  dataLength={list.length} //This is important field to render the next data
                  next={nextPage}
                  hasMore={hasMore()}
                  loader={loader}
                  scrollableTarget="scrollableDiv"
                  style={{
                    backgroundColor: '#1B1B1B',
                    borderRadius: '16px 16px 0 0',
                  }}
                >
                  <Grid
                    container
                    sx={{
                      width: '100%',
                      minHeight: '360px',
                      backgroundColor: '#1B1B1B',
                      borderRadius: '16px 16px 0 0',
                      padding: '10px 13px',
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignContent: 'flex-start',
                      marginBottom: '20px',
                      overflow: 'auto',
                    }}
                  >
                    {list && list.map(createGridCard)}
                    {list.length % 2 !== 0 && (
                      <Card
                        sx={{
                          flex: '50%',
                          padding: '13px',
                          backgroundColor: 'inherit',
                          boxShadow: 'none',
                          margin: 0,
                          borderRadius: '8px',
                          display: 'inline-block',
                        }}
                        elevation={0}
                      />
                    )}
                  </Grid>
                </InfiniteScroll>
              )
            )}
          </>
        ) : (
          <Grid
            container
            sx={{
              width: '100%',
              minHeight: '360px',
              backgroundColor: '#1B1B1B',
              borderRadius: '16px 16px 0 0',
              padding: '10px 13px',
              margin: 0,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignContent: 'flex-start',
              marginBottom: '20px',
              overflow: 'auto',
            }}
          >
            {[...Array(4).keys()].map((key) => (
              <Card
                sx={{
                  flex: '50%',
                  padding: '13px',
                  backgroundColor: 'inherit',
                  boxShadow: 'none',
                  margin: 0,
                  borderRadius: '8px',
                  display: 'inline-block',
                }}
                elevation={0}
                key={key}
              >
                <CardMedia
                  sx={{
                    margin: '0 auto',
                    borderRadius: '8px',
                    width: '150px',
                    height: '150px',
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    width={150}
                    height={150}
                    sx={{ margin: '0 auto', borderRadius: '8px' }}
                  />
                </CardMedia>
                <CardContent
                  sx={{
                    padding: '8px 0',
                    textAlign: 'center',
                  }}
                >
                  <Skeleton variant="text" width={150} sx={{ margin: '0 auto' }} />
                </CardContent>
              </Card>
            ))}
          </Grid>
        )}
      </div>
    </StyledEngineProvider>
  );
};

export default LinkedCollection;
