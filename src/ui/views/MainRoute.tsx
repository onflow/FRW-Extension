import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Synce from './Sync';
import RegisterPager from './Register/RegisterPager';
import RecoverRegister from './RecoverRegister';
import AddressImport from './AddressImport';
import AddRegister from './AddWelcome/AddRegister';
import AddImport from './AddWelcome/AddressImport';
import AddSync from './AddWelcome/Sync';
// import ProxySync from './AddWelcome/ProxySync';
import AddWelcome from './AddWelcome';
import GoogleImport from './AddressImport/GoogleImport';
import AddGoogle from './AddWelcome/AddressImport/GoogleImport';
import Forgot from './Forgot';
import Reset from './Forgot/Reset';
import Recover from './Forgot/Recover';
import WelcomePage from './WelcomePage';
import './MainRoute.css';
import { spring, AnimatedSwitch } from 'react-router-transition';

// eslint-disable-next-line @typescript-eslint/no-empty-function

const LogPageView = () => {
  return null;
};

function mapStyles(styles) {
  return {
    opacity: styles.opacity,
    transform: `scale(${styles.scale})`,
  };
}

// wrap the `spring` helper to use a bouncy config
function bounce(val) {
  return spring(val, {
    stiffness: 33,
    damping: 22,
  });
}

// child matches will...
const bounceTransition = {
  // start in a transparent, upscaled state
  atEnter: {
    opacity: 0.5,
    // offset: 10,
    scale: 1.05,
  },
  // leave in a transparent, downscaled state
  atLeave: {
    opacity: bounce(0.5),
    // offset: 10,
    scale: bounce(0.95),
  },
  // and rest at an opaque, normally-scaled state
  atActive: {
    opacity: 1,
    // offset: 0,
    scale: bounce(1),
  },
};

const Main = () => {
  return (
    <div style={{ display: 'contents' }}>
      <Route path="/" component={LogPageView} />
      <AnimatedSwitch
        atEnter={bounceTransition.atEnter}
        atLeave={bounceTransition.atLeave}
        atActive={bounceTransition.atActive}
        mapStyles={mapStyles}
        className="switch-wrapper"
      >
        <Switch>
          <Route exact path="/welcome" component={WelcomePage} />
          <Route exact path="/register" component={RegisterPager} />
          <Route exact path="/sync" component={Synce} />
          <Route exact path="/addressimport" component={AddressImport} />
          <Route exact path="/recover" component={RecoverRegister} />
          <Route exact path="/addregister" component={AddRegister} />
          {/* <Route exact path="/proxysync" component={ProxySync} /> */}
          <Route exact path="/addimport" component={AddImport} />
          <Route exact path="/addsync" component={AddSync} />
          <Route exact path="/addwelcome" component={AddWelcome} />
          <Route exact path="/forgot" component={Forgot} />
          <Route exact path="/recoverpage" component={Recover} />
          <Route exact path="/resetpage" component={Reset} />
          <Route exact path="/reset" component={WelcomePage} />
          <Route exact path="/import/google" component={GoogleImport} />
          <Route exact path="/add/google" component={AddGoogle} />
          <Route exact path="/import/accounts" component={GoogleImport} />
        </Switch>
      </AnimatedSwitch>
    </div>
  );
};

export default Main;
