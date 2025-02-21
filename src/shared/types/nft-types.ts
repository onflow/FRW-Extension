type NFTCollection = {
  id: string;
  address: string;
  contractName: string;
  contract_name: string;
  evmAddress: string;
  name: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  flowIdentifier: string;
};

export type EvmNFTIds = {
  collection: NFTCollection;
  ids: string[];
  count: number;
};

type NFTItem = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  externalURL: string;
  collectionName: string;
  contractAddress: string;
  postMedia: {
    image: string;
    isSvg: boolean;
    description: string;
    title: string;
  };
};

export type EvmNFTCollectionList = {
  nfts: NFTItem[];
  nftCount: number;
  collection: NFTCollection;
};
