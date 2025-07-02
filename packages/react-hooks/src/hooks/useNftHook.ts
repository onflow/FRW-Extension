import { useState, useEffect, useRef, useCallback } from 'react';

import { type NFTModelV2, type NftCollection } from '@/shared/types/network-types';
import { type NFTCollections, type NFTItem } from '@/shared/types/nft-types';
import {
  evmNftIdsKey,
  type EvmNftIdsStore,
  nftCatalogCollectionsKey,
  evmNftCollectionListKey,
  type EvmNftCollectionListStore,
  nftCollectionListKey,
  childAccountNftsKey,
  type ChildAccountNFTsStore,
  nftListKey,
} from '@/shared/utils/cache-data-keys';
import { consoleError } from '@/shared/utils/console-log';

import { useCachedData } from './use-data';

interface UseNftHookProps {
  getCollection: (
    ownerAddress: string,
    collection: string,
    offset?: number | string
  ) => Promise<any>;
  refreshCollection?: (
    ownerAddress: string,
    collection: string,
    offset?: number | string
  ) => Promise<any>;
  ownerAddress: string;
  collectionName: string;
  isEvm: boolean;
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
  getCollection,
  refreshCollection,
  ownerAddress,
  collectionName,
  isEvm,
  nftCount,
}: UseNftHookProps): UseNftHookResult => {
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
  const hasAttemptedLoadAll = useRef(false);
  const total = useRef<number>(0);
  const initialized = useRef(false);

  // Reset the ref when collection changes
  useEffect(() => {
    allNftsRef.current = [];
    setAllNfts([]);
    hasAttemptedLoadAll.current = false;
  }, [ownerAddress, collectionName]);

  const evmNextPage = useCallback(
    async (currentPage: number): Promise<{ newItemsCount: number; nextPage: number } | null> => {
      if (loadingMore) return null;
      setLoadingMore(true);

      try {
        const offsetToUse = evmOffset.current;

        const res = await getCollection(ownerAddress, collectionName, offsetToUse);

        setLists((prev) => {
          // Simple array concat since each page has unique items
          const newList = [...prev, ...res.nfts];
          return newList;
        });

        if (!res.offset) {
          setLoadingMore(false);
          return null;
        }
        evmOffset.current = res.offset;

        setPage(currentPage + 1);
        setLoadingMore(false);

        // Continue if we got a full page
        return {
          newItemsCount: res.nfts.length,
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
      if (!hasAttemptedLoadAll.current) {
        return null;
      }

      try {
        const offsetToUse = currentPage * 50;
        if (total.current <= offsetToUse) {
          return null;
        }

        getCollection(ownerAddress, collectionName, offsetToUse as any)
          .then((res) => {
            if (res.nfts?.length > 0) {
              setLists((prev) => [...prev, ...res.nfts]);
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
    if (loadingMore || isLoadingAll || hasAttemptedLoadAll.current) {
      return;
    }

    setIsLoadingAll(true);

    try {
      const initialRes = await getCollection(ownerAddress, collectionName);
      setInfo(initialRes.collection);
      total.current = nftCount || initialRes.nftCount;

      const maxPages = Math.ceil(total.current / 50);

      if (!isEvm) {
        hasAttemptedLoadAll.current = true;
        const requests = Array.from({ length: maxPages }, (_, i) => i).map((page) =>
          setTimeout(() => {
            if (!hasAttemptedLoadAll.current) return;
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
    if (!ownerAddress || !collectionName || initialized.current) {
      return;
    }

    const initialize = async () => {
      initialized.current = true;
      await loadAllPages();
    };

    initialize();
  }, [ownerAddress, collectionName, loadAllPages]);

  const refreshCollectionImpl = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // Use the provided refreshCollection function if available, otherwise fall back to getCollection
      const fetchFunction = refreshCollection || getCollection;
      const res = await fetchFunction(ownerAddress, collectionName);
      setInfo(res.collection);
      total.current = res.nftCount;
      setLists(res.nfts);
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

export const useNftCatalogCollections = (network?: string, address?: string) => {
  const collections = useCachedData<NFTCollections[]>(
    network && address ? nftCatalogCollectionsKey(network, address) : null
  );

  return collections;
};

export const useEvmNftIds = (network?: string, address?: string) => {
  const evmNftIds = useCachedData<EvmNftIdsStore>(
    network && address ? evmNftIdsKey(network, address) : null
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
