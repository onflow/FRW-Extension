import {
  importAccountBySeedPhrase,
  switchToEvmAddress,
  switchToMainAccount,
} from '../utils/helper';
import { test, expect } from '../utils/loader';

test('check main account address after switching', async ({ page, extensionId }) => {
  // Import profile  with multiple accounts
  await importAccountBySeedPhrase({
    page,
    extensionId,
    seedPhrase: process.env.TEST_SEED_PHRASE_SENDER,
    username: process.env.TEST_SENDER_NICKNAME!,
    accountAddr: process.env.TEST_SENDER_ADDR!,
  });
  //Check main account 1 Flow address
  const mainAccAddress = page
    .getByTestId('copy-address-button')
    .filter({ hasText: process.env.TEST_SENDER_ADDR! });

  await expect(mainAccAddress).toBeVisible({
    timeout: 60_000,
  });
  //Check main account 1 EVM address
  await switchToEvmAddress({
    page,
    address: process.env.TEST_SENDER_EVM_ADDR!,
  });
  const mainAccEvmAddress = page.getByTestId('copy-address-button').filter({
    hasText: process.env.TEST_SENDER_EVM_ADDR!.slice(process.env.TEST_SENDER_EVM_ADDR!.length - 8),
  });

  await expect(mainAccEvmAddress).toBeVisible({
    timeout: 60_000,
  });
  //Switch from account 1 to account 2
  await switchToMainAccount({ page, address: process.env.TEST_MULTI_ACCOUNT_TESTER_ADDR2! });
  const switchedAccAddress = page.getByTestId('copy-address-button').filter({
    hasText: process.env.TEST_MULTI_ACCOUNT_TESTER_ADDR2,
  });
  //Check main account 2 Flow address
  await expect(switchedAccAddress).toBeVisible({
    timeout: 60_000,
  });
  //Check main account 2 EVM address
  await switchToEvmAddress({
    page,
    address: process.env.TEST_MULTI_ACCOUNT_TESTER_EVM_ADDR2!,
  });
  const switchedAccEvmAddress = page.getByTestId('copy-address-button').filter({
    hasText: process.env.TEST_MULTI_ACCOUNT_TESTER_EVM_ADDR2!.slice(
      process.env.TEST_MULTI_ACCOUNT_TESTER_EVM_ADDR2!.length - 8
    ),
  });

  await expect(switchedAccEvmAddress).toBeVisible({
    timeout: 60_000,
  });
});
