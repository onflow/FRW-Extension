import { createPersistStore } from 'background/utils';

import { type EvmNFTIds, type EvmNFTCollectionList } from '../../shared/types/nft-types';
interface EvmNftsStore {
  collectionList: {
    mainnet: {
      [collectionIdentifier: string]: {
        [offset: number]: {
          data: EvmNFTCollectionList;
          expiry: number;
        };
      };
    };
    testnet: {
      [collectionIdentifier: string]: {
        [offset: number]: {
          data: EvmNFTCollectionList;
          expiry: number;
        };
      };
    };
  };
  NftIds: {
    mainnet: {
      data: EvmNFTIds[];
      expiry: number;
    };
    testnet: {
      data: EvmNFTIds[];
      expiry: number;
    };
  };
}

const EXPIRY_TIME = 60 * 1000; // 60 seconds in milliseconds

class EvmNfts {
  store!: EvmNftsStore;

  init = async () => {
    const currentTime = Date.now();
    this.store = await createPersistStore<EvmNftsStore>({
      name: 'evmNfts',
      template: {
        collectionList: {
          mainnet: {},
          testnet: {},
        },
        NftIds: {
          mainnet: { data: [], expiry: currentTime },
          testnet: { data: [], expiry: currentTime },
        },
      },
    });
  };

  getNftIds = (network: string): EvmNFTIds[] | null => {
    const nftIds = this.store.NftIds[network];
    if (!nftIds || Date.now() > nftIds.expiry) {
      return null;
    }
    return nftIds.data;
  };

  setNftIds = (data: EvmNFTIds[], network: string) => {
    const expiry = Date.now() + EXPIRY_TIME;
    this.store.NftIds[network] = { data, expiry };
  };

  //return null if expired, get based on the offset and collectionIdentifier
  getSingleCollection = (
    network: string,
    collectionIdentifier: string,
    offset: number
  ): EvmNFTCollectionList | null => {
    const collection = this.store.collectionList[network][collectionIdentifier]?.[offset];
    if (!collection || Date.now() > collection.expiry) {
      return null;
    }
    return collection.data;
  };

  setSingleCollection = (
    data: EvmNFTCollectionList,
    collectionIdentifier: string,
    offset: number,
    network: string
  ) => {
    const expiry = Date.now() + EXPIRY_TIME;
    if (!this.store.collectionList[network][collectionIdentifier]) {
      this.store.collectionList[network][collectionIdentifier] = {};
    }
    this.store.collectionList[network][collectionIdentifier][offset] = { data, expiry };
  };

  deleteSingleCollection = (collectionIdentifier: string, offset: number, network: string) => {
    if (this.store.collectionList[network][collectionIdentifier]) {
      delete this.store.collectionList[network][collectionIdentifier][offset];
    }
  };

  clearEvmNfts = async () => {
    if (!this.store) {
      await this.init();
    }
    this.store.NftIds = {
      testnet: { data: [], expiry: 0 },
      mainnet: { data: [], expiry: 0 },
    };
    this.store.collectionList = {
      testnet: {},
      mainnet: {},
    };
  };
}

export default new EvmNfts();
