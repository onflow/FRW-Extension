import { useMemo } from 'react';

import { HASH_ALGO_NUM_DEFAULT, SIGN_ALGO_NUM_DEFAULT } from '@/shared/constant/algo-constants';
import { MAINNET_CHAIN_ID } from '@/shared/types/network-types';
import {
  type MainAccount,
  type WalletAccount,
  getActiveAccountTypeForAddress,
} from '@/shared/types/wallet-types';
import { useNetwork } from '@/ui/hooks/useNetworkHook';

import {
  useAccountBalance,
  useActiveAccounts,
  useCurrentId,
  useKeyringIds,
  useMainAccountStorageBalance,
  useMainAccounts,
  usePayer,
  usePendingAccountCreationTransactions,
  useRegisterStatus,
  useUserInfo,
  useUserWallets,
} from './use-account-hooks';

const INITIAL_WALLET: WalletAccount = {
  name: '',
  icon: '',
  address: '',
  id: 1,
  color: '',
  chain: MAINNET_CHAIN_ID,
};

const INITIAL_ACCOUNT: MainAccount = {
  name: '',
  icon: '',
  address: '',
  id: 1,
  color: '',
  publicKey: '',
  keyIndex: 0,
  weight: 1000,
  chain: MAINNET_CHAIN_ID,
  signAlgo: SIGN_ALGO_NUM_DEFAULT,
  signAlgoString: 'ECDSA_secp256k1',
  hashAlgo: HASH_ALGO_NUM_DEFAULT,
  hashAlgoString: 'SHA3_256',
};

export const useProfiles = () => {
  const { network } = useNetwork();

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

  const currentBalance = useAccountBalance(network, activeAccounts?.currentAddress);

  const noAddress = activeAccounts && activeAccounts.currentAddress === null;
  const registerStatus = useRegisterStatus(userWallets?.currentPubkey);
  const parentWallet =
    walletList.find((wallet) => wallet.address === activeAccounts?.parentAddress) ??
    INITIAL_ACCOUNT;

  // The child accounts for the currently active main account
  const childAccounts = parentWallet?.childAccounts;

  const parentWalletIndex = walletList.findIndex(
    (wallet) => wallet.address === activeAccounts?.currentAddress
  );
  // Wallets other than the parent wallet
  const otherAccounts = walletList.filter((wallet) => wallet.id !== parentWallet.id);

  // The EVM address for the currently active main account
  const evmAccount = parentWallet?.evmAccount;
  const evmLoading = evmAccount === undefined;
  const evmWallet = evmAccount ?? INITIAL_WALLET;

  const evmAddress = evmAccount?.address ?? '';
  const mainAddress = activeAccounts?.parentAddress ?? '';

  const mainAddressLoading =
    !mainAccounts || !activeAccounts || activeAccounts?.parentAddress === undefined;

  const parentAccountStorageBalance = useMainAccountStorageBalance(network, mainAddress);

  const payer = usePayer();

  const activeAccountType = useMemo(
    () =>
      getActiveAccountTypeForAddress(
        activeAccounts?.currentAddress ?? null,
        activeAccounts?.parentAddress ?? null
      ),
    [activeAccounts?.currentAddress, activeAccounts?.parentAddress]
  );
  const pendingAccountTransactions = usePendingAccountCreationTransactions(
    network,
    userWallets?.currentPubkey
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

  const currentWalletList = [
    parentWallet,
    ...(evmAccount ? [evmAccount] : []),
    ...(childAccounts ?? []),
  ];
  // Check if we have another account to move to
  const canMoveToOtherAccount =
    activeAccountType === 'evm' ||
    activeAccountType === 'child' ||
    (activeAccountType === 'main' && (!!evmAccount || !!childAccounts?.length));

  return {
    currentWallet,
    mainAddress,
    evmAddress,
    childAccounts,
    evmWallet,
    userInfo,
    otherAccounts,
    walletList,
    currentBalance,
    parentAccountStorageBalance,
    parentWallet,
    parentWalletIndex,
    evmLoading,
    mainAddressLoading,
    profileIds,
    activeAccountType,
    noAddress,
    registerStatus,
    canMoveToOtherAccount,
    currentWalletList,
    payer,
    network,
    pendingAccountTransactions,
  };
};
