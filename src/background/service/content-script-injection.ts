import rpcFlow from '@/background/controller/provider/rpcFlow';
import notificationService from '@/background/service/notification';
import { consoleLog } from '@/shared/utils/console-log';

export class ContentScriptInjectionService {
  async init() {
    consoleLog('Initializing content script injection service...');

    // Set up message listener
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      consoleLog('Background received message:', message);

      if (message.type === 'ethereum#request') {
        // Handle Ethereum requests
        this.handleEthereumRequest(message.payload, sendResponse);
        return true; // Keep the message channel open for async response
      }
    });

    consoleLog('Content script injection service initialized');
  }

  public async handleEthereumRequest(payload: any, sendResponse: (response: any) => void) {
    consoleLog('[ContentScriptInjection] Received request:', payload);

    try {
      // For connection requests, trigger the popup
      if (
        payload.method === 'eth_requestAccounts' ||
        payload.method === 'wallet_requestPermissions'
      ) {
        consoleLog('[ContentScriptInjection] Connection request detected:', payload.method);

        try {
          consoleLog('[ContentScriptInjection] Requesting approval...');
          const result = await notificationService.requestApproval(
            {
              params: {
                origin: payload.origin || 'unknown',
                name: payload.name || 'Unknown Dapp',
                icon: payload.icon || '',
              },
              approvalComponent: 'EthConnect',
            },
            { height: 599 }
          );
          consoleLog('[ContentScriptInjection] Approval result:', result);

          if (result) {
            consoleLog('[ContentScriptInjection] Forwarding to RPC flow after approval');
            const rpcResult = await rpcFlow({
              data: payload,
              session: {
                origin: payload.origin || 'unknown',
                name: payload.name || 'Unknown Dapp',
                icon: payload.icon || '',
              },
            });
            consoleLog('[ContentScriptInjection] RPC flow result:', rpcResult);

            const response = {
              id: payload.id,
              jsonrpc: '2.0',
              result: rpcResult,
            };
            consoleLog('[ContentScriptInjection] Sending response:', response);
            sendResponse(response);
            return;
          }
        } catch (error) {
          consoleLog('[ContentScriptInjection] Error in approval flow:', error);
          throw error;
        }
      }

      // For other requests, just forward to RPC flow
      consoleLog('[ContentScriptInjection] Forwarding to RPC flow:', payload.method);
      const result = await rpcFlow({
        data: payload,
        session: {
          origin: payload.origin || 'unknown',
          name: payload.name || 'Unknown Dapp',
          icon: payload.icon || '',
        },
      });
      consoleLog('[ContentScriptInjection] RPC flow result:', result);

      const response = {
        id: payload.id,
        jsonrpc: '2.0',
        result,
      };

      consoleLog('[ContentScriptInjection] Sending response:', response);
      sendResponse(response);
    } catch (error) {
      consoleLog('[ContentScriptInjection] Error handling request:', error);
      const errorResponse = {
        id: payload.id,
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message || 'Internal error',
        },
      };
      consoleLog('[ContentScriptInjection] Sending error response:', errorResponse);
      sendResponse(errorResponse);
    }
  }
}
