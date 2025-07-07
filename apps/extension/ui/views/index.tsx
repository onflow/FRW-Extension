import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { Route, HashRouter as Router, Routes, useLocation } from 'react-router';

import PrivateRoute from '@/ui/components/PrivateRoute';
import { useWallet } from '@/ui/hooks/use-wallet';
import themeOptions from '@/ui/style/LLTheme';
import { WalletProvider } from '@/ui/utils/WalletContext';

// Uncomment this when we need to test api-test
import ApiTestPage from './api-test/api-test-page';
import Approval from './Approval';
import Forgot from './Forgot';
import Recover from './Forgot/Recover';
import Reset from './Forgot/Reset';
import InnerRoute from './InnerRoute';
import SortHat from './SortHat';
import Unlock from './Unlock';
import Welcome from './Welcome';
import RecoverProfile from './Welcome/RecoverProfile';
import Register from './Welcome/Register';
import Sync from './Welcome/Sync';

const theme = createTheme(themeOptions);

const AppRoutes = () => {
  const location = useLocation();
  const wallet = useWallet();

  React.useEffect(() => {
    wallet.trackPageView(location.pathname);
  }, [location, wallet]);

  return (
    <Routes>
      <Route path="/" element={<SortHat />} />
      <Route path="/unlock" element={<Unlock />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/welcome/register" element={<Register />} />
      <Route path="/welcome/recoverprofile" element={<RecoverProfile />} />
      <Route path="/welcome/sync" element={<Sync />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/forgot/recover" element={<Recover />} />
      <Route path="/forgot/reset" element={<Reset />} />
      <Route path="/dashboard/*" element={<InnerRoute />} />
      <Route
        path="/approval/*"
        element={
          <PrivateRoute>
            <Approval />
          </PrivateRoute>
        }
      />
      {/* uncomment this when we need to test api-test */}
      {process.env.NODE_ENV === 'development' && (
        <Route
          path="/api-test/*"
          element={
            <PrivateRoute>
              <ApiTestPage />
            </PrivateRoute>
          }
        />
      )}
    </Routes>
  );
};

function Main() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

const App = ({ wallet }: { wallet: any }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WalletProvider wallet={wallet}>
        <Main />
      </WalletProvider>
    </ThemeProvider>
  );
};

export default App;
