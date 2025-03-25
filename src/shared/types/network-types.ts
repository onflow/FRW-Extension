// Import the fcl types

export type { Account, AccountKey } from '@onflow/typedefs';

export interface CheckResponse {
  unique: boolean;
  username: string;
}

export enum PriceProvider {
  binance = 'binance',
  kakren = 'kraken',
  huobi = 'huobi',
  coinbase = 'coinbase-pro',
  kucoin = 'kucoin',
  increment = 'increment',
}

export interface TokenModel {
  name: string;
  address: FlowNetworkModel;
  contract_name: string;
  storage_path: FlowTokenStoragePath;
  decimal: number;
  icon: string;
  symbol: string;
  website: string | null;
}
export interface NFTModel_depreciated {
  name: string;
  id: string;
  address: string;
  contract_name: string;
  logo: string | null;
  banner: string | null;
  official_website: string | null;
  marketplace: string | null;
  description: string | null;
  path: NFTPath_depreciated;
}
export interface NFTPath_depreciated {
  storage_path: string;
  public_path: string;
  public_collection_name: string;
  public_type: string;
  private_type: string;
}

export interface NFTModelV2 {
  chainId: number;
  address: string;
  contractName: string;
  path: NFTPathV2;
  evmAddress?: string;
  flowAddress: string;
  name: string;
  description: string | null;
  logoURI: string | null;
  bannerURI: string | null;
  tags: string[];
  extensions: {
    discord?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}
export interface NFTPathV2 {
  storage: string;
  public: string;
}

export interface SecureCadenceCompatible {
  mainnet: boolean;
  testnet: boolean;
}

export interface FlowNetworkModel {
  mainnet: string | null;
  testnet: string | null;
}

export interface FlowTokenStoragePath {
  balance: string;
  vault: string;
  receiver: string;
}

export enum FlowNetwork {
  mainnet = 'mainnet',
  testnet = 'testnet',
  crescendo = 'crescendo',
}

export enum Period {
  oneDay = '1D',
  oneWeek = '1W',
  oneMonth = '1M',
  threeMonth = '3M',
  oneYear = '1Y',
  all = 'All',
}

export enum PeriodFrequency {
  fiveMinute = 300,
  halfHour = 1800,
  oneHour = 3600,
  oneDay = 86400,
  threeDay = 259200,
  oneWeek = 604800,
}

/**
 * 0: External - an external address
 * 1: Address Book - a contact in the address book
 * 2: Domain - from a domain name
 * 4: User - a flow wallet user
 */

export const ContactType = {
  External: 0,
  AddressBook: 1,
  Domain: 2,
  User: 4,
} as const;

export interface Contact {
  id: number;
  address: string;
  avatar?: string;
  domain?: Domain;
  contact_name: string;
  username?: string;
  contact_type?: (typeof ContactType)[keyof typeof ContactType];
  group?: string;
}

export enum FlowDomain {
  find = 0,
  flowns = 1,
  meow = 2,
  none = 999,
}

export interface NFTData {
  nfts: any[];
  nftCount: number;
}

export interface Domain {
  domain_type: FlowDomain;
  value: string;
}

export interface StorageInfo {
  available: number;
  used: number;
  capacity: number;
}

// All UFix64 decimal values
// This is similar to the fcl Account type but not exactly the same
// The fcl Account type uses a 10^8 number for the balance and does not include availableBalance or storageUsed
export interface AccountBalanceInfo {
  address: string;
  balance: string;
  availableBalance: string;
  storageUsed: string;
  storageCapacity: string;
}
// This is an underscore case version of the fcl AccountKey type
export interface AccountKeyRequest {
  hash_algo: number;
  public_key: string;
  sign_algo: number;
  weight: number;
}

export interface SignInResponse {
  custom_token: string;
  id: string;
}

export interface UserInfoResponse {
  avatar: string;
  nickname: string;
  username: string;
}

export interface UserWalletResponse {
  id: string;
  primary_wallet: number;
  username: string;
  wallets: Array<WalletResponse>;
}

export interface WalletResponse {
  color: string;
  icon: string;
  name: string;
  chain_id: string;
  wallet_id: number;
  blockchain: Array<BlockchainResponse>;
}

export interface BlockchainResponse {
  name: string;
  address: string;
  chain_id: string;
  coins: Array<string>;
  id: number;
  icon: string;
  color: string;
}

export interface WalletType {
  name: string;
  icon: string;
  address: string;
  chain_id: string;
  id: number;
  coins: string[];
  color: string;
}

interface Thumbnail {
  url: string;
}

export interface AccountDetails {
  name: string;
  description: string;
  thumbnail: Thumbnail;
}

export interface ChildAccountMap {
  [key: string]: AccountDetails;
}

export interface FlowArgument {
  type: string;
  value: string;
}

export interface FlowTransactionProposalKey {
  address: string;
  key_index: number;
  sequence_number?: string;
}

export interface TransactionSignature {
  address: string;
  key_index: number;
  signature: string;
}

export interface ServerChain {
  id: string;
  community_id: number;
  name: string;
  native_token_id: string;
  logo_url: string;
  wrapped_token_id: string;
  symbol: string;
}

export interface Tx {
  chainId: number;
  data: string;
  from: string;
  gas: string;
  gasPrice: string;
  nonce: string;
  to: string;
  value: string;
  r?: string;
  s?: string;
  v?: string;
}

export interface TotalBalanceResponse {
  total_usd_value: number;
  chain_list: string[];
}

export interface TokenItem {
  amount: number;
  chain: string;
  decimals: number;
  display_symbol: string | null;
  id: string;
  is_core: boolean;
  is_verified: boolean;
  is_wallet: boolean;
  is_infinity?: boolean;
  logo_url: string;
  name: string;
  optimized_symbol: string;
  price: number;
  symbol: string;
  time_at: number;
  usd_value?: number;
  raw_amount?: number;
}

export interface RPCResponse<T> {
  result: T;
  id: number;
  jsonrpc: string;
  error?: {
    code: number;
    message: string;
  };
}

export interface GetTxResponse {
  blockHash: string;
  blockNumber: string;
  from: string;
  gas: string;
  gasPrice: string;
  hash: string;
  input: string;
  nonce: string;
  to: string;
  transactionIndex: string;
  value: string;
  type: string;
  v: string;
  r: string;
  s: string;
  front_tx_count: number;
  code: 0 | -1; // 0: success, -1: failed
  status: -1 | 0 | 1; // -1: failed, 0: pending, 1: success
  gas_used: number;
  token: TokenItem;
}

export interface TransactionItem {
  coin: string;
  interactions: string;
  status: string;
  authorizers: string[];
  proposer: string;
  payer: string;
  hash: string;
  time: number;
  interaction: string;
  amount: number;
  error?: string;
}

export interface ContractRecord {
  identifier: string;
}
export interface TransactionRecord {
  error: string;
  contractInteractions: ContractRecord;
  eventCount: number;
  authorizers: string[];
  proposer: string;
  payer: string;
  hash: string;
  time: number;
  interaction: string;
  amount: number;
}

export interface DeviceInfoRequest {
  device_id: string;
  ip: string;
  name: string;
  type: string;
  user_agent: string;

  continent?: string;
  continentCode?: string;
  country?: string;
  countryCode?: string;
  regionName?: string;
  city?: string;
  district?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  currency?: string;
  isp?: string;
  org?: string;
}

export interface DeviceInfo {
  account_key: AccountKeyRequest;
  device_info: DeviceInfoRequest;
}

export {
  type NewsItem,
  type NewsPriority,
  type NewsType,
  type NewsDisplayType,
  type NewsConditionType,
} from '@/shared/types/news-types';

export type NetworkType = 'mainnet' | 'testnet';
