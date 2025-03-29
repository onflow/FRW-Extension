import { loginAsTestUser, registerTestUser } from './utils/helper';
import { test } from './utils/loader';

test.beforeAll(async ({ page, extensionId }) => {
  // let playwright know this is going to be slow
  // Wait up to 10 minutes to setup an account
  test.setTimeout(600_000);
  // Create a new page and navigate to extension
  // Navigate and wait for network to be idle
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

test('Login test', async ({ page, extensionId }) => {
  await loginAsTestUser({ page, extensionId });
});
