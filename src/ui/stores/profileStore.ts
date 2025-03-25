import { create } from 'zustand';

import { type LoggedInAccountWithIndex, type LoggedInAccount } from '@/shared/types/wallet-types';

import type {
  ChildAccountMap,
  WalletType,
  UserInfoResponse,
} from '../../shared/types/network-types';

interface ProfileState {
  mainAddress: string;
  evmAddress: string;
  currentWalletIndex: number;
  parentWallet: WalletType;
  evmWallet: WalletType;
  walletList: WalletType[];
  initialStart: boolean;
  currentWallet: WalletType;
  mainAddressLoading: boolean;
  childAccounts: ChildAccountMap;
  evmLoading: boolean;
  listLoading: boolean;
  userInfo: UserInfoResponse | null;
  otherAccounts: LoggedInAccountWithIndex[];
  loggedInAccounts: LoggedInAccount[];
  setMainAddress: (address: string) => void;
  setEvmAddress: (address: string) => void;
  setCurrentWalletIndex: (index: number) => void;
  setParentWallet: (wallet: WalletType) => void;
  setEvmWallet: (wallet: WalletType) => void;
  setWalletList: (list: any[]) => void;
  setInitial: (initial: boolean) => void;
  setCurrent: (current: any) => void;
  setMainLoading: (mainAddressLoading: boolean) => void;
  setChildAccount: (childAccount: ChildAccountMap) => void;
  setEvmLoading: (evmLoading: boolean) => void;
  setListLoading: (listLoading: boolean) => void;
  setUserInfo: (info: UserInfoResponse | null) => void;
  setOtherAccounts: (accounts: any) => void;
  setLoggedInAccounts: (accounts: any) => void;
  clearProfileData: () => void;
}

const INITIAL_WALLET = {
  name: '',
  icon: '',
  address: '',
  chain_id: 'flow',
  id: 1,
  coins: ['flow'],
  color: '',
};

export const useProfileStore = create<ProfileState>((set) => ({
  mainAddress: '',
  evmAddress: '',
  currentWalletIndex: 0,
  parentWallet: { ...INITIAL_WALLET },
  evmWallet: { ...INITIAL_WALLET, chain_id: 'evm' },
  currentWallet: { ...INITIAL_WALLET },
  walletList: [],
  initialStart: true,
  mainAddressLoading: true,
  evmLoading: true,
  childAccounts: {},
  userInfo: null,
  otherAccounts: [],
  loggedInAccounts: [],
  listLoading: true,
  setMainAddress: (address) => set({ mainAddress: address }),
  setEvmAddress: (address) => set({ evmAddress: address }),
  setCurrentWalletIndex: (index) => set({ currentWalletIndex: index }),
  setParentWallet: (wallet) => set({ parentWallet: wallet }),
  setEvmWallet: (wallet) => set({ evmWallet: wallet }),
  setWalletList: (list) => set({ walletList: list }),
  setInitial: (initial) => set({ initialStart: initial }),
  setCurrent: (current) => set({ currentWallet: current }),
  setMainLoading: (mainAddressLoading) => set({ mainAddressLoading: mainAddressLoading }),
  setChildAccount: (childAccount) => set({ childAccounts: childAccount }),
  setEvmLoading: (evmLoading) => set({ evmLoading: evmLoading }),
  setUserInfo: (info) => set({ userInfo: info }),
  setOtherAccounts: (accounts: LoggedInAccountWithIndex[]) => set({ otherAccounts: accounts }),
  setLoggedInAccounts: (accounts: LoggedInAccount[]) => set({ loggedInAccounts: accounts }),
  setListLoading: (listLoading) => set({ listLoading: listLoading }),
  clearProfileData: () =>
    set({
      mainAddress: '',
      evmAddress: '',
      currentWalletIndex: 0,
      parentWallet: { ...INITIAL_WALLET },
      evmWallet: { ...INITIAL_WALLET, chain_id: 'evm' },
      walletList: [],
      initialStart: true,
      currentWallet: { ...INITIAL_WALLET },
      mainAddressLoading: true,
      childAccounts: {},
      evmLoading: true,
      listLoading: true,
      userInfo: null,
      otherAccounts: [],
      loggedInAccounts: [],
    }),
}));
