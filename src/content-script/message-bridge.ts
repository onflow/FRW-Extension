import { consoleLog } from '@/shared/utils/console-log';

// Generate unique IDs for the bridge and wallet
const BRIDGE_ID = crypto.randomUUID();
const WALLET_ID = crypto.randomUUID();

// Inject UUIDs into the page
function injectUUIDs() {
  const script = document.createElement('script');
  script.textContent = `
    window.__FRW_BRIDGE_ID__ = "${BRIDGE_ID}";
    window.__FRW_WALLET_ID__ = "${WALLET_ID}";
    console.log('[FRW] Bridge IDs injected:', {
      bridgeId: window.__FRW_BRIDGE_ID__,
      walletId: window.__FRW_WALLET_ID__
    });
  `;
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  // Verify injection
  if (!window.__FRW_BRIDGE_ID__ || !window.__FRW_WALLET_ID__) {
    throw new Error('Failed to inject bridge IDs');
  }
}

// Initialize the message bridge
function init() {
  consoleLog('Initializing message bridge...');
  consoleLog('Bridge ID:', BRIDGE_ID);
  consoleLog('Wallet ID:', WALLET_ID);

  // Inject UUIDs into the page
  injectUUIDs();

  // Listen for messages from the page
  window.addEventListener('message', (event) => {
    // Only accept messages from the same frame
    if (event.source !== window) return;

    const message = event.data;
    consoleLog('Message bridge received message from page:', message);

    // Check if this is a message for our bridge
    if (message.target === BRIDGE_ID) {
      consoleLog('Forwarding message to extension:', message);
      // Forward the message to the extension
      chrome.runtime
        .sendMessage(message)
        .then((response) => {
          consoleLog('Received response from extension:', response);
          // Forward the response back to the page
          window.postMessage(
            {
              target: WALLET_ID,
              source: BRIDGE_ID,
              payload: response,
            },
            '*'
          );
        })
        .catch((error) => {
          consoleLog('Error sending message to extension:', error);
          // Send error response back to the page
          window.postMessage(
            {
              target: WALLET_ID,
              source: BRIDGE_ID,
              error: {
                code: -32603,
                message: error.message || 'Internal error',
              },
            },
            '*'
          );
        });
    }
  });

  // Listen for messages from the extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    consoleLog('Message bridge received message from extension:', message);

    // Forward the message to the page
    window.postMessage(
      {
        target: WALLET_ID,
        source: BRIDGE_ID,
        payload: message,
      },
      '*'
    );

    // Keep the message channel open for async response
    return true;
  });

  // Notify that the bridge is ready
  window.postMessage(
    {
      type: 'FRW_BRIDGE_READY',
      bridgeId: BRIDGE_ID,
      walletId: WALLET_ID,
    },
    '*'
  );

  consoleLog('Message bridge initialized');
}

// Start the message bridge immediately
init();
