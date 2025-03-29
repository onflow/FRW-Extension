import { test as setup } from './loader';

// for user register and login
setup('setup new wallet or login if already registered', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/index.html#/dashboard`);
});
