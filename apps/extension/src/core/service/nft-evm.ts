import {
  type EvmCollectionNftItemListPage,
  type EvmCollectionDetails,
} from '@onflow/flow-wallet-shared/types';
import { isValidEthereumAddress } from '@onflow/flow-wallet-shared/utils/address';

import {
  evmCollectionNftItemsPageRefreshRegex,
  entireEvmCollectionNftItemsRefreshRegex,
  evmCollectionDetailsRefreshRegex,
  evmCollectionDetailsKey,
  evmCollectionNftItemsPageKey,
  NFT_LIST_PAGE_SIZE,
  type EntireEvmCollectionNftItemsStore,
} from '@/data-model/cache-data-keys';

import { openapiService } from '.';
import { registerRefreshListener, setCachedData } from '../utils/data-cache';
import { fclConfirmNetwork } from '../utils/fclConfig';

class EvmNfts {
  init = async () => {
    registerRefreshListener(
      evmCollectionNftItemsPageRefreshRegex,
      this.loadEvmCollectionNftItemListPage
    );
    registerRefreshListener(evmCollectionDetailsRefreshRegex, this.loadEvmCollectionDetailsList);
    registerRefreshListener(
      entireEvmCollectionNftItemsRefreshRegex,
      this.loadEntireEvmCollectionList
    );
  };

  loadEvmCollectionDetailsList = async (
    network: string,
    address: string
  ): Promise<EvmCollectionDetails[]> => {
    if (!(await fclConfirmNetwork(network))) {
      // Do nothing if the network is switched
      // Don't update the cache
      return [];
    }
    const result = await openapiService.fetchEvmNftCollectionDetailsList(network, address);

    setCachedData(evmCollectionDetailsKey(network, address), result);
    return result;
  };

  loadEvmCollectionNftItemListPage = async (
    network: string,
    address: string,
    collectionIdentifier: string,
    offset: string // For EVM, offset can be a JWT token string or a number
  ): Promise<EvmCollectionNftItemListPage | undefined> => {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    if (!(await fclConfirmNetwork(network))) {
      // Do nothing if the network is switched
      // Don't update the cache
      return undefined;
    }

    // For EVM, offset can be a JWT token string
    // Don't convert to integer if it's a JWT token
    const offsetParam = offset && !isNaN(Number(offset)) ? parseInt(offset) : offset;

    const result = await openapiService.fetchEvmCollectionNftItemListPage(
      address,
      collectionIdentifier,
      NFT_LIST_PAGE_SIZE,
      offsetParam as string | number
    );

    setCachedData(
      evmCollectionNftItemsPageKey(network, address, collectionIdentifier, offset),
      result
    );
    return result;
  };

  loadEntireEvmCollectionList = async (
    network: string,
    address: string,
    collectionIdentifier: string
  ): Promise<EntireEvmCollectionNftItemsStore | undefined> => {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    if (!(await fclConfirmNetwork(network))) {
      // Do nothing if the network is switched
      // Don't update the cache
      return undefined;
    }

    // We can't run this in parallel as we don't know the total number of pages
    // So we need to run it sequentially
    let entireEvmCollectionNftItemList: EntireEvmCollectionNftItemsStore | undefined = undefined;
    let offset = '';
    do {
      const evmNftCollectionListPage = await this.loadEvmCollectionNftItemListPage(
        network,
        address,
        collectionIdentifier,
        offset
      );
      if (!evmNftCollectionListPage) {
        break;
      }
      if (!entireEvmCollectionNftItemList) {
        entireEvmCollectionNftItemList = {
          nftCount: evmNftCollectionListPage.nftCount,
          nfts: [...evmNftCollectionListPage.nfts],
          collection: evmNftCollectionListPage.collection,
        };
      } else {
        entireEvmCollectionNftItemList.nfts = [
          ...entireEvmCollectionNftItemList.nfts,
          ...evmNftCollectionListPage.nfts,
        ];
        entireEvmCollectionNftItemList.nftCount += evmNftCollectionListPage.nftCount;
      }
      offset = evmNftCollectionListPage.offset ?? '';
    } while (offset);

    return entireEvmCollectionNftItemList;
  };

  clearEvmNfts = async () => {};
}

export default new EvmNfts();
