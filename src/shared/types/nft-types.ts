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

type EvmNFTItem = {
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
  nfts: EvmNFTItem[];
  nftCount: number;
  collection: NFTCollection;
};

//Cadence NFT types
type CollectionPath = {
  storage_path: string;
  public_path: string;
  private_path: string;
};

type CollectionSocials = {
  twitter?: {
    url: string;
  };
  discord?: {
    url: string;
  };
};

type Collection = {
  id: string;
  contract_name: string;
  address: string;
  name: string;
  logo: string;
  banner: string;
  description: string;
  path: CollectionPath;
  socials: CollectionSocials;
  nftTypeId: string;
};

export type NFTCollections = {
  collection: Collection;
  ids: string[];
  count: number;
};

type NFTTrait = {
  name: string;
  value: string;
  displayType: string | null;
  rarity: string | null;
};

type NFTRoyaltyCutInfo = {
  receiver: {
    address: string;
    borrowType: any;
  };
  cut: string;
  description: string;
};

type NFTRoyalties = {
  cutInfos: NFTRoyaltyCutInfo[];
};

type NFTPostMedia = {
  image: string;
  isSvg: boolean;
  description: string;
  title: string;
};

type NFTItem = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  externalURL: string;
  collectionName: string;
  collectionContractName: string;
  contractAddress: string;
  collectionDescription: string;
  collectionSquareImage: string;
  collectionBannerImage: string;
  collectionExternalURL: string;
  traits: NFTTrait[];
  royalties: NFTRoyalties;
  postMedia: NFTPostMedia;
  flowIdentifier: string;
};

export type NFTCollectionData = {
  nftCount: number;
  nfts: NFTItem[];
  collection: Collection;
};
