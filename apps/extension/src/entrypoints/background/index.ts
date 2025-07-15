import { consoleLog } from '@onflow/flow-wallet-shared/utils/console-log';

import { defineBackground } from '#imports';

export default defineBackground({
  type: 'module',
  persistent: false,

  main() {
    // Import the original background script
    import('../../background/index').then(() => {
      consoleLog('Background script initialized');
    });
  },
});
