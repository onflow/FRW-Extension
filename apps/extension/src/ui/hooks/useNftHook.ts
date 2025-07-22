import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type NftCollection,
  type NFTModelV2,
} from '@onflow/flow-wallet-shared/types/network-types';
import {
  type EvmCollectionDetails,
  type CadenceCollectionDetails,
  type NFTItem,
} from '@onflow/flow-wallet-shared/types/nft-types';
import { consoleError, consoleLog } from '@onflow/flow-wallet-shared/utils/console-log';

import {
  childAccountNftsKey,
  type ChildAccountNFTsStore,
  evmNftCollectionListKey,
  type EvmNftCollectionListStore,
  evmNftCollectionsDetailsPageKey,
  getCachedEvmCollectionNftItemListPage,
  getCachedCollectionNftItemsPage,
  nftCatalogCollectionsKey,
  collectionNftItemsPageKey,
  nftCollectionListKey,
  nftListKey,
  triggerEvmCollectionNftItemsPageRefresh,
  triggerNftCollectionRefresh,
} from '@/data-model/cache-data-keys';

import { useCachedData } from './use-data';

interface UseNftHookProps {
  network?: string;
  ownerAddress: string;
  collectionName: string;

  nftCount?: number;
}

interface UseNftHookResult {
  list: NFTItem[];
  allNfts: NFTItem[];
  filteredList: NFTItem[];
  info: any;
  total: number;
  loading: boolean;
  loadingMore: boolean;
  isLoadingAll: boolean;
  pageIndex: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setFilteredList: (list: NFTItem[]) => void;
  nextPage: (currentPage: number) => Promise<{ newItemsCount: number; nextPage: number } | null>;
  loadAllPages: () => Promise<void>;
  refreshCollectionImpl: () => Promise<void>;
}

export const useNftHook = ({
  network,
  ownerAddress,
  collectionName,

  nftCount,
}: UseNftHookProps): UseNftHookResult => {
  // Check if the collection is an EVM collection

  const isEvm = useMemo(() => isValidEthereumAddress(address), [address]);

  const getCollection = useCallback(
    async (ownerAddress: string, collection: string, offset: number | string = 0) => {
      consoleLog('getCollection', network, ownerAddress, collection, offset);
      if (!network) {
        return undefined;
      }
      if (isEvm) {
        return await getCachedEvmCollectionNftItemListPage(
          network,
          ownerAddress,
          collection,
          offset as number
        );
      }
      return await getCachedCollectionNftItemsPage(
        network,
        ownerAddress,
        collection,
        offset as number
      );
    },
    [network, isEvm]
  );

  const refreshCollection = useCallback(
    async (ownerAddress: string, collection: string, offset: number | string = 0) => {
      if (!network) {
        return;
      }
      if (isEvm) {
        triggerEvmCollectionNftItemsPageRefresh(
          network,
          ownerAddress,
          collection,
          offset as number
        );
      } else {
        triggerNftCollectionRefresh(network, ownerAddress, collection, offset as number);
      }
    },
    [network, isEvm]
  );

  const [list, setLists] = useState<NFTItem[]>([]);
  const [allNfts, setAllNfts] = useState<NFTItem[]>([]);
  const [filteredList, setFilteredList] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<any>(null);
  const [pageIndex, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const allNftsRef = useRef<NFTItem[]>([]);
  const evmOffset = useRef<string>('');
  //const hasAttemptedLoadAll = useRef(false);
  const total = useRef<number>(0);

  // Reset the ref when collection changes
  useEffect(() => {
    allNftsRef.current = [];
    setAllNfts([]);
    //hasAttemptedLoadAll.current = false;
    evmOffset.current = ''; // Reset the EVM offset when collection changes
  }, [ownerAddress, collectionName, network]);

  const evmNextPage = useCallback(
    async (currentPage: number): Promise<{ newItemsCount: number; nextPage: number } | null> => {
      if (loadingMore) return null;
      setLoadingMore(true);

      try {
        // For EVM, offset is a JWT token string returned from the previous API call
        const offsetToUse = evmOffset.current;

        const res = await getCollection(ownerAddress, collectionName, offsetToUse);

        if (res?.nfts && res?.nfts?.length > 0) {
          setLists((prev) => {
            // Simple array concat since each page has unique items
            const newList = [...prev, ...res.nfts];
            return newList;
          });
        }

        // Store the next offset (JWT token) for the next page
        if (res?.offset && typeof res?.offset === 'string') {
          evmOffset.current = res?.offset;
        } else {
          // No more pages available
          setLoadingMore(false);
          return null;
        }

        setPage(currentPage + 1);
        setLoadingMore(false);

        // Continue if we got a full page
        return {
          newItemsCount: res?.nfts?.length || 0,
          nextPage: currentPage + 1,
        };
      } catch (error) {
        consoleError('Error in evmNextPage:', error);
        setLoadingMore(false);
        return null;
      }
    },
    [getCollection, ownerAddress, collectionName, loadingMore]
  );

  const cadenceNextPage = useCallback(
    async (currentPage: number): Promise<{ newItemsCount: number; nextPage: number } | null> => {
      try {
        const offsetToUse = currentPage * 50;
        if (total.current <= offsetToUse) {
          return null;
        }

        getCollection(ownerAddress, collectionName, offsetToUse as any)
          .then((res) => {
            if (res?.nfts?.length > 0) {
              setLists((prev) => [...prev, ...res?.nfts]);
            }
          })
          .catch((error) => consoleError('Error in cadenceNextPage:', error));

        return null;
      } catch (error) {
        consoleError('Error in cadenceNextPage:', error);
        return null;
      }
    },
    [getCollection, ownerAddress, collectionName, setLists, total]
  );

  const loadAllPages = useCallback(async (): Promise<void> => {
    if (loadingMore || isLoadingAll) {
      return;
    }

    setIsLoadingAll(true);

    try {
      consoleLog('loadAllPages', network, ownerAddress, collectionName);
      const initialRes = await getCollection(ownerAddress, collectionName);
      if (!initialRes) {
        return;
      }
      setInfo(initialRes?.collection);
      total.current = nftCount || initialRes?.nftCount;

      const maxPages = Math.ceil(total.current / 50);

      if (!isEvm) {
        const requests = Array.from({ length: maxPages }, (_, i) => i).map((page) =>
          setTimeout(() => {
            cadenceNextPage(page);
          }, page * 10)
        );
        await Promise.all(requests);
      } else {
        // For EVM, keep sequential loading
        for (let i = 0; i < maxPages; i++) {
          const result = await evmNextPage(i);
          if (!result) break;
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      setFilteredList(list);
    } catch (err) {
      consoleError('Error in loadAllPages:', err);
    } finally {
      setIsLoadingAll(false);
    }
  }, [
    loadingMore,
    isLoadingAll,
    getCollection,
    ownerAddress,
    collectionName,
    isEvm,
    evmNextPage,
    cadenceNextPage,
    nftCount,
    list,
    network,
  ]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredList(list);
    }
  }, [list, searchTerm]);

  useEffect(() => {
    if (isLoadingAll && allNfts.length > 0) {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const filtered = allNfts.filter(
          (nft) =>
            nft.name?.toLowerCase().includes(searchLower) ||
            nft.id?.toLowerCase().includes(searchLower)
        );
        setFilteredList(filtered);
      } else {
        setFilteredList(allNfts);
      }
    }
  }, [isLoadingAll, allNfts, searchTerm]);

  // Initialize and load all NFTs
  useEffect(() => {
    if (!ownerAddress || !collectionName) {
      return;
    }

    const initialize = async () => {
      await loadAllPages();
    };

    initialize();
  }, [ownerAddress, collectionName, loadAllPages, network]);

  const refreshCollectionImpl = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // Use the provided refreshCollection function if available, otherwise fall back to getCollection
      const fetchFunction = refreshCollection || getCollection;
      const res = await fetchFunction(ownerAddress, collectionName);
      setInfo(res?.collection);
      total.current = res?.nftCount;
      setLists(res?.nfts);
    } catch (err) {
      consoleError('Error in refreshCollectionImpl:', err);
    } finally {
      setLoading(false);
    }
  }, [ownerAddress, collectionName, getCollection, refreshCollection]);

  return {
    list,
    allNfts,
    filteredList,
    info,
    total: total.current,
    loading,
    loadingMore,
    isLoadingAll,
    pageIndex,
    searchTerm,
    setSearchTerm,
    setFilteredList,
    nextPage: isEvm ? evmNextPage : cadenceNextPage,
    loadAllPages,
    refreshCollectionImpl,
  };
};

