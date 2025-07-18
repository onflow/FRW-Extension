// Just import from playwright as we don't want to load the extension from the temp directory
import { test as teardown } from '@playwright/test';

import { cleanAuth, cleanExtension } from '../utils/loader';

teardown('cleanup registration keys', async () => {
  //   Create a new page and navigate to extension
  await cleanAuth();
  await cleanExtension('registration');
});
