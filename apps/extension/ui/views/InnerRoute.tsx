import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Route, Routes } from 'react-router';

import PrivateRoute from '@/ui/components/PrivateRoute';
import { useWallet, useWalletLoaded } from '@/ui/hooks/use-wallet';

import Dashboard from './Dashboard';
import Header from './Dashboard/Header';
import Deposit from './Deposit';
import Enable from './Enable';
import LinkedCollection from './Linked/LinkedCollection';
import LinkedNftDetail from './Linked/LinkedNftDetail';
import ManageToken from './ManageToken';
import CollectionDetail from './NFT/CollectionDetail';
import Detail from './NFT/Detail';
import AddList from './NFT/NFTList/AddList';
import SendToAddress from './NFT/SendNFT/SendToAddress';
import EvmCollectionDetail from './NftEvm/CollectionDetail';
import NftEvmDetail from './NftEvm/Detail';
import SendNftEvm from './NftEvm/SendNFT/SendToAddress';
import SendAddress from './Send';
import SendTo from './SendTo';
import SettingTab from './Setting';
import About from './Setting/About/About';
import AccountList from './Setting/AccountList';
import AccountDetail from './Setting/AccountList/AccountDetail';
import LinkedDetail from './Setting/AccountList/LinkedDetail';
import RemoveWallet from './Setting/AccountList/RemoveWallet';
import AddressBook from './Setting/AddressBook';
import ManageBackups from './Setting/Backups';
import BackupsPassword from './Setting/Backups/BackupsPassword';
import ChangePassword from './Setting/change-password';
import CurrencySettings from './Setting/Currency';
import DeveloperMode from './Setting/DeveloperMode/DeveloperMode';
import DeviceInfo from './Setting/Devices/DeviceInfo';
import KeyList from './Setting/KeyList/KeyList';
import Keydetail from './Setting/privatekey/Keydetail';
import PrivateKeyPassword from './Setting/privatekey/Privatekeypassword';
import Profile from './Setting/Profile';
import RecoveryPhasesDetail from './Setting/recoveryphase/Recoveryphasedetail';
import Recoveryphrasepassword from './Setting/recoveryphase/Recoveryphrasepassword';
import Security from './Setting/Security';
import Switchaccount from './Setting/Switchaccount';
import TokenDetail from './TokenDetail';
import TokenList from './TokenList';
import AddCustomEvmToken from './Wallet/AddCustom/AddCustomEvmToken';

const InnerRoute = () => {
  const [value, setValue] = useState(0);

  const usewallet = useWallet();
  const walletLoaded = useWalletLoaded();

  const initRef = useRef(false);

  const fetch = useCallback(async () => {
    if (!walletLoaded || initRef.current) {
      return;
    }

    try {
      initRef.current = true;
      const dashIndex = await usewallet.getDashIndex();
      if (dashIndex) {
        setValue(dashIndex);
      } else {
        setValue(0);
        await usewallet.setDashIndex(0);
      }
    } finally {
      initRef.current = false;
    }
  }, [usewallet, walletLoaded]);

  useEffect(() => {
    if (walletLoaded) {
      fetch();
    }
  }, [walletLoaded, fetch]);

  useEffect(() => {
    if (!walletLoaded) {
      return;
    }
    usewallet.setDashIndex(value);
  }, [value, usewallet, walletLoaded]);

  return (
    <React.Fragment>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        <Header />

        <div id="scrollableTab" style={{ flex: 1, overflowY: 'scroll' }}>
          <Routes>
            <Route
              index
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/addressbook"
              element={
                <PrivateRoute>
                  <AddressBook />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/security"
              element={
                <PrivateRoute>
                  <Security />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/switchaccount"
              element={
                <PrivateRoute>
                  <Switchaccount />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/privatekeypassword"
              element={
                <PrivateRoute>
                  <PrivateKeyPassword />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/keylist"
              element={
                <PrivateRoute>
                  <KeyList />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/keydetail"
              element={
                <PrivateRoute>
                  <Keydetail />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/recoveryphrasepassword"
              element={
                <PrivateRoute>
                  <Recoveryphrasepassword />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/recoveryphrasedetail"
              element={
                <PrivateRoute>
                  <RecoveryPhasesDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/collectiondetail/:collection_address_name"
              element={
                <PrivateRoute>
                  <CollectionDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/evm/collectiondetail/:collection_address_name"
              element={
                <PrivateRoute>
                  <EvmCollectionDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/linked/collectiondetail/:collection_address_name"
              element={
                <PrivateRoute>
                  <LinkedCollection />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/nftdetail/:id"
              element={
                <PrivateRoute>
                  <Detail />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/linkednftdetail/:id"
              element={
                <PrivateRoute>
                  <LinkedNftDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="nft/send"
              element={
                <PrivateRoute>
                  <SendToAddress />
                </PrivateRoute>
              }
            />
            <Route
              path="nftevm/detail/:id"
              element={
                <PrivateRoute>
                  <NftEvmDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="nftevm/send"
              element={
                <PrivateRoute>
                  <SendNftEvm />
                </PrivateRoute>
              }
            />
            <Route
              path="wallet/deposit"
              element={
                <PrivateRoute>
                  <Deposit />
                </PrivateRoute>
              }
            />
            <Route
              path="tokendetail/:name/:id"
              element={
                <PrivateRoute>
                  <TokenDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="token/:id/send"
              element={
                <PrivateRoute>
                  <SendAddress />
                </PrivateRoute>
              }
            />
            <Route
              path="token/:id/send/:toAddress"
              element={
                <PrivateRoute>
                  <SendTo />
                </PrivateRoute>
              }
            />
            <Route
              path="tokenlist"
              element={
                <PrivateRoute>
                  <TokenList />
                </PrivateRoute>
              }
            />
            <Route
              path="managetoken"
              element={
                <PrivateRoute>
                  <ManageToken />
                </PrivateRoute>
              }
            />
            <Route
              path="addcustomevm"
              element={
                <PrivateRoute>
                  <AddCustomEvmToken />
                </PrivateRoute>
              }
            />
            <Route
              path="nested/add_list"
              element={
                <PrivateRoute>
                  <AddList />
                </PrivateRoute>
              }
            />
            <Route
              path="setting"
              element={
                <PrivateRoute>
                  <SettingTab />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/about"
              element={
                <PrivateRoute>
                  <About />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/changepassword"
              element={
                <PrivateRoute>
                  <ChangePassword />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/accountlist/linkeddetail/:key"
              element={
                <PrivateRoute>
                  <LinkedDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/developerMode"
              element={
                <PrivateRoute>
                  <DeveloperMode />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/deviceinfo"
              element={
                <PrivateRoute>
                  <DeviceInfo />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/accountlist/detail/:address"
              element={
                <PrivateRoute>
                  <AccountDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/accountlist"
              element={
                <PrivateRoute>
                  <AccountList />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/removeWallet"
              element={
                <PrivateRoute>
                  <RemoveWallet />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/currency"
              element={
                <PrivateRoute>
                  <CurrencySettings />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/backups"
              element={
                <PrivateRoute>
                  <ManageBackups />
                </PrivateRoute>
              }
            />
            <Route
              path="setting/backups/password"
              element={
                <PrivateRoute>
                  <BackupsPassword />
                </PrivateRoute>
              }
            />
            <Route
              path="enable"
              element={
                <PrivateRoute>
                  <Enable />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </React.Fragment>
  );
};

export default InnerRoute;
