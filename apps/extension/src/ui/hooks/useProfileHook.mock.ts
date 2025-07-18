import { fn } from 'storybook/test';

import { MAINNET_CHAIN_ID } from '@onflow/flow-wallet-shared/types/network-types';

import * as actual from './useProfileHook';

// Mock for useProfiles hook that uses the global mock

export const USE_PROFILES_MOCK: ReturnType<typeof actual.useProfiles> = {
  currentWallet: {
    name: 'panda',
    icon: '🐼',
    address: '0x12345678',
    id: 1,
    color: 'white',
    chain: MAINNET_CHAIN_ID,
  },
  mainAddress: '0x1234567812345678',
  evmAddress: '0x1234567812345678',
  childAccounts: [],
  evmWallet: {
    name: 'panda',
    icon: '🐼',
    address: '0x0000000000000000000000021234567812345678',
    id: 1,
    color: 'white',
    chain: MAINNET_CHAIN_ID,
  },
  userInfo: {
    avatar: '🐼',
    nickname: 'panda',
    username: 'panda',
    private: 0,
    created: '2021-01-01',
    id: '1',
  },
  otherAccounts: [],
  walletList: [],
  currentBalance: '0',
  parentAccountStorageBalance: {
    address: '0x1234567812345678',
    availableBalance: '0',
    storageCapacity: '0',
    balance: '0',
    storageUsed: '0',
  },
  parentWallet: {
    name: 'panda',
    icon: '🐼',
    address: '0x1234567812345678',
    id: 1,
    color: 'white',
    chain: MAINNET_CHAIN_ID,
    publicKey: '',
    keyIndex: 0,
    weight: 1000,
    signAlgo: 2,
    signAlgoString: 'ECDSA_secp256k1',
    hashAlgo: 3,
    hashAlgoString: 'SHA3_256',
  },
  parentWalletIndex: -1,
  evmLoading: false,
  mainAddressLoading: false,
  profileIds: [],
  activeAccountType: 'main',
  noAddress: false,
  registerStatus: true,
  canMoveToOtherAccount: false,
  currentWalletList: [],
  payer: '0x1234567812345678',
  network: 'mainnet',
  pendingAccountTransactions: [],
};

export const useProfiles = fn(actual.useProfiles)
  .mockName('useProfiles')
  .mockReturnValue(USE_PROFILES_MOCK);
