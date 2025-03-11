import BN from 'bignumber.js';

import {
  test as setup,
  loginAsTestUser,
  registerTestUser,
  importReceiverAccount,
  importSenderAccount,
  lockExtension,
  expect,
  switchToEvm,
  loginToSenderAccount,
} from './helper';

// Define minimum required balances for each token
const REQUIRED_BALANCES_CADENCE = {
  flow: '0.01', // Sum of Flow transactions in Cadence (0.00123456 * 3) plus buffer
  stFlow: '0.002', // stFlow requirement (0.00123456) plus buffer
  'usdc.e': '0.002', // USDC requirement (0.00123456) plus buffer
  beta: '0.002', // BETA requirement (0.00123456) plus buffer
};

const REQUIRED_BALANCES_EVM = {
  flow: '0.15', // Sum of Flow transactions in EVM (0.12345678 + 0.00123456 * 2) plus buffer
  stFlow: '0.000002', // stFlow requirement (0.00000112134354678) plus buffer
  'usdc.e': '0.003', // Bridged USDC requirement (0.002468) plus buffer
  beta: '0.002', // BETA requirement (0.001234567890123456) plus buffer
};

const getTokenBalance = async (page, tokenName: string): Promise<string> => {
  await page.getByRole('tab', { name: 'coins' }).click();

  // Get the balance from the token detail view
  const balanceText = await page
    .getByTestId(`coin-balance-${tokenName.toLowerCase()}`)
    .textContent();

  // Extract just the number from the balance text
  const balance = balanceText?.match(/[\d.]+/)?.[0] || '0';
  return balance;
};

const checkTokenBalance = (tokenName: string, actualBalance: string, requiredBalance: string) => {
  const actual = new BN(actualBalance);
  const required = new BN(requiredBalance);

  expect(
    actual.gte(required),
    `Insufficient ${tokenName} balance. Required: ${requiredBalance}, Actual: ${actualBalance}`
  ).toBeTruthy();
};

// for user register and login
setup('setup new wallet or login if already registered', async ({ page, extensionId }) => {
  // let playwright know this is going to be slow
  // Wait up to 10 minutes to setup an account
  setup.setTimeout(600_000);
  // Create a new page and navigate to extension
  // Navigate and wait for network to be idle

  await page.goto(`chrome-extension://${extensionId}/index.html#/dashboard`);

  await page.waitForLoadState('domcontentloaded');

  await page.waitForURL(/.*unlock|.*welcome/);
  const pageUrl = page.url();
  const isUnlockPage = pageUrl.includes('unlock');

  // Create or login using our test user
  if (isUnlockPage) {
    // We're not starting from a fresh install, so login
    await loginAsTestUser({ page, extensionId });
  } else {
    await registerTestUser({ page, extensionId });
  }
});

setup('Import sender and receiver accounts', async ({ page, extensionId }) => {
  // Lock the extension and import sender and receiver accounts
  await importSenderAccount({ page, extensionId });
  await lockExtension({ page });
  await importReceiverAccount({ page, extensionId });
});

setup('Verify sufficient token balances for transaction tests', async ({ page, extensionId }) => {
  // Login to sender account
  await loginToSenderAccount({ page, extensionId });

  // First check Cadence wallet balances
  console.log('Checking Cadence wallet balances...');
  for (const [tokenName, requiredBalance] of Object.entries(REQUIRED_BALANCES_CADENCE)) {
    const balance = await getTokenBalance(page, tokenName);
    checkTokenBalance(tokenName, balance, requiredBalance);
  }

  // Switch to EVM wallet and check balances
  await switchToEvm({ page, extensionId: '' });
  console.log('Checking EVM wallet balances...');
  for (const [tokenName, requiredBalance] of Object.entries(REQUIRED_BALANCES_EVM)) {
    const balance = await getTokenBalance(page, tokenName);
    checkTokenBalance(tokenName, balance, requiredBalance);
  }
});
