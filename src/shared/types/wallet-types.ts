import { isValidEthereumAddress, isValidFlowAddress } from '../utils/address';

import { type HashAlgoString, type SignAlgoString } from './algo-types';

// Matches exactly 16 hex characters, with optional 0x prefix
export type FlowAddress = `0x${string & { length: 16 }}` | `${string & { length: 16 }}`;

// Matches exactly 40 hex characters, with optional 0x prefix
export type EvmAddress = `0x${string & { length: 40 }}` | `${string & { length: 40 }}`;

// WalletAddress is the type of the address of the wallet. It can be an EvmAddress or a FlowAddress.
export type WalletAddress = EvmAddress | FlowAddress;

// ActiveChildType is the type of the active child in the wallet. It can be 'evm', a FlowAddress, or null.
/**
 * @deprecated : use ActiveAccountType instead
 */
export type ActiveChildType_depreciated = 'evm' | FlowAddress | null;

/**
 * @deprecated : use ActiveAccountType instead
 */
export const isEvmAccountType = (type: ActiveChildType_depreciated): type is 'evm' => {
  return type === 'evm';
};
/**
 * @deprecated : use ActiveAccountType instead
 */
export const isChildAccountType = (type: ActiveChildType_depreciated): type is FlowAddress => {
  return isValidFlowAddress(type);
};
/**
 * @deprecated : use ActiveAccountType instead
 */
export const isMainAccountType = (type: ActiveChildType_depreciated): type is null => {
  return type === null;
};

export type ActiveAccountType = 'evm' | 'child' | 'main' | 'none';

export const getActiveAccountTypeForAddress = (
  address: string | null,
  parentAddress: string | null
): ActiveAccountType => {
  if (!address) {
    // No address is selected
    return 'none';
  }
  if (address === parentAddress) {
    return 'main';
  }
  if (isValidEthereumAddress(address)) {
    return 'evm';
  }
  if (isValidFlowAddress(address)) {
    return 'child';
  }
  throw new Error(`Invalid active account address: ${address}`);
};

export type LoggedInAccount = {
  // The globally unique id of the account
  id: string;
  // The root address of the account is always a FlowAddress
  address: FlowAddress;
  // The nickname of the account
  nickname: string;
  // The globally unique username of the account. This is usually the nickname with a numeric suffix
  username: string;
  // The avatar of the account
  avatar: string;
  // The creation date of the account
  created: string;
  // The hash algorithm of the account
  hashAlgoString: HashAlgoString;
  // Anonymous mode of the account.
  // If 1, the account is NOT anonymous. If 2, the account is anonymous.
  private: number;
  // The public key of the account
  pubKey: string;
  // The signature algorithm of the account
  signAlgoString: SignAlgoString;
  // The weight of the account. Usually 1000
  weight: number;
};

export type LoggedInAccountWithIndex = LoggedInAccount & {
  indexInLoggedInAccounts: number;
};

export type PublicKeyAccount = {
  // The address of the account
  address: string;
  // The public key of the account
  publicKey: string;
  // The index of the key in the account
  keyIndex: number;
  // The weight of the key
  weight: number;
  // The signature algorithm of the key
  signAlgo: number;
  // The signature algorithm of the key
  signAlgoString: SignAlgoString;
  // The hash algorithm of the key
  hashAlgo: number;
  // The hash algorithm of the key
  hashAlgoString: HashAlgoString;
};

export type WalletAccount = {
  address: string;
  chain: number; // testnet: 545, mainnet: MAINNET_CHAIN_ID
  id: number;
  name: string;
  icon: string;
  color: string;
  balance?: string;
  nfts?: number;
};
export type WalletAccountWithBalance = WalletAccount & {
  balance: string;
};
export type MainAccount = WalletAccount & PublicKeyAccount;

export type MainAccountBalance = {
  address: string;
  balance: string;
};

export type MainAccountWithBalance = MainAccount & {
  balance: string;
};

export type WalletProfile = {
  publicKey: string;
  currentId?: string;
  accounts: MainAccount[];
};

export type Emoji = {
  emoji: string;
  name: string;
  bgcolor: string;
};

type Thumbnail = {
  url: string;
};

export type AccountDetails = {
  name: string;
  description: string;
  thumbnail: Thumbnail;
  address?: string;
};

export type ChildAccountMap = {
  [key: string]: AccountDetails;
};

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  country: string;
};

export const DEFAULT_CURRENCY: Currency = {
  code: 'USD',
  name: 'United States Dollar',
  symbol: '$',
  country: 'United States',
};

export interface ProfileBackupStatus {
  username: string;
  uid: string | null;
  id: string;
  isActive: boolean; // User has it imported
  isBackedUp: boolean; // Is backed up on Google
  canDecrypt: boolean; // Can be decrypted with current password
  isSelected: boolean; // User selected it for password change
}

// Transactions that are creating accounts
export type PendingTransaction = WalletAccount & {
  txId: string;
  network: string;
  pubkey: string;
  accountId: number;
  createdAt: number;
  expiresAt: number;
};
