import * as fcl from '@onflow/fcl';

import {
  type NftCollection,
  type NFTModelV2,
} from '@onflow/flow-wallet-shared/types/network-types';
import {
  type NFTCollectionData,
  type CollectionNftList,
} from '@onflow/flow-wallet-shared/types/nft-types';

import {
  childAccountAllowTypesKey,
  childAccountAllowTypesRefreshRegex,
  childAccountNftsKey,
  childAccountNFTsRefreshRegex,
  type ChildAccountNFTsStore,
  nftCatalogCollectionsKey,
  nftCatalogCollectionsRefreshRegex,
  nftCollectionKey,
  nftCollectionListKey,
  nftCollectionListRefreshRegex,
  nftCollectionRefreshRegex,
  nftListKey,
  nftListRefreshRegex,
} from '@/data-model/cache-data-keys';

import openapiService, { getScripts } from './openapi';
import { getValidData, registerRefreshListener, setCachedData } from '../utils/data-cache';
import { fclConfirmNetwork } from '../utils/fclConfig';

class NFT {
  init = async () => {
    registerRefreshListener(nftCatalogCollectionsRefreshRegex, this.loadNftCatalogCollections);
    registerRefreshListener(nftCollectionRefreshRegex, this.loadSingleNftCollection);
    registerRefreshListener(childAccountAllowTypesRefreshRegex, this.loadChildAccountAllowTypes);
    registerRefreshListener(childAccountNFTsRefreshRegex, this.loadChildAccountNFTs);
    registerRefreshListener(nftCollectionListRefreshRegex, this.loadNftCollectionList);
    registerRefreshListener(nftListRefreshRegex, this.loadNftList);
  };

