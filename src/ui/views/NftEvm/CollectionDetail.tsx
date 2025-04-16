import { makeStyles } from '@mui/styles';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory, useParams, useLocation } from 'react-router-dom';

import CollectionDetailGrid from '@/ui/FRWComponent/NFTs/CollectionDetailGrid';
import GridView from '@/ui/FRWComponent/NFTs/GridView';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useEvmNftCollectionList, useNftHook } from '@/ui/hooks/useNftHook';
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

const NftEvmCollectionDetail = () => {
  const usewallet = useWallet();
  const classes = useStyles();
  const location = useParams();
  const uselocation = useLocation<CollectionDetailState>();
  const history = useHistory();
  const { network } = useNetwork();

  const [ownerAddress, setOwnerAddress] = useState<any>(null);
  const [filteredList, setFilteredList] = useState<any[]>([]);

  // Add a useRef to track if we've initialized the filtered list
  const initializedRef = useRef(false);

  const collection_info = location['collection_address_name'].split('.');
  const address = collection_info[0];
  const collection_name = collection_info[1];
  const nftCount = collection_info[2];

  const evmNftCollectionList = useEvmNftCollectionList(network, address, collection_name, 0);
  const getCollection = useCallback(
    async (ownerAddress, collection, offset) => {
      return await usewallet.getEvmNftCollectionList(ownerAddress, collection, 50, offset);
    },
    [usewallet]
  );

  const refreshCollection = useCallback(
    async (ownerAddress, collection, offset) => {
      return await usewallet.refreshEvmNftCollectionList(ownerAddress, collection, 50, offset);
    },
    [usewallet]
  );

  // Use the useNftHook
  const {
    list,
    allNfts,
    info,
    total,
    loading,
    loadingMore,
    isLoadingAll,
    refreshCollectionImpl,
    searchTerm,
    setSearchTerm,
  } = useNftHook({
    getCollection,
    refreshCollection,
    ownerAddress: address,
    collectionName: collection_name,
    isEvm: true,
    nftCount: nftCount,
  });

  // Add this useEffect to initialize the filtered list only once
  useEffect(() => {
    if (!initializedRef.current && allNfts && allNfts.length > 0) {
      setFilteredList(allNfts);
      initializedRef.current = true;
    }
  }, [allNfts]);

  useEffect(() => {
    setOwnerAddress(address);
  }, [address]);

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
        console.error('Error parsing saved state:', e);
      }
    }
  }, [setSearchTerm]);

  const createGridCard = (data, index) => {
    return (
      <GridView
        data={data}
        blockList={[]}
        accessible={uselocation.state ? uselocation.state.accessible : []}
        key={data.unique_id || data.id}
        index={index}
        ownerAddress={ownerAddress}
        isEvm={true}
        searchTerm={searchTerm}
      />
    );
  };

  return (
    <CollectionDetailGrid
      info={info}
      list={list}
      allNfts={allNfts}
      total={nftCount}
      loading={loading}
      isLoadingAll={isLoadingAll}
      refreshCollectionImpl={refreshCollectionImpl}
      createGridCard={createGridCard}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      loadingMore={loadingMore}
    />
  );
};

export default NftEvmCollectionDetail;
