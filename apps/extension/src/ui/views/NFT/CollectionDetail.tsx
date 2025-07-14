import React, { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { isValidEthereumAddress } from '@onflow/flow-wallet-shared/utils/address';
import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import {
  getCachedEvmNftCollectionList,
  getCachedNftCollection,
  triggerEvmNftCollectionRefresh,
  triggerNftCollectionRefresh,
} from '@/data-model/cache-data-keys';
import CollectionDetailGrid from '@/ui/components/NFTs/CollectionDetailGrid';
import GridView from '@/ui/components/NFTs/GridView';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useNftHook } from '@/ui/hooks/useNftHook';

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

interface CollectionDetailState {
  collection: any;
  ownerAddress: string;
  accessible: any;
}

const NFTCollectionDetail = () => {
  const { network } = useNetwork();
  const usewallet = useWallet();
  const location = useParams();
  const uselocation = useLocation();
  const navigate = useNavigate();

  const collection_info = location['collection_address_name']?.split('.') || [];
  const address = collection_info[0];
  const collection_name = collection_info[1];
  const nftCount = collection_info[2];

  // Check if the collection is an EVM collection
  const isEvm = useMemo(() => isValidEthereumAddress(address), [address]);

  const getCollection = useCallback(
    async (ownerAddress: string, collection: string, offset: number | string = 0) => {
      if (!network) {
        return undefined;
      }
      if (isEvm) {
        return await getCachedEvmNftCollectionList(
          network,
          ownerAddress,
          collection,
          offset as number
        );
      }
      return await getCachedNftCollection(network, ownerAddress, collection, offset as number);
    },
    [network, isEvm]
  );

  const refreshCollection = useCallback(
    async (ownerAddress: string, collection: string, offset: number | string = 0) => {
      if (!network) {
        return;
      }
      if (isEvm) {
        triggerEvmNftCollectionRefresh(network, ownerAddress, collection, offset as number);
      } else {
        triggerNftCollectionRefresh(network, ownerAddress, collection, offset as number);
      }
    },
    [network, isEvm]
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
