import { createPersistStore } from 'background/utils';
import { storage } from 'background/webapi';
import { NFTData, NFTCollectionData, NFTCollectionList } from './networkModel';
interface NftStore {
  nft: NFTNetwork;
  collection: NFTCollectionNetwork;
  collectionList: NFTCollectionListNetwork;
  expiry: number;
}
interface NFTCollectionNetwork {
  mainnet: NFTCollectionData[];
  testnet: NFTCollectionData[];
  crescendo: NFTCollectionData[];
}

interface NFTCollectionListNetwork {
  mainnet: NFTCollectionList[];
  testnet: NFTCollectionList[];
  crescendo: NFTCollectionData[];
}
interface NFTNetwork {
  mainnet: NFTData;
  testnet: NFTData;
  crescendo: NFTData;
}

// const empty: Contact = {
//   address: '',
//   avatar: '',
//   contactName: '',
//   contactType: 0,
//   domain: {
//     domainType:0,
//     value:'',
//   },
//   id: 0,
//   username: '',
// }

class NFT {
  store!: NftStore;

  init = async () => {
    this.store = await createPersistStore<NftStore>({
      name: 'nftv2',
      template: {
        nft: {
          testnet: {
            nfts: [],
            nftCount: 0,
          },
          mainnet: {
            nfts: [],
            nftCount: 0,
          },
          crescendo: {
            nfts: [],
            nftCount: 0,
          },
        },
        collectionList: {
          testnet: [],
          mainnet: [],
          crescendo: [],
        },
        collection: {
          testnet: [],
          mainnet: [],
          crescendo: [],
        },
        expiry: 2648570077405,
      },
    });
  };

  getExpiry = () => {
    return this.store.expiry;
  };

  setExpiry = (expiry: number) => {
    this.store.expiry = expiry;
  };

  getNft = (network: string): NFTData => {
    return this.store.nft[network];
  };

  setNft = (data: NFTData, network: string) => {
    const list = this.store.nft[network];
    data.nfts.forEach(nft => {
      const result = list.nfts.filter(i => i.unique_id === nft.unique_id)
      if (result.length === 0) {
        list.nfts.push(nft);
      }
    })
    this.store.nft[network] = {
      nfts: list.nfts,
      nftCount: data.nftCount
    }
  };

  getSingleCollection = (network: string, collectionId: string) => {
    return this.store.collection[network].find(i => i.name === collectionId);
  };

  setSingleCollection = (data: NFTCollectionData, network: string) => {
    const list = this.store.collection[network].find(i => i.name === data.name);
    data.nfts.forEach(nft => {
      const result = list.filter(i => i.unique_id === nft.unique_id)
      if (result.length === 0) {
        list.push(nft);
      }
    })
    this.deleteSingleCollection(data.name, network);
    this.store.collection[network].push({
      name: data.name,
      nfts: list,
      nfrCount: data.nftCount,
    })
  };

  deleteSingleCollection = (collectionId: string, network: string) => {
    const result = this.store.collection[network].filter(i => i.name !== collectionId)
    this.store.collection[network] = result;
  }

  getCollectionList = (network: string) => {
    return this.store.collectionList[network];
  };

  setCollectionList = (data: Array<any>, network: string) => {
    this.store.collectionList[network] = data;
  };

  clear = async () => {
    if (!this.store) {
      await this.init();
    }
    this.store.nft = {
      testnet: {
        nfts: [],
        nftCount: 0,
      },
      mainnet: {
        nfts: [],
        nftCount: 0,
      },
      crescendo: {
        nfts: [],
        nftCount: 0,
      },

    }

    this.store.collection = {
      testnet: [],
      mainnet: [],
      crescendo: [],
    }

    this.store.collectionList = {
      testnet: [],
      mainnet: [],
      crescendo: [],
    }

    storage.remove('nftv2')
    storage.remove('nft')
  };

  clearNFTList = () => {
    this.store.nft = {
      testnet: {
        nfts: [],
        nftCount: 0,
      },
      mainnet: {
        nfts: [],
        nftCount: 0,
      },
      crescendo: {
        nfts: [],
        nftCount: 0,
      },
    }
  }

  clearNFTCollection = () => {
    this.clear();
  }

}

export default new NFT();
