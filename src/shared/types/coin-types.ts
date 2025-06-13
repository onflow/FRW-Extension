import type { TokenInfo } from '@/shared/types/token-info';

export type CoinItem = {
  id: string;
  coin: string;
  unit: string;
  balance: string;
  availableBalance?: string;
  price: string;
  change24h: number | null;
  total: string;
  icon: string;
  custom?: boolean;
  chainId?: number;
  address?: string;
  contractName?: string;
  path?: {
    vault: string;
    receiver: string;
    balance: string;
  };
  symbol?: string;
  name?: string;
  description?: string;
  decimals?: number;
  logoURI?: string;
  tags?: string[];
  evmAddress?: string;
  evm_address?: string;
  flowAddress?: string;
  flowIdentifier?: string;
  isVerified?: boolean;
};

export type BalanceMap = {
  [tokenId: string]: string;
};

// ExtendedTokenInfo is a intermediate type that combines Token information and pricing data.
export type ExtendedTokenInfo = TokenInfo &
  CoinItem & {
    priceInUSD: string;
    balanceInUSD: string;
    priceInFLOW: string;
    balanceInFLOW: string;
  };

export type TokenFilter = {
  hideDust: boolean;
  hideUnverified: boolean;
  filteredIds: string[];
};

// New type definitions for API response for /v4/cadence/tokens/ft/{address}
export type CadenceTokenInfo = {
  name: string;
  symbol: string;
  description: string;
  logos: {
    items: Array<{
      file: {
        url: string;
      };
      mediaType: string;
    }>;
  };
  socials: {
    x?: {
      url: string;
    };
  };
  balance: string;
  contractAddress: string;
  contractName: string;
  storagePath: {
    domain: string;
    identifier: string;
  };
  receiverPath: {
    domain: string;
    identifier: string;
  };
  balancePath: {
    domain: string;
    identifier: string;
  };
  identifier: string;
  isVerified: boolean;
  priceInUSD: string;
  balanceInUSD: string;
  priceInFLOW: string;
  balanceInFLOW: string;
  priceInCurrency: string;
  balanceInCurrency: string;
  currency: string;
  logoURI: string;
  displayBalance: string;
};

// New type definitions for API response for /v4/evm/tokens/ft/{address}
export type EvmTokenInfo = {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  flowIdentifier: string;
  priceInUSD: string;
  balanceInUSD: string;
  priceInFLOW: string;
  balanceInFLOW: string;
  displayBalance: string;
  rawBalance: string;
  currency: string;
  priceInCurrency: string;
  balanceInCurrency: string;
  isVerified: boolean;
};

export type FungibleTokenInfo = {
  chainId: number;
  address: string;
  contractName?: string;
  path?: {
    vault: string;
    receiver: string;
    balance: string;
  };
  evmAddress?: string;
  flowAddress?: string;
  symbol: string;
  name: string;
  description?: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  extensions?: {
    property1: string;
    property2: string;
  };
  flowIdentifier: string;
  website?: string;
};

export type CustomFungibleTokenInfo = FungibleTokenInfo & {
  custom?: boolean;
};

/*
 * This is the important part of the token info for EVM custom tokens
 * These are the fields I have to use to display the token info
 */
export type EvmCustomTokenInfo = {
  address: string;
  coin: string;
  flowIdentifier: string;
  unit: string;
  custom: true;
};

export type FungibleTokenListResponse = {
  name: string;
  network: string;
  chainId: number;
  tokens: FungibleTokenInfo[];
  totalAmount: number; // The total number of tokens in the list.
  filterType?: string; // The type used for filtering the list.
  timestamp: string;
  logoURI: string;
  keywords: string[];
  tags: {
    property1: {
      name: string;
      description: string;
    };
    property2: {
      name: string;
      description: string;
    };
  };
  version: {
    major: number;
    minor: number;
    patch: number;
  };
};
