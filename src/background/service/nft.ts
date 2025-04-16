import * as fcl from '@onflow/fcl';

import {
  nftCatalogCollectionsKey,
  nftCatalogCollectionsRefreshRegex,
  nftCollectionKey,
  nftCollectionRefreshRegex,
  childAccountAllowTypesKey,
  childAccountAllowTypesRefreshRegex,
  childAccountNFTsKey,
  childAccountNFTsRefreshRegex,
} from '@/shared/utils/cache-data-keys';
import { getValidData, registerRefreshListener, setCachedData } from 'background/utils/data-cache';

import { type NFTCollectionData, type NFTCollections } from '../../shared/types/nft-types';
import { fclConfirmNetwork, fclEnsureNetwork } from '../fclConfig';

import openapiService, { getScripts } from './openapi';

class NFT {
  init = async () => {
    registerRefreshListener(nftCatalogCollectionsRefreshRegex, this.loadNftCatalogCollections);
    registerRefreshListener(nftCollectionRefreshRegex, this.loadSingleNftCollection);
    registerRefreshListener(childAccountAllowTypesRefreshRegex, this.loadChildAccountAllowTypes);
    registerRefreshListener(childAccountNFTsRefreshRegex, this.loadChildAccountNFTs);
  };

  loadChildAccountNFTs = async (network: string, address: string) => {
    if (!(await fclConfirmNetwork(network))) {
      // Do nothing if the network is switched
      // Don't update the cache
      return undefined;
    }
    const script = await getScripts(network, 'hybridCustody', 'getAccessibleChildAccountNFTs');

    const result = await fcl.query({
      cadence: script,
      args: (arg, t) => [arg(address, t.Address)],
    });
    console.log('check child nft info result----=====', structuredClone(result));

    setCachedData(childAccountNFTsKey(network, address), result);

    return result;
  };

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
  ): Promise<NFTCollections[]> => {
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

  getCollectionList = async (
    network: string,
    address: string
  ): Promise<NFTCollections[] | undefined> => {
    const collections = await getValidData<NFTCollections[]>(
      nftCatalogCollectionsKey(network, address)
    );
    if (!collections) {
      return this.loadNftCatalogCollections(network, address);
    }
    return collections;
  };

  clear = async () => {
    // Just gonna ingore this for now
  };

  clearNFTCollection = () => {
    // Just gonna ingore this for now
  };
}

export default new NFT();
