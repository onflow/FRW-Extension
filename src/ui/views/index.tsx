import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Route } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { WalletProvider } from 'ui/utils';
import SortHat from './SortHat';
import Unlock from './Unlock';
import SwitchUnlock from './SwitchUnlock';
import RetrievePK from './RetrievePK';
import InnerRoute from './InnerRoute';
const AsyncMainRoute = lazy(() => import('./MainRoute'));
import theme from '../style/LLTheme';
import { ThemeProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import { PrivateRoute } from 'ui/component';
import Approval from './Approval';
// import Reset from './Reset';

function Main() {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    <Router history={createMemoryHistory}>
      <Route exact path="/">
        <SortHat />
      </Route>
      {/* <Route exact path="/reset" component={Reset} /> */}
      <Route exact path="/unlock" component={Unlock} />
      <Route exact path="/switchunlock" component={SwitchUnlock} />
      <Route exact path="/retrieve" component={RetrievePK} />
      <Suspense fallback={null}>
        <AsyncMainRoute />
      </Suspense>
      <Route path="/dashboard">
        <InnerRoute />
      </Route>
      <PrivateRoute path='/approval'>
        <Approval />
      </PrivateRoute>
    </Router>
  );
}

const App = ({ wallet }: { wallet: any }) => {
  return (
    <ThemeProvider theme={theme}>
      <WalletProvider wallet={wallet}>
        <GlobalStyles
          styles={{
            body: { backgroundColor: '#121212' },
          }}
        />
        <Main />
      </WalletProvider>
    </ThemeProvider>
  );
};

export default App;
