import {
  childAccountNftsKey,
  evmCollectionNftsKey,
  evmNftCollectionsAndIdsKey,
  cadenceNftCollectionsAndIdsKey,
  fullCadenceNftCollectionListKey,
  nftListKey,
  cadenceCollectionNftsKey,
} from '@onflow/frw-data-model';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type NftCollection,
  type NFTModelV2,
  type NftCollectionAndIds,
  type CollectionNfts,
  type ChildAccountNftMap,
  type Nft,
} from '@onflow/frw-shared/types';
import { consoleError } from '@onflow/frw-shared/utils';

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
  list: Nft[];
  allNfts: Nft[];
  filteredList: Nft[];
  info: any;
  total: number;
  loading: boolean;
  loadingMore: boolean;
  isLoadingAll: boolean;
  pageIndex: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setFilteredList: (list: Nft[]) => void;
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
  const [list, setLists] = useState<Nft[]>([]);
  const [allNfts, setAllNfts] = useState<Nft[]>([]);
  const [filteredList, setFilteredList] = useState<Nft[]>([]);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<any>(null);
  const [pageIndex, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const allNftsRef = useRef<Nft[]>([]);
  const evmOffset = useRef<string>('');
  const hasAttemptedLoadAll = useRef(false);
  const total = useRef<number>(0);
  const initialized = useRef(false);

  // Reset the ref when collection changes
  useEffect(() => {
    allNftsRef.current = [];
    setAllNfts([]);
    hasAttemptedLoadAll.current = false;
    evmOffset.current = ''; // Reset the EVM offset when collection changes
  }, [ownerAddress, collectionName]);

  const evmNextPage = useCallback(
    async (currentPage: number): Promise<{ newItemsCount: number; nextPage: number } | null> => {
      if (loadingMore) return null;
      setLoadingMore(true);

      try {
        // For EVM, offset is a JWT token string returned from the previous API call
        const offsetToUse = evmOffset.current;

        const res = await getCollection(ownerAddress, collectionName, offsetToUse);

        if (res.nfts && res.nfts.length > 0) {
          setLists((prev) => {
            // Simple array concat since each page has unique items
            const newList = [...prev, ...res.nfts];
            return newList;
          });
        }

        // Store the next offset (JWT token) for the next page
        if (res.offset && typeof res.offset === 'string') {
          evmOffset.current = res.offset;
        } else {
          // No more pages available
          setLoadingMore(false);
          return null;
        }

        setPage(currentPage + 1);
        setLoadingMore(false);

        // Continue if we got a full page
        return {
          newItemsCount: res.nfts?.length || 0,
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
/**
 * @deprecated use useFullCadenceNftCollectionList instead
 */
export const useAllNftList = (network?: string, chainType?: 'evm' | 'flow') => {
  const allNftList = useCachedData<NFTModelV2[]>(
    network && chainType ? nftListKey(network, chainType) : null
  );
  return allNftList;
};
/**
 * List of all NFT collections on the flow network
 * @param network - The network to use
 * @returns NftCollection[]
 */
export const useFullCadenceNftCollectionList = (network?: string) => {
  const nftCollectionList = useCachedData<NftCollection[]>(
    network ? fullCadenceNftCollectionListKey(network) : null
  );
  return nftCollectionList;
};

/**
 * List of NFT collections and the ids of the nfts owned in each collection
 * @param network - The network to use
 * @param address - The address of the account
 * @returns NftCollectionAndIds[]
 */
export const useCadenceNftCollectionsAndIds = (network?: string, address?: string) => {
  const collections = useCachedData<NftCollectionAndIds[]>(
    network && address ? cadenceNftCollectionsAndIdsKey(network, address) : null
  );

  return collections;
};

/**
 * List of NFTs from a specific collection under a Cadence address
 * @param network - The network to use
 * @param address - The address of the account
 * @param collectionId - The id of the collection
 * @param offset - The offset of the nfts
 * @returns CollectionNfts
 */
export const useCadenceCollectionNfts = (
  network?: string,
  address?: string,
  collectionId?: string,
  offset?: number
) => {
  const collections = useCachedData<CollectionNfts>(
    network && address && collectionId && offset
      ? cadenceCollectionNftsKey(network, address, collectionId, `${offset}`)
      : null
  );

  return collections;
};

/**
 * ------------------------------
 * EVM NFTs
 * ------------------------------
 */

/**
 * List of NFT collections and the ids of the nfts owned in each collection on the EVM network
 * @param network - The network to use
 * @param address - The address of the account
 * @returns NftCollectionAndIds[]
 */
export const useEvmNftCollectionsAndIds = (network?: string, address?: string) => {
  const evmNftIds = useCachedData<NftCollectionAndIds[]>(
    network && address ? evmNftCollectionsAndIdsKey(network, address) : null
  );
  return evmNftIds;
};

/**
 * List of NFTs from a specific collection on the EVM network
 * @param network - The network to use
 * @param address - The address of the account
 * @param collectionIdentifier - The identifier of the collection
 * @param offset - The offset of the nfts
 * @returns CollectionNfts
 */
export const useEvmCollectionNfts = (
  network?: string,
  address?: string,
  collectionIdentifier?: string,
  offset?: number
) => {
  const evmNftCollectionList = useCachedData<CollectionNfts>(
    network && address && collectionIdentifier && offset
      ? evmCollectionNftsKey(network, address, collectionIdentifier, `${offset}`)
      : null
  );
  return evmNftCollectionList;
};

/**
 * ------------------------------
 * Child Account NFTs
 * ------------------------------
 */
/**
 * List of NFTs owned by a child account
 * @param network - The network to use
 * @param parentAddress - The address of the parent account
 * @returns ChildAccountNftMap
 */
export const useChildAccountNfts = (network?: string, parentAddress?: string) => {
  const childAccountNFTs = useCachedData<ChildAccountNftMap>(
    network && parentAddress ? childAccountNftsKey(network, parentAddress) : null
  );
  return childAccountNFTs;
};
