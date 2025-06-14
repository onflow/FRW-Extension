import { makeStyles } from '@mui/styles';
import React, { useCallback, useEffect } from 'react';
import { useHistory, useParams, useLocation } from 'react-router-dom';

import { consoleError } from '@/shared/utils/console-log';
import CollectionDetailGrid from '@/ui/components/NFTs/CollectionDetailGrid';
import GridView from '@/ui/components/NFTs/GridView';
import { useNftHook } from '@/ui/hooks/useNftHook';
import { useWallet } from 'ui/utils';

// import InfiniteScroll from 'react-infinite-scroller';

interface CollectionDisplay {
  name: string;
  squareImage: SquareImage;
  externalURL: string;
}

interface Info {
  collectionDisplay: CollectionDisplay;
}

interface File {
  url: string;
}

interface SquareImage {
  file: File;
}

const useStyles = makeStyles(() => ({
  title: {
    fontSize: '22px',
    color: '#F2F2F2',
    lingHeight: '32px',
    fontWeight: 600,
    margin: '18px',
  },
  card: {
    width: '185px',
    height: '225px',
    backgroundColor: '#1B1B1B',
    padding: '0',
    boxShadow: 'none',
    margin: 0,
    borderRadius: '8px',
  },
  cardNoHover: {
    flex: '50%',
    padding: '13px',
    // height: '211px',
    backgroundColor: 'inherit',
    boxShadow: 'none',
    margin: 0,
    borderRadius: '8px',
    display: 'inline-block',
  },
  actionarea: {
    width: '100%',
    height: '100%',
    borderRadius: '8px',
    padding: '13px',
    '&:hover': {
      color: '#282828',
      backgroundColor: '#282828',
    },
  },
  grid: {
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
    // marginLeft: 'auto'
    marginBottom: '20px',
    overflow: 'auto',
  },
  cardmedia: {
    height: '159px',
    width: '100%',
    justifyContent: 'center',
  },
  media: {
    maxWidth: '100%',
    maxHeight: '100%',
    borderRadius: '8px',
    margin: '0 auto',
  },
  content: {
    height: '40px',
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
  collectionCard: {
    display: 'flex',
    width: '100%',
    height: '64px',
    margin: '11px auto',
    borderRadius: '16px',
    boxShadow: 'none',
  },
  collectionImg: {
    borderRadius: '12px',
    width: '48px',
    margin: '8px',
  },
  arrowback: {
    borderRadius: '100%',
    margin: '8px',
  },
  iconbox: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#121212',
    width: '100%',
    margin: 0,
    padding: 0,
    zIndex: 5,
  },
}));

interface CollectionDetailState {
  collection: any;
  ownerAddress: any;
  accessible: any;
}

const NFTCollectionDetail = () => {
  const usewallet = useWallet();
  const classes = useStyles();
  const location = useParams();
  const uselocation = useLocation<CollectionDetailState>();
  const history = useHistory();

  const collection_info = location['collection_address_name'].split('.');
  const address = collection_info[0];
  const collection_name = collection_info[1];
  const nftCount = collection_info[2];

  const getCollection = useCallback(
    async (ownerAddress, collection, offset) => {
      return await usewallet.getSingleCollection(ownerAddress, collection, offset);
    },
    [usewallet]
  );

  const refreshCollection = useCallback(
    async (ownerAddress, collection, offset) => {
      return await usewallet.refreshSingleCollection(ownerAddress, collection, offset);
    },
    [usewallet]
  );

  const {
    list,
    allNfts,
    info,
    total,
    loading,
    isLoadingAll,
    loadingMore,
    refreshCollectionImpl,
    searchTerm,
    setSearchTerm,
  } = useNftHook({
    getCollection,
    refreshCollection,
    ownerAddress: address,
    collectionName: collection_name,
    isEvm: false,
  });

  // Check for saved state when returning from NFT detail view
  useEffect(() => {
    const savedState = localStorage.getItem('nftDetailState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState.searchTerm && setSearchTerm) {
          setSearchTerm(parsedState.searchTerm);
        }
        localStorage.setItem('nftDetailState', '');
      } catch (e) {
        consoleError('Error parsing saved state:', e);
      }
    }
  }, [setSearchTerm]);

  const createGridCard = (data, index) => {
    return (
      <GridView
        data={data}
        blockList={[]}
        accessible={uselocation.state ? uselocation.state.accessible : []}
        key={data.unique_id}
        index={index}
        ownerAddress={address}
        collectionInfo={info}
        isEvm={false}
        searchTerm={searchTerm}
      />
    );
  };

  return (
    <CollectionDetailGrid
      info={info}
      list={list}
      allNfts={allNfts}
      total={total}
      loading={loading}
      loadingMore={loadingMore}
      isLoadingAll={isLoadingAll}
      refreshCollectionImpl={refreshCollectionImpl}
      createGridCard={createGridCard}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
    />
  );
};

export default NFTCollectionDetail;
