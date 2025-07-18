import { Alert, AlertTitle, Box } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { isChrome } from '@/ui/utils/browser';

const BrowserWarning = () => {
  const [isVisible, setIsVisible] = useState(false); // assume Chrome until checked

  useEffect(() => {
    (async () => {
      const chrome = await isChrome();
      setIsVisible(!chrome);
    })();
  }, []);

  if (!isVisible) {
    return null; // do not show warning if browser is Chrome
  }

  return (
    <Box m={2}>
      <Alert severity="warning">
        <AlertTitle>Browser Compatibility Warning</AlertTitle>
        Backup from Google Drive may not work correctly outside of Chrome. For the best experience,
        please consider using <strong>Chrome</strong>.
      </Alert>
    </Box>
  );
};

export default BrowserWarning;
