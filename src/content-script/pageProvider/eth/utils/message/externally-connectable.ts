import { consoleError, consoleWarn } from '@/shared/utils/console-log';

import Message from './index';

/**
 * This uses the externally_connectable pattern where the webpage
 * can directly send messages to the extension if the manifest allows it.
 * This eliminates the need for a content script bridge.
 */
export default class ExternallyConnectableMessage extends Message {
  private port: chrome.runtime.Port | null = null;
  private extensionId: string;

  constructor(extensionId: string) {
    super();
    this.extensionId = extensionId;
  }

  connect = () => {
    // Check if we can use chrome.runtime (might not be available in all contexts)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.connect) {
      try {
        this.port = chrome.runtime.connect(this.extensionId, { name: 'pageProvider' });

        this.port.onMessage.addListener((message) => {
          const { type, data } = message;
          if (type === 'message') {
            this.emit('message', data);
          } else if (type === 'response') {
            this.onResponse(data);
          }
        });

        this.port.onDisconnect.addListener(() => {
          consoleWarn('Flow Wallet: Port disconnected, attempting reconnect...');
          setTimeout(() => this.connect(), 1000);
        });
      } catch (error) {
        consoleError('Flow Wallet: Failed to connect to extension', error);
        // Fall back to postMessage if direct connection fails
        this.connectViaPostMessage();
      }
    } else {
      // Use postMessage as fallback
      this.connectViaPostMessage();
    }

    return this;
  };

  private connectViaPostMessage = () => {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (!event.data || event.data.source !== 'frw-content-script') return;

      const { type, data } = event.data;
      if (type === 'frw:message') {
        this.emit('message', data);
      } else if (type === 'frw:response') {
        this.onResponse(data);
      }
    });
  };

  send = (type: string, data: any) => {
    if (this.port) {
      this.port.postMessage({ type, data });
    } else {
      // Fallback to postMessage
      window.postMessage(
        {
          type: `frw:${type}`,
          data,
          source: 'frw-provider',
          target: 'frw-content-script',
        },
        '*'
      );
    }
  };

  dispose = () => {
    this._dispose();
    if (this.port) {
      this.port.disconnect();
      this.port = null;
    }
  };
}
