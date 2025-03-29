import {
  getCurrentAddress,
  waitForTransaction,
  loginToSenderOrReceiver,
  getReceiverEvmAccount,
  getReceiverCadenceAccount,
  checkSentAmount,
} from './utils/helper';
import { test } from './utils/loader';
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
  const txId = await waitForTransaction({ page, successtext: 'Executed', ingoreFlowCharge });
  return { txId, tokenname, amount, ingoreFlowCharge };
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
  const txId = await waitForTransaction({ page, successtext: 'Executed', ingoreFlowCharge });
  return { txId, tokenname, amount, ingoreFlowCharge };
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
  const txId = await waitForTransaction({ page, successtext: 'Executed', ingoreFlowCharge });
  return { txId, tokenname, amount, ingoreFlowCharge };
};

test.beforeEach(async ({ page, extensionId }) => {
  // Login to our sender account
  await loginToSenderOrReceiver({ page, extensionId, parallelIndex: test.info().parallelIndex });
});

const txList: { txId: string; tokenname: string; amount: string; ingoreFlowCharge: boolean }[] = [];

//Send FLOW token from Flow to Flow
test('send FLOW flow to flow', async ({ page }) => {
  // This can take a while
  const tx = await sendTokenFlow({
    page,
    tokenname: /^FLOW \$/i,
    receiver: getReceiverCadenceAccount({ parallelIndex: test.info().parallelIndex }),
    amount: '0.00123456',
  });
  txList.push(tx);
});

//Send StFlow from Flow to Flow
test('send stFlow flow to flow', async ({ page }) => {
  const tx = await sendTokenFlow({
    page,
    tokenname: 'Liquid Staked Flow $',
    receiver: getReceiverCadenceAccount({ parallelIndex: test.info().parallelIndex }),
    amount: '0.00123456',
  });
  txList.push(tx);
});

//Send FLOW token from Flow to COA
test('send FLOW flow to COA', async ({ page }) => {
  // This can take a while
  const tx = await sendTokenFlow({
    page,
    tokenname: /^FLOW \$/i,
    receiver: getReceiverEvmAccount({ parallelIndex: test.info().parallelIndex }),
    amount: '0.00123456',
  });
  txList.push(tx);
});
//Send USDC from Flow to Flow
test('send USDC flow to COA', async ({ page }) => {
  const tx = await sendTokenFlow({
    page,
    tokenname: 'USDC.e (Flow) $',
    receiver: getReceiverEvmAccount({ parallelIndex: test.info().parallelIndex }),
    ingoreFlowCharge: true,
    amount: '0.00123456',
  });
  txList.push(tx);
});

//Send FLOW token from Flow to EOA
test('send FLOW flow to EOA', async ({ page }) => {
  // This can take a while
  const tx = await sendTokenFlow({
    page,
    tokenname: /^FLOW \$/i,
    receiver: process.env.TEST_RECEIVER_METAMASK_EVM_ADDR!,
    amount: '0.00123456',
  });
  txList.push(tx);
});

//Send BETA from Flow to EOA
test('send BETA flow to EOA', async ({ page }) => {
  const tx = await sendTokenFlow({
    page,
    tokenname: 'BETA $',
    receiver: process.env.TEST_RECEIVER_METAMASK_EVM_ADDR!,
    ingoreFlowCharge: true,
    amount: '0.00123456',
  });
  txList.push(tx);
});

test('check all sealed transactions', async ({ page, extensionId }) => {
  await loginToSenderOrReceiver({ page, extensionId, parallelIndex: test.info().parallelIndex });
  // Go to the activity page
  await page.goto(`chrome-extension://${extensionId}/index.html#/dashboard?activity=1`);
  await page.waitForURL(/.*\/dashboard.*/);

  // Check the amounts that were sent for each transaction
  await Promise.all(
    txList.map(async (tx) => {
      await checkSentAmount({
        page,
        txId: tx.txId,
        amount: tx.amount,
        sealedText: 'sealed',
        ingoreFlowCharge: tx.ingoreFlowCharge,
      });
    })
  );
});
