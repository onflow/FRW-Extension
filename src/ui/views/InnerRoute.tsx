import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Switch, withRouter, type RouteComponentProps } from 'react-router-dom';

import PrivateRoute from 'ui/components/PrivateRoute';
import { useWallet, useWalletLoaded } from 'ui/utils';

import Deposit from '../views/Deposit';
import Enable from '../views/Enable';

import Dashboard from './Dashboard';
import Header from './Dashboard/Header';
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
import Account from './Setting/Account';
import AddressBook from './Setting/AddressBook';
import ManageBackups from './Setting/Backups';
import BackupsPassword from './Setting/Backups/BackupsPassword';
import ChangePassword from './Setting/change-password';
import CurrencySettings from './Setting/Currency';
import DeveloperMode from './Setting/DeveloperMode/DeveloperMode';
import DeviceInfo from './Setting/Devices/DeviceInfo';
import KeyList from './Setting/KeyList/KeyList';
import Linked from './Setting/Linked';
import LinkedCollection from './Setting/Linked/LinkedCollection';
import LinkedDetail from './Setting/Linked/LinkedDetail';
import LinkedNftDetail from './Setting/Linked/LinkedNftDetail';
import Keydetail from './Setting/privatekey/Keydetail';
import PrivateKeyPassword from './Setting/privatekey/Privatekeypassword';
import RecoveryPhasesDetail from './Setting/recoveryphase/Recoveryphasedetail';
import Recoveryphrasepassword from './Setting/recoveryphase/Recoveryphrasepassword';
import Security from './Setting/Security';
import Settingone from './Setting/Settingone';
import Switchaccount from './Setting/Switchaccount';
import './Landing.css';
import WalletList from './Setting/Wallet';
import RemoveWallet from './Setting/Wallet/RemoveWallet';
import WalletDetail from './Setting/Wallet/WalletDetail';
import TokenDetail from './TokenDetail';
import TokenList from './TokenList';
import AddCustomEvmToken from './Wallet/AddCustom/AddCustomEvmToken';

const InnerRoute = (props: RouteComponentProps) => {
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
          <Switch>
            <PrivateRoute exact path={`${props.match.url}/`}>
              <Dashboard />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/addressbook`}>
              <AddressBook />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nested/settingone`}>
              <Settingone />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nested/security`}>
              <Security />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nested/switchaccount`}>
              <Switchaccount />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nested/privatekeypassword`}>
              <PrivateKeyPassword />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nested/keylist`}>
              <KeyList />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nested/keydetail`}>
              <Keydetail />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nested/recoveryphrasepassword`}>
              <Recoveryphrasepassword />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nested/recoveryphrasedetail`}>
              <RecoveryPhasesDetail />
            </PrivateRoute>

            <PrivateRoute
              path={`${props.match.url}/nested/collectiondetail/:collection_address_name`}
            >
              <CollectionDetail />
            </PrivateRoute>
            <PrivateRoute
              path={`${props.match.url}/nested/evm/collectiondetail/:collection_address_name`}
            >
              <EvmCollectionDetail />
            </PrivateRoute>
            <PrivateRoute
              path={`${props.match.url}/nested/linked/collectiondetail/:collection_address_name`}
            >
              <LinkedCollection />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nested/nftdetail/:id`}>
              <Detail />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nested/linkednftdetail/:id`}>
              <LinkedNftDetail />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nft/send`}>
              <SendToAddress />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nftevm/detail/:id`}>
              <NftEvmDetail />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nftevm/send`}>
              <SendNftEvm />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/wallet/deposit`}>
              <Deposit />
            </PrivateRoute>

            <PrivateRoute path={`${props.match.url}/tokendetail/:name/:id`} exact>
              <TokenDetail />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/token/:id/send`} exact>
              <SendAddress />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/token/:id/send/:toAddress`} exact>
              <SendTo />
            </PrivateRoute>

            <PrivateRoute path={`${props.match.url}/tokenlist`}>
              <TokenList />
            </PrivateRoute>

            <PrivateRoute path={`${props.match.url}/managetoken`}>
              <ManageToken />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/addcustomevm`}>
              <AddCustomEvmToken />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/nested/add_list`}>
              <AddList />
            </PrivateRoute>
            <PrivateRoute exact path={`${props.match.url}/setting`}>
              <SettingTab />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/about`}>
              <About />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/changepassword`}>
              <ChangePassword />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/linked`}>
              <Linked />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/linkeddetail/:key`}>
              <LinkedDetail />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/developerMode`}>
              <DeveloperMode />
            </PrivateRoute>

            <PrivateRoute path={`${props.match.url}/setting/deviceinfo`}>
              <DeviceInfo />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/wallet/detail`}>
              <WalletDetail />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/wallet`}>
              <WalletList />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/removeWallet`}>
              <RemoveWallet />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/account`}>
              <Account />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/currency`}>
              <CurrencySettings />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/backups`} exact>
              <ManageBackups />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/setting/backups/password`}>
              <BackupsPassword />
            </PrivateRoute>
            <PrivateRoute path={`${props.match.url}/enable`}>
              <Enable />
            </PrivateRoute>
          </Switch>
        </div>
      </div>
    </React.Fragment>
  );
};

export default withRouter(InnerRoute);
