import {
  test,
  loginToSenderAccount,
  getCurrentAddress,
  switchToEvm,
  waitForTransaction,
} from './utils/helper';

export const sendNftCoa = async ({ page, nftname, receiver, successtext }) => {
  // Wait for the EVM account to be loaded
  await getCurrentAddress(page);
  await page.getByRole('tab', { name: 'NFTs' }).click();
  await page.getByRole('button', { name: nftname }).click();
  await page.getByRole('link').nth(0).click();
  await page.getByRole('button', { name: 'Send' }).click();
  await page.getByPlaceholder('Search, Address(0x) or Flow').click();
  await page.getByPlaceholder('Search, Address(0x) or Flow').fill(receiver);
  await page.getByRole('button', { name: 'Send' }).click();
  // // Wait for the transaction to be completed
  await waitForTransaction({ page, successtext });
};
export const moveNftCoa = async ({ page, nftname, receiver, successtext }) => {
  // Wait for the EVM account to be loaded
  await getCurrentAddress(page);
  await page.getByRole('tab', { name: 'NFTs' }).click();
  await page.getByRole('button', { name: nftname }).click();
  await page.getByRole('link').nth(0).click();
  await page.getByRole('button', { name: 'Move' }).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: receiver }).click();
  await page.getByRole('button', { name: 'Move' }).click();
  // // Wait for the transaction to be completed
  await waitForTransaction({ page, successtext });
};
export const batchmoveNftCoa = async ({ page, nftname, receiver, successtext }) => {
  // Wait for the EVM account to be loaded
  await getCurrentAddress(page);
  await page
    .locator('div')
    .filter({ hasText: /^Move$/ })
    .getByRole('button')
    .click();
  await page.getByRole('button', { name: 'Move NFTs' }).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: receiver }).click();
  await page.getByRole('button').nth(1).click();
  await page.getByRole('button', { name: 'TopShot' }).click();
  await page.getByTestId('nft-selector').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Move' }).click();
  // Wait for the transaction to be completed
  await waitForTransaction({ page, successtext });
};
test.beforeEach(async ({ page, extensionId }) => {
  // Login to our sender account
  await loginToSenderAccount({ page, extensionId });
  // switch to EVM account
  await switchToEvm({ page, extensionId });
});
//Send NFT from COA to COA
test('send top shot COA to COA', async ({ page }) => {
  await sendNftCoa({
    page,
    nftname: 'NBA Top Shot',
    receiver: process.env.TEST_RECEIVER_EVM_ADDR!,
    successtext: 'success',
  });
});
//Send NFT from COA to FLOW
test('send top shot COA to FLOW', async ({ page }) => {
  await sendNftCoa({
    page,
    nftname: 'NBA Top Shot',
    receiver: process.env.TEST_RECEIVER_ADDR!,
    successtext: 'success',
  });
});
//Send NFT from COA to EOA
test('send top shot COA to EOA', async ({ page }) => {
  await sendNftCoa({
    page,
    nftname: 'NBA Top Shot',
    receiver: process.env.TEST_RECEIVER_METAMASK_EVM_ADDR!,
    successtext: 'success',
  });
});
//Move NFT from COA to FLOW
test('move top shot COA to FLOW', async ({ page }) => {
  await moveNftCoa({
    page,
    nftname: 'NBA Top Shot',
    receiver: process.env.TEST_SENDER_ADDR!,
    successtext: 'success',
  });
});
//Batch move NFT from COA to FLOW
test('batch Move top shot COA to FLOW', async ({ page }) => {
  await batchmoveNftCoa({
    page,
    nftname: 'TopShot',
    receiver: process.env.TEST_SENDER_ADDR!,
    successtext: 'success',
  });
});
