import {
  getCurrentAddress,
  waitForTransaction,
  loginToSenderOrReceiver,
  getReceiverEvmAccount,
  getReceiverCadenceAccount,
  checkSentAmount,
  switchToEvmAddress,
  getSenderEvmAccount,
} from '../utils/helper';
import { test } from '../utils/loader';

export const sendTokenCOA = async ({
  page,
  tokenname,
  receiver,
  successtext,
  amount = '0.000112134354657',
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
  const txId = await waitForTransaction({ page, successtext });
  return { txId, tokenname, amount };
};

export const moveTokenCOA = async ({
  page,
  tokenname,
  successtext,
  amount = '0.000112134354657',
}) => {
  // Wait for the EVM account to be loaded
  await getCurrentAddress(page);
  await page.getByRole('tab', { name: 'coins' }).click();
  await page.getByTestId(`token-${tokenname.toLowerCase()}`).click();
  await page.getByRole('button', { name: 'Move' }).click();
  await page.getByPlaceholder('Amount').click();
  await page.getByPlaceholder('Amount').fill(amount);
  await page.getByRole('button', { name: 'Move' }).click();
  // Wait for the transaction to be completed
  const txId = await waitForTransaction({ page, successtext });
  return { txId, tokenname, amount };
};

export const moveTokenCoaHomepage = async ({ page, tokenname, amount = '0.000000012345' }) => {
  await getCurrentAddress(page);
  await page.getByRole('button', { name: 'Move' }).click();
  await page.getByRole('button', { name: 'Move Tokens' }).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: tokenname, exact: true }).getByRole('img').click();
  await page.getByPlaceholder('Amount').click();
  await page.getByPlaceholder('Amount').fill(amount);
  await page.getByRole('button', { name: 'Move' }).click();
  // Wait for the transaction to be completed
  const txId = await waitForTransaction({ page, successtext: /success|Executed/ });
  return { txId, tokenname, amount };
};

test.beforeEach(async ({ page, extensionId }) => {
  // Login to our sender account
  await loginToSenderOrReceiver({ page, extensionId, parallelIndex: test.info().parallelIndex });
  // switch to EVM account
  await switchToEvmAddress({
    page,
    address: getSenderEvmAccount({ parallelIndex: test.info().parallelIndex }),
  });
});

test('EVM transactions', async ({ page, extensionId }) => {
  test.setTimeout(120_000);
  const txList: { txId: string; tokenname: string; amount: string }[] = [];

  //Send Fts from COA to COA
  // Send FLOW token from COA to COA
  const tx1 = await sendTokenCOA({
    page,
    tokenname: 'flow',
    receiver: getReceiverEvmAccount({ parallelIndex: test.info().parallelIndex }),
    successtext: /success|Executed/,
    amount: '0.12345678', // 8 decimal places
  });
  txList.push(tx1);

  // Send stFLOW token from COA to COA
  const tx2 = await sendTokenCOA({
    page,
    tokenname: 'stFlow',
    receiver: getReceiverEvmAccount({ parallelIndex: test.info().parallelIndex }),
    successtext: /success|Executed/,
    amount: '0.00000112134354678',
  });
  txList.push(tx2);

  //Send FTS from COA to FLOW
  // This can take a while
  // Send FLOW token from COA to FLOW
  const tx3 = await sendTokenCOA({
    page,
    tokenname: 'flow',
    receiver: getReceiverCadenceAccount({ parallelIndex: test.info().parallelIndex }),
    successtext: /success|Executed/,
    amount: '0.00123456', // 8 decimal places
  });
  txList.push(tx3);

  // Send USDC token from COA to FLOW
  const tx4 = await sendTokenCOA({
    page,
    tokenname: 'usdc.e',
    receiver: getReceiverCadenceAccount({ parallelIndex: test.info().parallelIndex }),
    successtext: /success|Executed/,
    amount: '0.002468', // 6 decimal places
  });
  txList.push(tx4);

  //Send FTs from COA to EOA (metamask)
  // Send FLOW token from COA to EOA
  const tx5 = await sendTokenCOA({
    page,
    tokenname: 'flow',
    receiver: process.env.TEST_RECEIVER_METAMASK_EVM_ADDR!,
    successtext: /success|Executed/,
    amount: '0.00123456', // 8 decimal places
  });
  txList.push(tx5);

  // Send BETA token from COA to EOA
  const tx6 = await sendTokenCOA({
    page,
    tokenname: 'beta',
    receiver: process.env.TEST_RECEIVER_METAMASK_EVM_ADDR!,
    successtext: /success|Executed/,
    amount: '0.001234567890123456', // 8 decimal places
  });
  txList.push(tx6);

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
        sealedText: 'success',
      });
    })
  );

  /* //Move FTs from COA to FLOW
test('move Flow COA to FLOW', async ({ page }) => {
  // Move FLOW token from COA to FLOW
  await moveTokenCOA({
    page,
    tokenname: /^FLOW \$/i,
    successtext: 'success',
  });
});

test('move USDC token COA to FLOW', async ({ page }) => {
  // Move USDC token from COA to EOA
  await moveTokenCOA({
    page,
    tokenname: 'Bridged USDC (Celer) $',
    successtext: 'success',
  });
});

//Move from main page
test('move Flow COA to FLOW homepage', async ({ page }) => {
  // Move FLOW token from FLOW to COA
  await moveTokenCoaHomepage({
    page,
    tokenname: 'Flow',
  });
});

test('move USDC token COA to FLOW homepage', async ({ page }) => {
  // Move USDC token from FLOW to COA
  await moveTokenCoaHomepage({
    page,
    tokenname: 'Bridged USDC (Celer)',
    amount: '0.000123',
  });
}); */
  //Send NFT from COA to COA
  //Send NFT from COA to FLOW
  //Send NFT from COA to EOA
  //Move NFT from COA to FLOW
});
