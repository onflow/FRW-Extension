import { defineContentScript } from '#imports';
import { consoleLog } from '@onflow/flow-wallet-shared/utils/console-log';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  allFrames: true,

  main() {
    // Import and initialize the original content script
    import('../../content-script/index').then(() => {
      consoleLog('Content script initialized');
    });
  },
});
