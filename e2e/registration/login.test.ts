import { fillInPassword, importSenderAccount, loginAsTestUser } from '../utils/helper';
import { test, expect, getAuth } from '../utils/loader';

test('Login test', async ({ page, extensionId }) => {
  await loginAsTestUser({ page, extensionId });
});

test('Remove profile test', async ({ page, extensionId }) => {
  const keysFile = await getAuth();

  if (keysFile.password === '') {
    throw new Error('Password is empty in keys file');
  }
  await loginAsTestUser({ page, extensionId });
  await importSenderAccount({ page, extensionId });

  await page.getByLabel('avatar').click();
  await page.getByLabel('avatar').click();
  await page.getByLabel('avatar').click();
  await page.getByTestId('setting-goto-account-button').click();

  await page.getByRole('button', { name: 'Remove Profile' }).click();
  await fillInPassword({ page, password: keysFile.password });
  await page.getByRole('button', { name: 'Remove' }).click();

  // Wait for the unlock page to load
  await page.waitForURL(`chrome-extension://${extensionId}/index.html#/unlock`);

  // Now login as the test user
  await loginAsTestUser({ page, extensionId });
  // Check that the sender account is not visible
  // switch to the correct account
  await page.getByTestId('account-menu-button').click();
  await page.getByTestId('switch-profile-button').click();

  expect(await page.getByTestId('profile-item-nickname-sender').count()).toBe(0);
});
