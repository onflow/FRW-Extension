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
/**
 * The details of a Cadence collection with its NFT ids and count
 */
export type CadenceCollectionDetails = {
  collection: Collection;
  ids: string[];
  count: number;
};

export type CadenceCollectionDetailsList = CadenceCollectionDetails[];

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

export type NFTItem = {
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

export type CollectionNftItemList = {
  nftCount: number;
  nfts: NFTItem[];
  collection: Collection;
};
export type CollectionNftItemListPage = CollectionNftItemList & {
  offset: string | number | null;
};

/**
 * EVM NFTtypes
 */
type EvmNFTCollection = {
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

// An Evm collection with its NFT ids and count
export type EvmCollectionDetails = {
  collection: EvmNFTCollection;
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

export type EvmCollectionNftItemList = {
  nftCount: number;
  nfts: EvmNFTItem[];
  collection: EvmNFTCollection;
};

export type EvmCollectionNftItemListPage = EvmCollectionNftItemList & {
  offset: string | null; // For EVM, offset can be a JWT token string or a number, null if no more pages
};
