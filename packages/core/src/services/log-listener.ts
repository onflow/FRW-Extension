import { stripSensitive } from '@/shared/utils/strip-sensitive';

import { mixpanelTrack } from './mixpanel';

class LogListener {
  constructor() {}

  init() {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      // Only track errors
      if (message.type === 'console_error') {
        mixpanelTrack.track('error', {
          code: message.code,
          category: 'console',
          message: stripSensitive(message.message),
          extra: stripSensitive(message.stack),
          value: message.code,
        });
      }
    });
  }
}

export default new LogListener();
