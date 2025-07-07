import { isValidEthereumAddress } from '@/shared/utils/address';
import {
  evmNftCollectionListKey,
  evmNftCollectionListRefreshRegex,
  evmNftIdsKey,
  evmNftIdsRefreshRegex,
} from '@/shared/utils/cache-data-keys';

import { registerRefreshListener, setCachedData } from '../utils/data-cache';
import { fclConfirmNetwork } from '../utils/fclConfig';

import { openapiService } from '.';

class EvmNfts {
  init = async () => {
    registerRefreshListener(evmNftCollectionListRefreshRegex, this.loadEvmCollectionList);
    registerRefreshListener(evmNftIdsRefreshRegex, this.loadEvmNftIds);
  };

  loadEvmNftIds = async (network: string, address: string) => {
    if (!(await fclConfirmNetwork(network))) {
      // Do nothing if the network is switched
      // Don't update the cache
      return [];
    }
    const result = await openapiService.EvmNFTID(network, address);

    setCachedData(evmNftIdsKey(network, address), result);
    return result;
  };

  loadEvmCollectionList = async (
    network: string,
    address: string,
    collectionIdentifier: string,
    offset: string
  ) => {
    if (!isValidEthereumAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    if (!(await fclConfirmNetwork(network))) {
      // Do nothing if the network is switched
      // Don't update the cache
      return [];
    }

    const result = await openapiService.EvmNFTcollectionList(
      address,
      collectionIdentifier,
      50,
      parseInt(offset) || 0
    );

    setCachedData(evmNftCollectionListKey(network, address, collectionIdentifier, offset), result);
    return result;
  };

  clearEvmNfts = async () => {};
}

export default new EvmNfts();
