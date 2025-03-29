import { type Page } from '@playwright/test';

import { getAuth, saveAuth, expect } from './loader';

export const getClipboardText = async () => {
  const text = await navigator.clipboard.readText();
  return text;
};

export const closeOpenedPages = async (page: Page) => {
  const allPages = page.context().pages();
  if (allPages.length > 1) {
    for (const p of allPages) {
      if (p !== page) {
        await p.close();
      }
    }
  }
};

export const getCurrentAddress = async (page: Page) => {
  // Wait for the dashboard page to be fully loaded
  await page.waitForURL(/.*\/dashboard.*/);

  //await expect(page.getByLabel('Copy Address')).toBeVisible({ timeout: 120_000 });
  const copyIcon = await page.getByLabel('Copy Address');
  await copyIcon.isVisible({ timeout: 120_000 });

  await copyIcon.click();

  const flowAddr = await page.evaluate(getClipboardText);
  return flowAddr;
};

export const lockExtension = async ({ page }) => {
  // Assume we're logged in before calling this

  await page.getByLabel('menu').click();
  await page.getByRole('button', { name: 'Lock Wallet' }).click();
  const unlockBtn = await page.getByRole('button', { name: 'Unlock Wallet' });

  await expect(unlockBtn).toBeEnabled({ enabled: true, timeout: 60_000 });
};

export const loginToExtensionAccount = async ({ page, extensionId, addr, password }) => {
  // close all pages except the current page
  await closeOpenedPages(page);

  // Navigate and wait for network to be idle
  await page.goto(`chrome-extension://${extensionId}/index.html#/unlock`);

  await page.waitForSelector('.logoContainer', { state: 'visible' });
  await closeOpenedPages(page);

  await page.getByPlaceholder('Enter your password').clear();
  await page.getByPlaceholder('Enter your password').fill(password);

  const unlockBtn = await page.getByRole('button', { name: 'Unlock Wallet' });

  await expect(unlockBtn).toBeEnabled({ enabled: true, timeout: 60_000 });

  // close all pages except the current page (the extension opens them in the background)
  await unlockBtn.click();
  // get address
  let flowAddr = await getCurrentAddress(page);

  if (flowAddr !== addr) {
    // switch to the correct account
    await page.getByLabel('menu').click();
    await page.getByRole('button', { name: 'close' }).click();
    await expect(page.getByText('Profile', { exact: true })).toBeVisible();
    // Switch to the correct account. Note doest not handle more than 3 accounts loaded
    await page.getByRole('button', { name: 'avatar' }).getByText(addr).click();

    // get address
    flowAddr = await getCurrentAddress(page);
  }

  expect(flowAddr).toBe(addr);

  // Wait for the coins to be loaded
  await expect(page.getByRole('button', { name: 'Flow' }).first()).toBeVisible();
};

export const loginAsTestUser = async ({ page, extensionId }) => {
  const keysFile = await getAuth();

  if (keysFile.password === '') {
    return false;
  }

  const { password, addr } = keysFile;

  return loginToExtensionAccount({ page, extensionId, password, addr });
};

const getNumber = (str: string) => {
  const match = str.match(/\d+/);
  return match ? parseInt(match[0]) : null;
};

export const registerAccount = async ({ page, extensionId, username, password }) => {
  // We're starting from a fresh install, so create a new wallet
  await closeOpenedPages(page);
  // Wait for the welcome page to be fully loaded
  await page.waitForSelector('.welcomeBox', { state: 'visible' });

  // Click on register button
  await page.getByRole('link', { name: 'Create a new wallet' }).click();

  // Wait for the register page to be fully loaded
  await page.getByText('Your username will be used to').isVisible();

  // Fill in the form
  await page.getByPlaceholder('Username').fill(username);

  // Click on register button
  await page.getByRole('button', { name: 'Next' }).click();

  await page
    .locator('div')
    .filter({ hasText: /^Click here to reveal phrase$/ })
    .getByRole('button')
    .click();

  await page.getByRole('button', { name: 'Copy' }).click();

  // got keys from clipboard
  const clipboardText = await page.evaluate(getClipboardText);

  const keyArr = clipboardText.split(' ');

  // next step
  await page.getByRole('button', { name: 'Okay, I have saved it properly' }).click();

  // get puzzles
  const firstIdx = await page.locator('div').getByText('#').first().textContent();
  const secondIdx = await page.locator('div').getByText('#').nth(1).textContent();
  const thirdIdx = await page.locator('div').getByText('#').nth(2).textContent();

  const firstMnemonic = keyArr[getNumber(firstIdx!)! - 1];
  const secondMnemonic = keyArr[getNumber(secondIdx!)! - 1];
  const thirdMnemonic = keyArr[getNumber(thirdIdx!)! - 1];

  // console.log(firstMnemonic, secondMnemonic, thirdMnemonic);
  // click the right mnemonic word

  // resolve mnemonics puzzles
  await page.getByLabel('row0').getByRole('button', { name: firstMnemonic }).click();
  await page.getByLabel('row1').getByRole('button', { name: secondMnemonic }).click();
  await page.getByLabel('row2').getByRole('button', { name: thirdMnemonic }).click();

  await page
    .locator('div')
    .filter({ hasText: /^Next$/ })
    .click();

  // fill
  await page.getByPlaceholder('Create a password').clear();
  await page.getByPlaceholder('Create a password').fill(password);
  await page.getByPlaceholder('Confirm your password').clear();
  await page.getByPlaceholder('Confirm your password').fill(password);

  await page.getByLabel("I agree to Flow Wallet's").click();

  const registerBtn = await page.getByRole('button', { name: 'Register' });
  await registerBtn.click();
  await expect(page.getByRole('button', { name: 'Connect and Back up' })).toBeVisible({
    timeout: 120_000,
  });

  // await unlockBtn.isEnabled();
  await page.goto(`chrome-extension://${extensionId}/index.html#/dashboard`);

  // get address
  const copyIcon = await page.getByLabel('Copy Address');
  await expect(copyIcon).toBeEnabled({ timeout: 600_000 }); // 10 minutes...

  await copyIcon.isEnabled();

  await copyIcon.click();

  const flowAddr = await page.evaluate(getClipboardText);

  // save keys and pwd to keys file
  return {
    privateKey: clipboardText,
    password: password,
    addr: flowAddr,
  };
};

