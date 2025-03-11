import { useCallback } from 'react';

import type {
  ChildAccount,
  BlockchainResponse,
  WalletResponse,
} from '@/shared/types/network-types';
import { ensureEvmAddressPrefix, withPrefix } from '@/shared/utils/address';
import { retryOperation } from '@/shared/utils/retryOperation';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useProfileStore } from '@/ui/stores/profileStore';
import { useWallet, useWalletLoaded } from '@/ui/utils/WalletContext';

export const useProfiles = () => {
  const usewallet = useWallet();
  const walletLoaded = useWalletLoaded();
  const { network } = useNetwork();

  // Action selectors
  const setMainAddress = useProfileStore((state) => state.setMainAddress);
  const setEvmAddress = useProfileStore((state) => state.setEvmAddress);
  const setInitial = useProfileStore((state) => state.setInitial);
  const setChildAccount = useProfileStore((state) => state.setChildAccount);
  const setCurrent = useProfileStore((state) => state.setCurrent);
  const setEvmWallet = useProfileStore((state) => state.setEvmWallet);
  const setMainLoading = useProfileStore((state) => state.setMainLoading);
  const setEvmLoading = useProfileStore((state) => state.setEvmLoading);
  const setUserInfo = useProfileStore((state) => state.setUserInfo);
  const setOtherAccounts = useProfileStore((state) => state.setOtherAccounts);
  const setLoggedInAccounts = useProfileStore((state) => state.setLoggedInAccounts);
  const setWalletList = useProfileStore((state) => state.setWalletList);
  const setParentWallet = useProfileStore((state) => state.setParentWallet);
  const clearProfileData = useProfileStore((state) => state.clearProfileData);

  // State selectors
  const initialStart = useProfileStore((state) => state.initialStart);
  const currentWallet = useProfileStore((state) => state.currentWallet);
  const mainAddress = useProfileStore((state) => state.mainAddress);
  const evmAddress = useProfileStore((state) => state.evmAddress);
  const childAccounts = useProfileStore((state) => state.childAccounts);
  const evmWallet = useProfileStore((state) => state.evmWallet);
  const userInfo = useProfileStore((state) => state.userInfo);
  const otherAccounts = useProfileStore((state) => state.otherAccounts);
  const loggedInAccounts = useProfileStore((state) => state.loggedInAccounts);
  const walletList = useProfileStore((state) => state.walletList);
  const parentWallet = useProfileStore((state) => state.parentWallet);
  const currentWalletIndex = useProfileStore((state) => state.currentWalletIndex);
  const evmLoading = useProfileStore((state) => state.evmLoading);
  const mainAddressLoading = useProfileStore((state) => state.mainAddressLoading);

  // Helper function for formatWallets
  const formatWallets = useCallback(
    (data) => {
      if (!Array.isArray(data)) return [];

      const filteredData = data.filter((wallet) => {
        return wallet.chain_id === network;
      });

      return filteredData.map((wallet, index) => ({
        id: index,
        name: wallet.name || 'Wallet',
        address: withPrefix(wallet.blockchain[0].address),
        key: index,
        icon: wallet.icon || '',
        color: wallet.color || '',
      }));
    },
    [network]
  );

  // Helper function to handle EVM wallet setup
  const setupEvmWallet = useCallback(
    async (mainAddress: string) => {
      try {
        const [evmRes, emoji, evmWallet] = await Promise.all([
          usewallet.queryEvmAddress(mainAddress),
          usewallet.getEmoji(),
          usewallet.getEvmWallet(),
        ]);

        const evmAddress = ensureEvmAddressPrefix(evmRes!);

        // Setup EVM wallet data
        const evmWalletData: BlockchainResponse = {
          ...evmWallet,
          name: emoji[9].name,
          icon: emoji[9].emoji,
          address: evmAddress,
          chain_id: '1',
          id: 1,
          coins: [],
          color: emoji[9].bgcolor,
        };

        // Batch updates
        await Promise.all([setEvmWallet(evmWalletData), setEvmAddress(evmAddress)]);
        setEvmLoading(false);

        return evmWalletData;
      } catch (error) {
        console.error('Error setting up EVM wallet:', error);
        throw error;
      }
    },
    [usewallet, setEvmWallet, setEvmAddress, setEvmLoading]
  );

  // Helper function for fetchUserWallet
  const freshUserInfo = useCallback(async () => {
    if (!usewallet || !walletLoaded) return;
    try {
      // Make sure the wallet is unlocked and has a main wallet
      if (!(await usewallet.getMainWallet())) {
        console.log('freshUserInfo - No main wallet yet');
        return;
      }
      //TODO: should rethink the wording of the wallet functions, have it be parent evm and child or something similar. State name and should be the same frontend and background.
      const [currentWallet, isChild, mainAddress] = await Promise.all([
        usewallet.getCurrentWallet(),
        usewallet.getActiveWallet(),
        usewallet.getMainAddress(),
      ]);

      if (!currentWallet) {
        // We may not be logged in yet
        return;
      }
      const mainwallet = await usewallet.returnMainWallet();
      setParentWallet(mainwallet!);
      if (isChild === 'evm') {
        const evmWalletData = await setupEvmWallet(mainAddress!);
        await setCurrent(evmWalletData);
      } else if (isChild) {
        await setCurrent(currentWallet);
      } else {
        await setCurrent(mainwallet);
      }

      const [keys, pubKTuple] = await Promise.all([usewallet.getAccount(), usewallet.getPubKey()]);

      // Separate getUserInfo with retry since it depends on address from cadence and userinfo from openapi
      let walletData;
      try {
        walletData = await retryOperation(
          () => usewallet.getUserInfo(true),
          3, // max attempts
          1000 // delay between attempts
        );
      } catch (error) {
        console.error('All attempts failed to get user info:', error);
        throw error;
      }

      const { otherAccounts, wallet, loggedInAccounts } = await usewallet.openapi.freshUserInfo(
        currentWallet,
        keys,
        pubKTuple,
        walletData,
        isChild
      );

      await Promise.all([
        setOtherAccounts(otherAccounts),
        setUserInfo(wallet),
        setLoggedInAccounts(loggedInAccounts),
      ]);
    } catch (error) {
      console.error('Error in freshUserInfo:', error);
    } finally {
      setMainLoading(false);
    }
  }, [
    usewallet,
    walletLoaded,
    setLoggedInAccounts,
    setOtherAccounts,
    setUserInfo,
    setCurrent,
    setupEvmWallet,
    setMainLoading,
    setParentWallet,
  ]);

  // 1. First called in index.ts, get the user info(name and avatar) and the main address
  const fetchProfileData = useCallback(async () => {
    if (!usewallet || !walletLoaded) return;
    try {
      const mainAddress = await usewallet.getMainAddress();
      if (mainAddress) {
        setMainAddress(mainAddress);
        await setupEvmWallet(mainAddress);
      }
    } catch (err) {
      console.error('fetchProfileData err', err);
    }
  }, [usewallet, setMainAddress, setupEvmWallet, walletLoaded]);

  // 2. Second called in index.ts, get all the address for this userunder the current network
  const freshUserWallet = useCallback(async () => {
    if (!usewallet || !walletLoaded) return;
    const wallet: WalletResponse[] = await usewallet.getUserWallets();
    const fData: WalletResponse[] = wallet.filter((item) => item.blockchain !== null);

    if (initialStart) {
      await usewallet.openapi.putDeviceInfo(fData);
      setInitial(false);
    }
    const formattedWallets = formatWallets(fData);
    setWalletList(formattedWallets);
  }, [usewallet, initialStart, setInitial, formatWallets, setWalletList, walletLoaded]);

  // 3. Third called in index.ts check the child account and set the child account
  const fetchUserWallet = useCallback(async () => {
    if (!usewallet || !walletLoaded) return;
    freshUserInfo();
    const childresp: ChildAccount = await usewallet.checkUserChildAccount();
    setChildAccount(childresp);
    usewallet.setChildWallet(childresp);
  }, [freshUserInfo, usewallet, setChildAccount, walletLoaded]);

  return {
    fetchProfileData,
    freshUserWallet,
    fetchUserWallet,
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
    parentWallet,
    currentWalletIndex,
    evmLoading,
    mainAddressLoading,
  };
};
