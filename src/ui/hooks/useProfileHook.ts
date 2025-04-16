import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from '@/shared/types/network-types';
import {
  type FlowAddress,
  type WalletAccount,
  type ChildAccountMap,
  type MainAccount,
  getActiveAccountTypeForAddress,
} from '@/shared/types/wallet-types';
import { ensureEvmAddressPrefix, withPrefix } from '@/shared/utils/address';
import { UserWalletStore } from '@/shared/utils/user-data-keys';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { debug } from '@/ui/utils';
import { useWallet, useWalletLoaded } from '@/ui/utils/WalletContext';

import {
  useActiveAccounts,
  useChildAccounts,
  useCurrentId,
  useEvmAccount,
  useKeyringIds,
  useAccountBalance,
  useMainAccounts,
  useUserInfo,
  useUserWallets,
} from './use-account-hooks';

const INITIAL_WALLET = {
  name: '',
  icon: '',
  address: '',
  chain_id: 'flow',
  id: 1,
  coins: ['flow'],
  color: '',
  chain: MAINNET_CHAIN_ID,
};

const INITIAL_ACCOUNT = {
  name: '',
  icon: '',
  address: '',
  id: 1,
  color: '',
  keyIndex: 0,
  weight: 0,
  publicKey: '',
  signAlgo: 1,
  hashAlgo: 1,
  signAlgoString: 'ECDSA_secp256k1',
  hashAlgoString: 'SHA3_256',
  chain: MAINNET_CHAIN_ID,
};

export const useProfiles = () => {
  const profilesRef = useRef({
    initialized: false,
    loading: false,
  });

  const wallet = useWallet();
  const walletLoaded = useWalletLoaded();
  const { network } = useNetwork();

  // Replace zustand store with useState hooks
  const [initialStart, setInitialStart] = useState(true);
  const [loggedInAccounts, setLoggedInAccounts] = useState<WalletAccount[]>([]);
  const [currentWalletIndex, setCurrentWalletIndex] = useState(0);

  const currentId = useCurrentId();
  const profileIds = useKeyringIds();

  const userInfo = useUserInfo(currentId);
  // The user wallet data - which public key is currently active
  const userWallets = useUserWallets();
  // The main accounts for the current public key
  const mainAccounts = useMainAccounts(network, userWallets?.currentPubkey);
  const walletList = mainAccounts ?? [];
  // The accounts that have been selected by the user
  const activeAccounts = useActiveAccounts(network, userWallets?.currentPubkey);
  // The child accounts for the currently active main account
  const childAccounts = useChildAccounts(network, activeAccounts?.parentAddress);

  const currentBalance = useAccountBalance(network, activeAccounts?.currentAddress);

  const parentWallet =
    walletList.find((wallet) => wallet.address === activeAccounts?.parentAddress) ?? INITIAL_WALLET;

  // Wallets other than the parent wallet
  const otherAccounts = walletList.filter((wallet) => wallet.id !== parentWallet.id);

  // The EVM address for the currently active main account
  const evmAccount = useEvmAccount(network, activeAccounts?.parentAddress);
  const evmLoading = evmAccount === undefined;
  const evmWallet = evmAccount ?? INITIAL_WALLET;

  const evmAddress = evmAccount?.address ?? '';
  const mainAddress = activeAccounts?.parentAddress ?? '';

  const mainAddressLoading = !mainAccounts || !activeAccounts || !activeAccounts?.parentAddress;

  const activeAccountType = useMemo(
    () =>
      getActiveAccountTypeForAddress(
        activeAccounts?.currentAddress ?? null,
        activeAccounts?.parentAddress ?? null
      ),
    [activeAccounts?.currentAddress, activeAccounts?.parentAddress]
  );

  // The current wallet is the wallet that the user is currently using
  const currentWallet = useMemo(() => {
    switch (activeAccountType) {
      case 'evm':
        return evmAccount ?? INITIAL_WALLET;
      case 'child':
        return (
          childAccounts?.find((account) => account.address === activeAccounts?.currentAddress) ??
          INITIAL_WALLET
        );
      case 'main':
        return parentWallet ?? INITIAL_WALLET;
      default:
        return INITIAL_WALLET;
    }
  }, [activeAccountType, evmAccount, childAccounts, parentWallet, activeAccounts?.currentAddress]);

  const clearProfileData = () => {};
  const fetchProfileData = () => {};

  return {
    fetchProfileData,
    clearProfileData,
    initialStart,
    currentWallet,
    mainAddress,
    evmAddress,
    childAccounts,
    evmWallet,
    userInfo,
    otherAccounts,
    loggedInAccounts,
    walletList,
    currentBalance,
    parentWallet,
    currentWalletIndex,
    evmLoading,
    mainAddressLoading,
    profileIds,
    activeAccountType,
  };
};
