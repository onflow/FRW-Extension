import { test, loginToSenderAccount, getCurrentAddress, waitForTransaction } from './utils/helper';
export const sendTokenFlow = async ({
  page,
  tokenname,
  receiver,
  amount = '0.000112134354657',
  ingoreFlowCharge = false,
}) => {
  // Wait for the EVM account to be loaded
  await getCurrentAddress(page);
  await page.getByRole('tab', { name: 'coins' }).click();
  // send Ft token from COA
  await page.getByRole('button', { name: tokenname }).click();
  await page.getByRole('button', { name: 'SEND' }).click();
  await page.getByPlaceholder('Search address(0x), or flow').click();
  await page.getByPlaceholder('Search address(0x), or flow').fill(receiver);
  await page.getByPlaceholder('Amount').fill(amount);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Send' }).click();
  // Wait for the transaction to be completed
  await waitForTransaction({ page, successtext: 'sealed', amount, ingoreFlowCharge });
};

export const moveTokenFlow = async ({
  page,
  tokenname,
  amount = '0.000112134354657',
  ingoreFlowCharge = false,
}) => {
  await getCurrentAddress(page);
  await page.getByRole('tab', { name: 'coins' }).click();
  await page.getByRole('button', { name: tokenname }).click();
  await page.getByRole('button', { name: 'Move' }).click();
  await page.getByPlaceholder('Amount').click();
  await page.getByPlaceholder('Amount').fill(amount);
  await page.getByRole('button', { name: 'Move' }).click();

  // Wait for the transaction to be completed
  await waitForTransaction({ page, successtext: 'sealed', amount, ingoreFlowCharge });
};

export const moveTokenFlowHomepage = async ({
  page,
  tokenname,
  amount = '0.000000012345',
  ingoreFlowCharge = false,
}) => {
  await getCurrentAddress(page);
  await page.getByRole('button', { name: 'Move' }).click();
  await page.getByRole('button', { name: 'Move Tokens' }).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: tokenname, exact: true }).getByRole('img').click();
  await page.getByPlaceholder('Amount').click();
  await page.getByPlaceholder('Amount').fill(amount);
  await page.getByRole('button', { name: 'Move' }).click();
  // Wait for the transaction to be completed
  await waitForTransaction({ page, successtext: 'sealed', amount, ingoreFlowCharge });
};

test.beforeEach(async ({ page, extensionId }) => {
  // Login to our sender account
  await loginToSenderAccount({ page, extensionId });
});
//Send FLOW token from Flow to Flow
test('send FLOW flow to flow', async ({ page }) => {
  // This can take a while
  await sendTokenFlow({
    page,
    tokenname: /^FLOW \$/i,
    receiver: process.env.TEST_RECEIVER_ADDR!,
    amount: '0.00123456',
  });
});

//Send StFlow from Flow to Flow
test('send stFlow flow to flow', async ({ page }) => {
  await sendTokenFlow({
    page,
    tokenname: 'Liquid Staked Flow $',
    receiver: process.env.TEST_RECEIVER_ADDR!,
    amount: '0.00123456',
  });
});

//Send FLOW token from Flow to COA
test('send FLOW flow to COA', async ({ page }) => {
  // This can take a while
  await sendTokenFlow({
    page,
    tokenname: /^FLOW \$/i,
    receiver: process.env.TEST_RECEIVER_EVM_ADDR!,
    amount: '0.00123456',
  });
});
//Send USDC from Flow to Flow
test('send USDC flow to COA', async ({ page }) => {
  await sendTokenFlow({
    page,
    tokenname: 'USDC.e (Flow) $',
    receiver: process.env.TEST_RECEIVER_EVM_ADDR!,
    ingoreFlowCharge: true,
    amount: '0.00123456',
  });
});

//Send FLOW token from Flow to EOA
test('send FLOW flow to EOA', async ({ page }) => {
  // This can take a while
  await sendTokenFlow({
    page,
    tokenname: /^FLOW \$/i,
    receiver: process.env.TEST_RECEIVER_METAMASK_EVM_ADDR!,
    amount: '0.00123456',
  });
});

//Send BETA from Flow to EOA
test('send BETA flow to EOA', async ({ page }) => {
  await sendTokenFlow({
    page,
    tokenname: 'BETA $',
    receiver: process.env.TEST_RECEIVER_METAMASK_EVM_ADDR!,
    ingoreFlowCharge: true,
    amount: '0.00123456',
  });
});
/* //Move FTs from  Flow to COA
test('move Flow Flow to COA', async ({ page }) => {
  // Move FLOW token from FLOW to COA
  await moveTokenFlow({
    page,
    tokenname: /^FLOW \$/i,
  });
});

test('move USDC token FLOW to COA', async ({ page }) => {
  // Move USDC token from FLOW to COA
  await moveTokenFlow({
    page,
    tokenname: 'USDC.e (Flow)',
    ingoreFlowCharge: true,
  });
});

//Move from main page
test('move Flow Flow to COA homepage', async ({ page }) => {
  // Move FLOW token from FLOW to COA
  await moveTokenFlowHomepage({
    page,
    tokenname: 'Flow',
  });
});

test('move USDC token Flow to COA homepage', async ({ page }) => {
  // Move USDC token from FLOW to COA
  await moveTokenFlowHomepage({
    page,
    tokenname: 'USDC.e (Flow)',
    amount: '0.0000123',
    ingoreFlowCharge: true,
  });
});
 */
