import { test, loginToSenderAccount, getCurrentAddress, waitForTransaction } from './utils/helper';
export const sendNftFlow = async ({ page, nftname, receiver, ingoreFlowCharge = false }) => {
  await getCurrentAddress(page);
  await page.getByRole('tab', { name: 'NFTs' }).click();
  await page.getByRole('button', { name: nftname }).click();
  await page.getByRole('link').nth(0).click();
  await page.getByRole('button', { name: 'Send' }).click();
  await page.getByPlaceholder('Search, Address(0x) or Flow').click();
  await page.getByPlaceholder('Search, Address(0x) or Flow').fill(receiver);
  await page.getByRole('button', { name: 'Send' }).click();
  // // Wait for the transaction to be completed
  await waitForTransaction({ page, successtext: 'sealed', ingoreFlowCharge });
};
export const moveNftFlow = async ({ page, nftname, receiver, ingoreFlowCharge = false }) => {
  await getCurrentAddress(page);
  await page.getByRole('tab', { name: 'NFTs' }).click();
  await page.getByRole('button', { name: nftname }).click();
  await page.getByRole('link').nth(0).click();
  await page.getByRole('button', { name: 'Move' }).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: receiver.substring(receiver.length - 8) }).click();
  await page.getByRole('button', { name: 'Move' }).click();
  // // Wait for the transaction to be completed
  await waitForTransaction({ page, successtext: 'sealed', ingoreFlowCharge });
};
export const batchmoveNftFlow = async ({ page, nftname, receiver, ingoreFlowCharge = false }) => {
  await getCurrentAddress(page);
  await page
    .locator('div')
    .filter({ hasText: /^Move$/ })
    .getByRole('button')
    .click();
  await page.getByRole('button', { name: 'Move NFTs' }).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: receiver.substring(receiver.length - 8) }).click();
  await page.getByRole('button').nth(1).click();
  await page.getByRole('button', { name: nftname }).click();
  await page.getByTestId('nft-selector').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Move' }).click();
  // Wait for the transaction to be completed
  await waitForTransaction({ page, successtext: 'sealed', ingoreFlowCharge });
};

test.beforeEach(async ({ page, extensionId }) => {
  // Login to our sender account
  await loginToSenderAccount({ page, extensionId });
});
//Send NFT from FLOW to COA
test('send top shot FLOW to COA', async ({ page }) => {
  await sendNftFlow({
    page,
    nftname: 'NBA Top Shot',
    receiver: process.env.TEST_RECEIVER_EVM_ADDR!,
    ingoreFlowCharge: true,
  });
});
//Send NFT from FLOW to FLOW
test('send top shot FLOW to FLOW', async ({ page }) => {
  await sendNftFlow({
    page,
    nftname: 'NBA Top Shot',
    receiver: process.env.TEST_RECEIVER_ADDR!,
  });
});
//Send NFT from FLOW to EOA
test('send top shot FLOW to EOA', async ({ page }) => {
  await sendNftFlow({
    page,
    nftname: 'NBA Top Shot',
    receiver: process.env.TEST_RECEIVER_METAMASK_EVM_ADDR!,
    ingoreFlowCharge: true,
  });
});
//Move NFT from FLOW to COA
test('move top shot FLOW to COA', async ({ page }) => {
  await moveNftFlow({
    page,
    nftname: 'NBA Top Shot',
    receiver: process.env.TEST_SENDER_EVM_ADDR!,
    ingoreFlowCharge: true,
  });
});
//Batch move NFT from FLOW to COA
test('batch Move top shot FLOW to COA', async ({ page }) => {
  await batchmoveNftFlow({
    page,
    nftname: 'TopShot',
    receiver: process.env.TEST_SENDER_EVM_ADDR!,
    ingoreFlowCharge: true,
  });
});