export const registerTestUser = async ({ page, extensionId }) => {
  const username = 'testuser';
  const password = process.env.TEST_PASSWORD;
  if (!password) {
    throw new Error('TEST_PASSWORD is not set');
  }

  const {
    privateKey,
    password: pwd,
    addr,
  } = await registerAccount({ page, extensionId, username, password });

  await saveAuth({
    privateKey,
    password: pwd,
    addr,
  });
};

export const importAccountBySeedPhrase = async ({
  page,
  extensionId,
  seedPhrase,
  username,
  accountAddr = '',
}) => {
  const password = process.env.TEST_PASSWORD;
  if (!password) {
    throw new Error('TEST_PASSWORD is not set');
  }

  if (page.url().includes('dashboard')) {
    // Wait for the dashboard page to be fully loaded
    await page.waitForURL(/.*\/dashboard.*/);

    // We're already logged in so we need to click import profile
    await page.getByLabel('menu').click();
    await page.getByRole('button', { name: 'Import Profile' }).click();
    // Close all pages except the current page (the extension opens them in the background)
    await closeOpenedPages(page);
  }

  // Go to the import page
  await page.goto(`chrome-extension://${extensionId}/index.html#/welcome/accountimport`);

  // Close all pages except the current page (the extension opens them in the background)
  await closeOpenedPages(page);

  await page.getByRole('tab', { name: 'Seed Phrase' }).click();
  await page.getByPlaceholder('Import 12 or 24 words split').click();

  await page.getByPlaceholder('Import 12 or 24 words split').fill(seedPhrase);

  await page.getByRole('button', { name: 'Import' }).click();
  // We need to wait for the next step to be visible
  await expect(page.getByText('STEP')).not.toContainText('1/6');

  const step = await page.getByText('STEP').textContent();

  if (step.includes('4')) {
    // We've already imported the account before
    const confirmPasswordField = await page.getByPlaceholder('Confirm Password');
    const confirmPasswordValue = await confirmPasswordField.inputValue();
    if (!confirmPasswordValue) {
      await confirmPasswordField.fill(password);
    }
    // await page.getByPlaceholder('Confirm Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    // await page.getByRole('button', { name: 'Login' }).click();
  } else if (step.includes('2')) {
    // We haven't imported the account before
    await page.getByPlaceholder('Username').fill(username);
    await page.getByRole('button', { name: 'Next' }).click();

    // fill in the password
    await page.getByPlaceholder('Create a password').clear();
    await page.getByPlaceholder('Create a password').fill(password);
    await page.getByPlaceholder('Confirm your password').clear();
    await page.getByPlaceholder('Confirm your password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
  }

  // Wait for the Google Drive backup text to be visible
  await expect(page.getByRole('button', { name: 'Connect and Back up' })).toBeVisible({
    timeout: 10_000,
  });

  await page.goto(`chrome-extension://${extensionId}/index.html#/dashboard`);
  await page.waitForURL(/.*\/dashboard.*/);
  // Wait for the account address to be visible
  await expect(page.getByText(accountAddr)).toBeVisible();
  const flowAddr = await getCurrentAddress(page);

  if (accountAddr && flowAddr !== accountAddr) {
    throw new Error('Account address does not match');
  }

  return flowAddr;
};

export const importSenderAccount = async ({ page, extensionId }) => {
  await importAccountBySeedPhrase({
    page,
    extensionId,
    seedPhrase: process.env.TEST_SEED_PHRASE_SENDER,
    username: 'sender',
    accountAddr: process.env.TEST_SENDER_ADDR,
  });
};

export const loginToSenderAccount = async ({ page, extensionId }) => {
  if (!process.env.TEST_SENDER_ADDR) {
    throw new Error('TEST_SENDER_ADDR is not set');
  }

  if (!process.env.TEST_PASSWORD) {
    throw new Error('TEST_PASSWORD is not set');
  }

  await loginToExtensionAccount({
    page,
    extensionId,
    addr: process.env.TEST_SENDER_ADDR!,
    password: process.env.TEST_PASSWORD!,
  });
};

export const loginToReceiverAccount = async ({ page, extensionId }) => {
  if (!process.env.TEST_RECEIVER_ADDR) {
    throw new Error('TEST_RECEIVER_ADDR is not set');
  }

  if (!process.env.TEST_PASSWORD) {
    throw new Error('TEST_PASSWORD is not set');
  }

  await loginToExtensionAccount({
    page,
    extensionId,
    addr: process.env.TEST_RECEIVER_ADDR!,
    password: process.env.TEST_PASSWORD!,
  });
};

export const importReceiverAccount = async ({ page, extensionId }) => {
  await importAccountBySeedPhrase({
    page,
    extensionId,
    seedPhrase: process.env.TEST_SEED_PHRASE_RECEIVER,
    username: 'receiver',
    accountAddr: process.env.TEST_RECEIVER_ADDR,
  });
};

export const getReceiverCadenceAccount = ({ parallelIndex }) => {
  // If parallel index is 0, login to sender account, otherwise login to receiver account
  if (parallelIndex === 0) {
    // We've logged into the sender account, and we need to send tokens to the receiver account
    return process.env.TEST_RECEIVER_ADDR;
  } else {
    // We've logged into the receiver account, and we need to send tokens back to the sender account
    return process.env.TEST_SENDER_ADDR;
  }
};

export const getReceiverEvmAccount = ({ parallelIndex }) => {
  // If parallel index is 0, login to sender account, otherwise login to receiver account
  if (parallelIndex === 0) {
    // We've logged into the sender account, and we need to send tokens to the receiver account
    return process.env.TEST_RECEIVER_EVM_ADDR;
  } else {
    // We've logged into the receiver account, and we need to send tokens back to the sender account
    return process.env.TEST_SENDER_EVM_ADDR;
  }
};
export const loginToSenderOrReceiver = async ({ page, extensionId, parallelIndex }) => {
  // If parallel index is 0, login to sender account, otherwise login to receiver account
  if (parallelIndex === 0) {
    await loginToSenderAccount({ page, extensionId });
  } else {
    await loginToReceiverAccount({ page, extensionId });
  }
};
export const switchToEvm = async ({ page, extensionId }) => {
  // Assume the user is on the dashboard page
  await page.getByLabel('menu').click();
  // switch to COA account
  await page.getByRole('button', { name: 'EVM' }).nth(0).click();
  // get address
  await getCurrentAddress(page);
};

export const switchToFlow = async ({ page, extensionId }) => {
  // Assume the user is on the dashboard page
  await page.getByLabel('menu').click();
  // switch to COA account
  await page.getByRole('button', { name: 'Flow' }).nth(0).click();
  // get address
  await getCurrentAddress(page);
};

const getActivityItemRegexp = (txId: string, ingoreFlowCharge = false) => {
  return new RegExp(`^.*${txId}.*${ingoreFlowCharge ? '(?<!FlowToken)' : ''}$`);
};

export const checkSentAmount = async ({
  page,
  sealedText,
  amount,
  txId,
  ingoreFlowCharge = false,
}) => {
  const activityItemRegexp = getActivityItemRegexp(txId, ingoreFlowCharge);
  const sealedItem = page.getByTestId(activityItemRegexp).filter({ hasText: sealedText });
  await expect(sealedItem).toBeVisible({
    timeout: 60_000,
  });
  await expect(
    page.getByTestId(activityItemRegexp).getByTestId(`token-balance-${amount}`)
  ).toBeVisible();
};

export const waitForTransaction = async ({
  page,
  successtext = 'success',
  amount = '',
  ingoreFlowCharge = false,
}) => {
  // Wait for the transaction to be completed
  await page.waitForURL(/.*dashboard\?activity=1.*/);
  const url = await page.url();

  const txId = url.match(/[\?&]txId=(\w+)/i)?.[1];

  expect(txId).toBeDefined();

  const progressBar = page.getByRole('progressbar');
  await expect(progressBar).toBeVisible();
  // Get the pending item with the cadence txId that was put in the url and status is pending

  const activityItemRegexp = getActivityItemRegexp(txId, ingoreFlowCharge);
  const pendingItem = page.getByTestId(activityItemRegexp).filter({ hasText: 'Pending' });

  await expect(pendingItem).toBeVisible({
    timeout: 60_000,
  });
  /// await expect(progressBar).not.toBeVisible({ timeout: 60_000 });

  // Get the executed item with the cadence txId that was put in the url and status is success
  const executedItem = page.getByTestId(activityItemRegexp).filter({ hasText: successtext });

  await expect(executedItem).toBeVisible({
    timeout: 60_000,
  });

  if (amount) {
    await expect(
      page.getByTestId(activityItemRegexp).getByTestId(`token-balance-${amount}`)
    ).toBeVisible();
  }

  return txId;
};