  /**
   * Gets all accessible NFTs for a specific child account
   *
   * The getAccessibleChildAccountNFTs script is a comprehensive NFT discovery and inventory function
   * that provides a complete view of all NFTs accessible through child accounts.
   *
   * Parents get a bird's-eye view of all NFTs they can manage across all child accounts
   *
   * @param network - The network to get the NFTs for
   * @param parentAddress - The address of the parent account
   * @returns ChildAccountNFTsStore or undefined if the network is switched.
   *
   * Returns comprehensive inventory: A nested structure showing all NFTs across all child accounts
   *
   * Example:
   * {
   *  "0x123": {
   *    "ExampleNFT.NFT": [1, 2, 3, 5, 8],
   *    "CryptoKitties.Kitty": [42, 1337]
   *  },
   *  "0x456": {
   *    "FlowToken.NFT": [100, 101, 102],
   *    "ExampleNFT.NFT": [10, 11]
   *  }
   * }
   */
  loadChildAccountNFTs = async (
    network: string,
    parentAddress: string
  ): Promise<ChildAccountNFTsStore | undefined> => {
    if (!(await fclConfirmNetwork(network))) {
      // Do nothing if the network is switched
      // Don't update the cache
      return undefined;
    }
    const script = await getScripts(network, 'hybridCustody', 'getAccessibleChildAccountNFTs');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(parentAddress, t.Address)],
    });

    setCachedData(childAccountNftsKey(network, parentAddress), result);

    return result;
  };

  /**
   * Gets all accessible provider types (NFT and FT) for a specific child account
   * The getChildAccountAllowTypes script is a query function that discovers what types of assets a parent account can access within a specific child account. It returns an array of strings containing the type identifiers of all accessible asset types
   * What Are "Accessible Provider Types"?
   * The "accessible provider types" are the specific token/asset types that the parent can withdraw from the child account. These are represented as type identifiers (strings) that identify:
   * - NFT Collections: Like "ExampleNFT.Collection", "FlowToken.NFT", etc.
   * - Fungible Token Vaults: Like "FlowToken.Vault", "USDC.Vault", etc.
   * This script is crucial for determining what assets a parent can access within a child account.
   * @param network - The network to get the allow types for
   * @param parentAddress - The address of the parent account
   * @param childAddress - The address of the child account
   * @returns The allow types for the child account
   */
  loadChildAccountAllowTypes = async (
    network: string,
    parentAddress: string,
    childAddress: string
  ) => {
    if (!(await fclConfirmNetwork(network))) {
      // Do nothing if the network is switched
      // Don't update the cache
      return undefined;
    }
    const script = await getScripts(network, 'hybridCustody', 'getChildAccountAllowTypes');
    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(parentAddress, t.Address), arg(childAddress, t.Address)],
    });
    setCachedData(childAccountAllowTypesKey(network, parentAddress, childAddress), result);
    return result;
  };

  loadNftCatalogCollections = async (
    network: string,
    address: string
  ): Promise<CollectionNftList[]> => {
    if (!(await fclConfirmNetwork(network))) {
      // Do nothing if the network is switched
      // Don't update the cache
      return [];
    }
    const data = await openapiService.nftCatalogCollections(address!, network);
    if (!data || !Array.isArray(data)) {
      return [];
    }
    // Sort by count, maintaining the new collection structure
    const sortedList = [...data].sort((a, b) => b.count - a.count);

    setCachedData(nftCatalogCollectionsKey(network, address), sortedList);
    return sortedList;
  };

  loadSingleNftCollection = async (
    network: string,
    address: string,
    collectionId: string,
    offset: string
  ): Promise<NFTCollectionData | undefined> => {
    if (!(await fclConfirmNetwork(network))) {
      // Do nothing if the network is switched
      // Don't update the cache
      return undefined;
    }
    const offsetNumber = parseInt(offset) || 0;
    const data = await openapiService.nftCatalogCollectionList(
      address!,
      collectionId,
      50,
      offsetNumber,
      network
    );

    data.nfts.map((nft) => {
      nft.unique_id = nft.collectionName + '_' + nft.id;
    });
    function getUniqueListBy(arr, key) {
      return [...new Map(arr.map((item) => [item[key], item])).values()];
    }
    const unique_nfts = getUniqueListBy(data.nfts, 'unique_id');
    data.nfts = unique_nfts;

    setCachedData(nftCollectionKey(network, address, collectionId, `${offset}`), data);

    return data;
  };

  loadNftCollectionList = async (network: string): Promise<NftCollection[]> => {
    const data = await openapiService.getNFTV2CollectionList(network);
    if (!data || !Array.isArray(data)) {
      throw new Error('Could not load nft collection list');
    }
    setCachedData(nftCollectionListKey(network), data);
    return data;
  };

  getSingleCollection = async (
    network: string,
    address: string,
    collectionId: string,
    offset: number
  ): Promise<NFTCollectionData | undefined> => {
    const cachedData = await getValidData<NFTCollectionData>(
      nftCollectionKey(network, address, collectionId, `${offset}`)
    );
    if (!cachedData) {
      return this.loadSingleNftCollection(network, address, collectionId, `${offset}`);
    }
    return cachedData;
  };

  getNftCatalogCollections = async (
    network: string,
    address: string
  ): Promise<CollectionNftList[] | undefined> => {
    const collections = await getValidData<CollectionNftList[]>(
      nftCatalogCollectionsKey(network, address)
    );
    if (!collections) {
      return this.loadNftCatalogCollections(network, address);
    }
    return collections;
  };

  getNftCollectionList = async (network: string): Promise<NftCollection[] | undefined> => {
    const collections = await getValidData<NftCollection[]>(nftCollectionListKey(network));
    if (!collections) {
      return this.loadNftCollectionList(network);
    }
    return collections;
  };

  /**
   * Get the list of NFTs for a given network
   * @param network - The network to get the NFTs for
   * @returns The list of NFTs
   */
  getNftList = async (network: string, chainType: string): Promise<NFTModelV2[]> => {
    const nftList = await getValidData<NFTModelV2[]>(nftListKey(network, chainType));
    if (!nftList) {
      return this.loadNftList(network, chainType);
    }
    return nftList;
  };

  /**
   * Load the list of NFTs for a given network
   * @param network - The network to get the NFTs for
   * @param chainType - The chain type to get the NFTs for
   * @returns The list of NFTs
   */
  loadNftList = async (network: string, chainType: string): Promise<NFTModelV2[]> => {
    if (chainType !== 'evm' && chainType !== 'flow') {
      throw new Error('Invalid chain type');
    }
    const data = await openapiService.getNFTList(network, chainType);

    if (!data || !Array.isArray(data)) {
      throw new Error('Could not load nft collection list');
    }
    setCachedData(nftListKey(network, chainType), data);
    return data;
  };

  clear = async () => {
    // Just gonna ingore this for now
  };

  clearNFTCollection = () => {
    // Just gonna ingore this for now
  };
}

export default new NFT();
