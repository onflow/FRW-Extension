import { consoleLog } from '@/shared/utils/console-log';

import { EthereumProvider } from './eth';

// Wait for the bridge to be ready
function waitForBridge(): Promise<{ bridgeId: string; walletId: string }> {
  return new Promise((resolve) => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data.type === 'FRW_BRIDGE_READY') {
        consoleLog('Received bridge ready message:', event.data);
        window.removeEventListener('message', messageHandler);
        resolve({
          bridgeId: event.data.bridgeId,
          walletId: event.data.walletId,
        });
      }
    };
    window.addEventListener('message', messageHandler);
  });
}

// Initialize the page provider
async function init() {
  consoleLog('Initializing page provider...');

  try {
    // Wait for the bridge to be ready
    const { bridgeId, walletId } = await waitForBridge();
    consoleLog('Bridge is ready:', { bridgeId, walletId });

    // Create and inject the Ethereum provider
    const provider = new EthereumProvider(bridgeId, walletId);
    Object.defineProperty(window, 'ethereum', {
      value: provider,
      writable: false,
      configurable: false,
    });

    // Set up message listener
    window.addEventListener('message', async (event) => {
      // Only accept messages from the same frame
      if (event.source !== window) return;

      const message = event.data;
      consoleLog('Page provider received message:', message);

      // Check if this is a message for our wallet
      if (message.target === walletId) {
        consoleLog('Processing message for wallet:', message);

        // Handle the message based on its type
        if (message.payload?.type === 'ethereum#request') {
          consoleLog('Forwarding Ethereum request to extension:', message.payload);
          // Forward the request to the extension
          window.postMessage(
            {
              target: bridgeId,
              source: walletId,
              payload: message.payload,
            },
            '*'
          );
        }
      }
    });

    // Notify that the provider is ready
    window.dispatchEvent(new Event('ethereum#initialized'));
    consoleLog('Page provider initialized');
  } catch (error) {
    consoleLog('Error initializing page provider:', error);
  }
}

// Start the page provider
init();
