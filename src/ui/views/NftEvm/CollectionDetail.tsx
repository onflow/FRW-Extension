import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory, useParams, useLocation } from 'react-router-dom';

import { triggerRefresh } from '@/shared/utils/cache-data-access';
import { evmNftCollectionListKey } from '@/shared/utils/cache-data-keys';
import { consoleError } from '@/shared/utils/console-log';
import CollectionDetailGrid from '@/ui/components/NFTs/CollectionDetailGrid';
import GridView from '@/ui/components/NFTs/GridView';
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

interface CollectionDetailState {
  collection: any;
  ownerAddress: any;
  accessible: any;
}

const NftEvmCollectionDetail = () => {
  const usewallet = useWallet();
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
      triggerRefresh(evmNftCollectionListKey(network, ownerAddress, collection, `${offset}`));
    },
    [network]
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
