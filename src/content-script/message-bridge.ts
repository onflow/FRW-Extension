import { consoleLog, consoleWarn, consoleError } from '@/shared/utils/console-log';
import { Message } from '@/shared/utils/messaging';

const { PortMessage } = Message;

/**
 * This content script acts as a bridge between the MAIN world pageProvider
 * and the extension background script. It runs in the ISOLATED world and
 * can communicate with both.
 */

class MessageBridge {
  private pm: InstanceType<typeof PortMessage> | null = null;
  private uuid: string;
  private connectionEstablished = false;

  constructor() {
    this.uuid = this.generateUUID();

    consoleLog('[Flow Wallet Bridge] Initializing bridge with UUID:', this.uuid);

    // Inject UUID immediately before anything else using custom events
    this.injectUUID();

    // Try to initialize message passing, but don't fail if it doesn't work
    this.initializeConnection();
    this.init();
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private initializeConnection() {
    try {
      this.pm = new PortMessage().connect();
      this.connectionEstablished = true;
      consoleLog('[Flow Wallet Bridge] Successfully connected to background script');
    } catch (error) {
      consoleWarn('[Flow Wallet Bridge] Failed to connect to background script:', error);
      this.connectionEstablished = false;
      this.pm = null;
    }
  }

  private init() {
    // Listen for messages from the MAIN world pageProvider
    window.addEventListener('message', this.handlePageMessage);

    // Listen for messages from the background script if connected
    if (this.pm && this.connectionEstablished) {
      try {
        this.pm.on('message', this.handleBackgroundMessage);
      } catch (error) {
        consoleWarn('[Flow Wallet Bridge] Failed to set up background message listener:', error);
      }
    }

    // Clean up on unload
    window.addEventListener('beforeunload', this.cleanup);
  }

  private injectUUID() {
    // Generate a stable wallet UUID based on the extension ID
    const extensionId = chrome.runtime.id;
    const walletUUID = `${extensionId}-flow-wallet`;

    consoleLog(
      '[Flow Wallet Bridge] Injecting UUIDs via custom events - Bridge:',
      this.uuid,
      'Wallet:',
      walletUUID
    );

    // Store UUIDs in a global object for late-loading scripts
    (window as any).__frwUUIDs = {
      bridgeUUID: this.uuid,
      walletUUID: walletUUID,
    };

    // Dispatch event for scripts that are already loaded
    document.dispatchEvent(
      new CustomEvent('frw:bridge-uuid', {
        detail: {
          bridgeUUID: this.uuid,
          walletUUID: walletUUID,
        },
      })
    );

    // Also dispatch on DOM ready for late-loading scripts
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        document.dispatchEvent(
          new CustomEvent('frw:bridge-uuid', {
            detail: {
              bridgeUUID: this.uuid,
              walletUUID: walletUUID,
            },
          })
        );
      });
    }

    consoleLog('[Flow Wallet Bridge] UUID injection complete via custom events and global storage');
  }

  private handlePageMessage = (event: MessageEvent) => {
    // Only handle messages from our pageProvider
    if (
      !event.data ||
      !event.data.source ||
      event.data.source !== 'frw-provider' ||
      event.data.uuid !== this.uuid
    ) {
      return;
    }

    const { type, data } = event.data;

    if (type === 'frw:request') {
      // Check if we have a working connection
      if (!this.pm || !this.connectionEstablished) {
        consoleWarn(
          '[Flow Wallet Bridge] No connection to background script, cannot forward request'
        );
        // Send error back to pageProvider
        window.postMessage(
          {
            type: 'frw:response',
            data: { ident: data.ident, err: { message: 'No connection to background script' } },
            uuid: this.uuid,
            source: 'frw-bridge',
          },
          '*'
        );
        return;
      }

      // Forward request to background script
      this.pm
        .request(data.data)
        .then((response) => {
          // Send response back to pageProvider
          window.postMessage(
            {
              type: 'frw:response',
              data: { ident: data.ident, res: response },
              uuid: this.uuid,
              source: 'frw-bridge',
            },
            '*'
          );
        })
        .catch((error) => {
          consoleWarn('[Flow Wallet Bridge] Request failed:', error);
          // Send error back to pageProvider
          window.postMessage(
            {
              type: 'frw:response',
              data: { ident: data.ident, err: error },
              uuid: this.uuid,
              source: 'frw-bridge',
            },
            '*'
          );
        });
    }
  };

  private handleBackgroundMessage = (data: any) => {
    // Forward messages from background to pageProvider
    window.postMessage(
      {
        type: 'frw:message',
        data,
        uuid: this.uuid,
        source: 'frw-bridge',
      },
      '*'
    );
  };

  private cleanup = () => {
    window.removeEventListener('message', this.handlePageMessage);
    window.removeEventListener('beforeunload', this.cleanup);
    if (this.pm) {
      try {
        this.pm.dispose();
      } catch (error) {
        consoleWarn('[Flow Wallet Bridge] Error during cleanup:', error);
      }
    }
  };
}

// Initialize the bridge
consoleLog('[Flow Wallet Bridge] Starting message bridge initialization');
try {
  new MessageBridge();
  consoleLog('[Flow Wallet Bridge] Message bridge initialized successfully');
} catch (error) {
  consoleError('[Flow Wallet Bridge] Failed to initialize message bridge:', error);
}
