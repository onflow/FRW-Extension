import { registerTestUser } from '../utils/helper';
import { test as setup } from '../utils/loader';

// for user register and login
setup('setup new wallet or login if already registered', async ({ page, extensionId }) => {
  setup.setTimeout(600_000);

  await page.goto(`chrome-extension://${extensionId}/index.html#/dashboard`);

  await page.waitForLoadState('domcontentloaded');

  await page.waitForURL(/.*unlock|.*welcome/);
  const pageUrl = page.url();
  const isWelcomePage = pageUrl.includes('welcome');

  // Create or login using our test user
  if (isWelcomePage) {
    // We're not starting from a fresh install, so login
    await registerTestUser({ page, extensionId });
  }
});
