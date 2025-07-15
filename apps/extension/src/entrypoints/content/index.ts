import { consoleLog } from '@onflow/flow-wallet-shared/utils/console-log';

import { defineContentScript } from '#imports';

export default defineContentScript({
  matches: ['file://*/*', 'http://*/*', 'https://*/*'],
  runAt: 'document_start',
  allFrames: false,

  main() {
    // Import and initialize the original content script
    import('../../content-script/index').then(() => {
      consoleLog('Content script initialized');
    });
  },
});
