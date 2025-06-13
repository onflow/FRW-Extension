import {
  getCurrentAddress,
  waitForTransaction,
  loginToSenderOrReceiver,
  getReceiverEvmAccount,
  getReceiverCadenceAccount,
  checkSentAmount,
} from '../utils/helper';
import { test } from '../utils/loader';
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
  await page.getByTestId(`token-${tokenname.toLowerCase()}`).click();
  await page.getByTestId(`send-button`).click();
  await page.getByPlaceholder('Search address(0x), or flow').click();
  await page.getByPlaceholder('Search address(0x), or flow').fill(receiver);
  await page.getByPlaceholder('Amount').fill(amount);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Send' }).click();
  // Wait for the transaction to be completed
  const txId = await waitForTransaction({ page, successtext: /Executed|Sealed/, ingoreFlowCharge });
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
  await page.getByTestId(`token-${tokenname.toLowerCase()}`).click();
  await page.getByRole('button', { name: 'Move' }).click();
  await page.getByPlaceholder('Amount').click();
  await page.getByPlaceholder('Amount').fill(amount);
  await page.getByRole('button', { name: 'Move' }).click();

  // Wait for the transaction to be completed
  const txId = await waitForTransaction({ page, successtext: /Executed|Sealed/, ingoreFlowCharge });
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
  const txId = await waitForTransaction({ page, successtext: /Executed|Sealed/, ingoreFlowCharge });
  return { txId, tokenname, amount, ingoreFlowCharge };
};

test.beforeEach(async ({ page, extensionId }) => {
  // Login to our sender account
  await loginToSenderOrReceiver({ page, extensionId, parallelIndex: test.info().parallelIndex });
});

const txList: { txId: string; tokenname: string; amount: string; ingoreFlowCharge: boolean }[] = [];

//Send FLOW token from Flow to Flow
test('send Cadence transactions', async ({ page, extensionId }) => {
  test.setTimeout(120_000);
  // This can take a while
  const tx1 = await sendTokenFlow({
    page,
    tokenname: 'flow',
    receiver: getReceiverCadenceAccount({ parallelIndex: test.info().parallelIndex }),
    amount: '0.00123456',
  });
  txList.push(tx1);

  //Send StFlow from Flow to Flow
  const tx2 = await sendTokenFlow({
    page,
    tokenname: 'stFlow',
    receiver: getReceiverCadenceAccount({ parallelIndex: test.info().parallelIndex }),
    amount: '0.00123456',
  });
  txList.push(tx2);

  //Send FLOW token from Flow to COA
  // This can take a while
  const tx3 = await sendTokenFlow({
    page,
    tokenname: 'flow',
    receiver: getReceiverEvmAccount({ parallelIndex: test.info().parallelIndex }),
    amount: '0.00123456',
  });
  txList.push(tx3);

  //Send USDC from Flow to Flow
  const tx4 = await sendTokenFlow({
    page,
    tokenname: 'usdc.e',
    receiver: getReceiverEvmAccount({ parallelIndex: test.info().parallelIndex }),
    ingoreFlowCharge: true,
    amount: '0.00123456',
  });
  txList.push(tx4);

  //Send FLOW token from Flow to EOA
  // This can take a while
  const tx5 = await sendTokenFlow({
    page,
    tokenname: 'flow',
    receiver: process.env.TEST_RECEIVER_METAMASK_EVM_ADDR!,
    amount: '0.00123456',
  });
  txList.push(tx5);

  //Send BETA from Flow to EOA
  const tx6 = await sendTokenFlow({
    page,
    tokenname: 'beta',
    receiver: process.env.TEST_RECEIVER_METAMASK_EVM_ADDR!,
    ingoreFlowCharge: true,
    amount: '0.00123456',
  });
  txList.push(tx6);

  //Check all sealed transactions
  // Check the amounts that were sent for each transaction
  // Go to the activity page
  await page.goto(`chrome-extension://${extensionId}/index.html#/dashboard?activity=1`);
  await page.waitForURL(/.*\/dashboard.*/);

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
