import { defineContentScript } from '#imports';
import { consoleLog } from '@onflow/flow-wallet-shared/utils/console-log';

export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'MAIN',
  runAt: 'document_start',

  main() {
    // Import and initialize the Ethereum provider
    import('../content-script/pageProvider/eth/index').then(() => {
      consoleLog('Ethereum provider initialized');
    });
  },
});