export const useSingleCollection = (
  network?: string,
  address?: string,
  collectionId?: string,
  offset?: number
) => {
  const collection = useCachedData<NftCollection>(
    network && address && collectionId && offset
      ? collectionNftItemsPageKey(network, address, collectionId, `${offset || 0}`)
      : null
  );

  return collection;
};

// Cadence collection IDs (NFT Catalog)
export const useNftCatalogCollections = (network?: string, address?: string) => {
  const collections = useCachedData<CadenceCollectionDetails[]>(
    network && address ? nftCatalogCollectionsKey(network, address) : null
  );

  return collections;
};

// EVM collection IDs
export const useEvmNftCollectionIds = (network?: string, address?: string) => {
  const evmNftIds = useCachedData<EvmCollectionDetails[]>(
    network && address ? evmNftCollectionsDetailsPageKey(network, address) : null
  );
  return evmNftIds;
};

export const useEvmNftCollectionList = (
  network?: string,
  address?: string,
  collectionIdentifier?: string,
  offset?: number
) => {
  const evmNftCollectionList = useCachedData<EvmNftCollectionListStore>(
    network && address && collectionIdentifier && offset
      ? evmNftCollectionListKey(network, address, collectionIdentifier, `${offset}`)
      : null
  );
  return evmNftCollectionList;
};

export const useNftCollectionList = (network?: string) => {
  const nftCollectionList = useCachedData<NftCollection[]>(
    network ? nftCollectionListKey(network) : null
  );
  return nftCollectionList;
};

export const useChildAccountNfts = (network?: string, parentAddress?: string) => {
  const childAccountNFTs = useCachedData<ChildAccountNFTsStore>(
    network && parentAddress ? childAccountNftsKey(network, parentAddress) : null
  );
  return childAccountNFTs;
};

export const useAllNftList = (network?: string, chainType?: 'evm' | 'flow') => {
  const allNftList = useCachedData<NFTModelV2[]>(
    network && chainType ? nftListKey(network, chainType) : null
  );
  return allNftList;
};
