import { spawn } from 'child_process';
import path from 'path';

import { importAccountBySeedPhrase, importSenderAccount } from '../utils/helper';
import { test, expect } from '../utils/loader';

let serverProcess: ReturnType<typeof spawn>;

test.beforeAll(async ({ page, extensionId }) => {
  // Load the extension first
  await page.goto(`chrome-extension://${extensionId}/index.html#/dashboard`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForURL(/.*unlock|.*welcome/);

  await importSenderAccount({ page, extensionId });

  // Start the static server
  serverProcess = spawn('npx', ['serve', '.', '-l', '3000'], {
    cwd: import.meta.dirname,
    stdio: 'inherit',
    shell: true,
  });

  // Wait a bit for the server to start (or poll the port)
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await page.goto('http://localhost:3000/test-eip6963.html');
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

/// Work in progress
test.describe.skip('Wallet Discovery', () => {
  test('should discover wallets', async ({ page, extensionId }) => {
    await page.waitForLoadState('domcontentloaded');

    await page.goto('http://localhost:3000/test-eip6963.html');
    await page.pause();
    await expect(page.getByText('com.flowfoundation.wallet')).toBeVisible();
  });
});
