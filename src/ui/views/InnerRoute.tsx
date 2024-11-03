import React, { useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import Settingone from './Setting/Settingone';
import Switchaccount from './Setting/Switchaccount';
import Security from './Setting/Security';
import PrivateKeyPassword from './Setting/privatekey/Privatekeypassword';
import Recoveryphrasepassword from './Setting/recoveryphase/Recoveryphrasepassword';
import KeyList from './Setting/KeyList/KeyList';
import Keydetail from './Setting/privatekey/Keydetail';
import RecoveryPhasesDetail from './Setting/recoveryphase/Recoveryphasedetail';
import Resetpwd from './Setting/Resetpwd';
import './MainRoute.css';
import { withRouter } from 'react-router-dom';
import Header from './Dashboard/Header';
import Dashboard from './Dashboard';
import CollectionDetail from './NFT/CollectionDetail';
import EvmCollectionDetail from './NftEvm/CollectionDetail';
import Detail from './NFT/Detail';
import NftEvmDetail from './NftEvm/Detail';
import { PrivateRoute } from 'ui/component';
import { useWallet } from 'ui/utils';
import Enable from '../views/Enable';
import Send from '../views/Send';
import Swap from '../views/Swap';
import Deposit from '../views/Deposit';
import AddressBook from './Setting/AddressBook';
import SendAmount from './Send/SendAmount';
import SendEth from './Send/SendEth';
import TokenDetail from './TokenDetail';
import TokenList from './TokenList';
import AddCustomEvmToken from './Wallet/AddCustomEvmToken'
import Inbox from './Inbox';
import StakingPage from './Staking/StakingPage';
import UnstakePage from './Staking/UnstakePage';
import NodeDetail from './Staking/NodeDetail';
import Flowns from './Flowns';
import AddList from './NFT/NFTList/AddList';
import About from './Setting/About/About';
import Linked from './Setting/Linked';
import LinkedDetail from './Setting/Linked/LinkedDetail';
import LinkedCollection from './Setting/Linked/LinkedCollection';
import LinkedNftDetail from './Setting/Linked/LinkedNftDetail';
import Account from './Setting/Account';
import DeveloperMode from './Setting/DeveloperMode/DeveloperMode';
import Devices from './Setting/Devices/Devices';
import DeviceInfo from './Setting/Devices/DeviceInfo';
import WalletList from './Setting/Wallet';
import WalletDetail from './Setting/Wallet/WalletDetail';
import RemoveWallet from './Setting/Wallet/RemoveWallet';
import ManageBackups from './Setting/Backups';
import SendToAddress from './NFT/SendNFT/SendToAddress';
import SendNftEvm from './NftEvm/SendNFT/SendToAddress';
import { spring, AnimatedSwitch } from 'react-router-transition';
// import OnRampList from './Wallet/OnRampList';

const useStyles = makeStyles(() => ({
  innerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  mainBody: {
    flex: 1,
    overflowY: 'scroll',
    height: '100%',
  },
}));

function zoom(val) {
  return spring(val, {
    stiffness: 174,
    damping: 24,
  });
}

const switchConfig = {
  atEnter: {
    opacity: 0,
    offset: 50,
  },
  atLeave: {
    opacity: 0,
    offset: zoom(-50),
  },
  atActive: {
    opacity: 1,
    offset: zoom(0),
  },
};

function mapStyles(styles) {
  return {
    opacity: styles.opacity,
    transform: `translateX(${styles.offset}px)`,
  };
}

const Inner = (props) => {
  const classes = useStyles();
  // const location = useLocation();
  // const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(0);

  const wallet = useWallet();

  const fetch = async () => {
    const dashIndex = await wallet.getDashIndex();
    if (dashIndex) {
      setValue(dashIndex);
    } else {
      setValue(0);
      await wallet.setDashIndex(0);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    wallet.setDashIndex(value);
  }, [value]);

  return (
    <React.Fragment>
      <div className={classes.innerWrapper}>
        <Header loading={loading} />
        <AnimatedSwitch
          {...switchConfig}
          mapStyles={mapStyles}
          className="route-wrapper"
          id="scrollableTab"
        >
          <PrivateRoute exact path={`${props.match.url}/`}>
            <Dashboard value={value} setValue={setValue} />
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

          <PrivateRoute
            path={`${props.match.url}/nested/recoveryphrasepassword`}
          >
            <Recoveryphrasepassword />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/nested/recoveryphrasedetail`}>
            <RecoveryPhasesDetail />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/nested/resetpwd`}>
            <Resetpwd />
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

          <PrivateRoute path={`${props.match.url}/wallet/send`}>
            <Send />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/wallet/swap`}>
            <Swap />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/wallet/deposit`}>
            <Deposit />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/wallet/sendAmount`}>
            <SendAmount />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/wallet/sendeth`}>
            <SendEth />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/token/:id`}>
            <TokenDetail />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/tokenlist`}>
            <TokenList />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/addcustomevm`}>
            <AddCustomEvmToken />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/nested/add_list`}>
            <AddList />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/setting/about`}>
            <About />
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
          {/* <PrivateRoute path={`${props.match.url}/setting/devices`}>
            <Devices />
          </PrivateRoute> */}
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

          <PrivateRoute path={`${props.match.url}/setting/backups`}>
            <ManageBackups />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/flowns`}>
            <Flowns />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/enable`}>
            <Enable />
          </PrivateRoute>

          <PrivateRoute path={`${props.match.url}/inbox`}>
            <Inbox />
          </PrivateRoute>

          <PrivateRoute
            path={`${props.match.url}/staking/page/:nodeid/:delegateid`}
          >
            <StakingPage />
          </PrivateRoute>

          <PrivateRoute
            path={`${props.match.url}/unstake/page/:nodeid/:delegateid`}
          >
            <UnstakePage />
          </PrivateRoute>

          <PrivateRoute
            path={`${props.match.url}/staking/node/:nodeid/:delegateid`}
          >
            <NodeDetail />
          </PrivateRoute>
          {/* =======
            <Route exact path="/dashboard" component={Dashboard} />
            <Route path="/dashboard/nested/settingtwo" component={Settingtwo} />
            <Route path="/dashboard/nested/settingone" component={Settingone} />
            <Route path="/dashboard/nested/switchaccount" component={Switchaccount} />
            <Route path="/dashboard/nested/security" component={Security} /> */}
        </AnimatedSwitch>
      </div>
    </React.Fragment>
  );
};

export default withRouter(Inner);
