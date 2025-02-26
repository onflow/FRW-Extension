import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { HashRouter as Router, Route, useLocation } from 'react-router-dom';

import GlobalPasskeyPrompt from '@/ui/FRWComponent/GlobalPasskeyPrompt';
import themeOptions from '@/ui/style/LLTheme';
import { NewsProvider } from '@/ui/utils/NewsContext';
import { PasskeyPromptProvider } from '@/ui/utils/PasskeyPromptContext';
import { PrivateRoute } from 'ui/component';
import { WalletProvider, useWallet } from 'ui/utils';

// Uncomment this when we need to test api-test
import ApiTestPage from './api-test/api-test-page';
import Approval from './Approval';
import InnerRoute from './InnerRoute';
import { Landing } from './Landing';
import RetrievePK from './RetrievePK';
import SortHat from './SortHat';
import Unlock from './Unlock';

const theme = createTheme(themeOptions);

const Routes = () => {
  const location = useLocation();
  const wallet = useWallet();

  React.useEffect(() => {
    wallet.trackPageView(location.pathname);
  }, [location, wallet]);

  return (
    <>
      <Route exact path="/">
        <SortHat />
      </Route>
      <Route exact path="/unlock" component={Unlock} />
      <Route exact path="/retrieve" component={RetrievePK} />
      <Landing />
      <Route path="/dashboard">
        <InnerRoute />
      </Route>
      <PrivateRoute path="/approval">
        <Approval />
      </PrivateRoute>
      {/* uncomment this when we need to test api-test */}
      {process.env.NODE_ENV === 'development' && (
        <PrivateRoute path="/api-test">
          <ApiTestPage />
        </PrivateRoute>
      )}
    </>
  );
};

function Main() {
  return (
    <Router>
      <Routes />
      {/* Render the global passkey prompt */}
      <GlobalPasskeyPrompt />
    </Router>
  );
}

const App = ({ wallet }: { wallet: any }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WalletProvider wallet={wallet}>
        <NewsProvider>
          <PasskeyPromptProvider>
            <Main />
          </PasskeyPromptProvider>
        </NewsProvider>
      </WalletProvider>
    </ThemeProvider>
  );
};

export default App;
