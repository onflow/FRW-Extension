import { importReceiverAccount, importSenderAccount, lockExtension } from './helper';
import { test as setup } from './loader';

setup('Import sender and receiver accounts', async ({ page, extensionId }) => {
  // Lock the extension and import sender and receiver accounts
  await importSenderAccount({ page, extensionId });
  await importReceiverAccount({ page, extensionId });
});
