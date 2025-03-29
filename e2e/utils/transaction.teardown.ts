// Just import from playwright as we don't want to load the extension from the temp directory
import { test as teardown } from '@playwright/test';

import { cleanExtension } from './loader';

teardown('cleanup extension data', async () => {
  //   Create a new page and navigate to extension
  await cleanExtension('transaction');
});
