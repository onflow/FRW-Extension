import { consoleError, consoleLog } from '@/shared/utils/console-log';

/*
 * This content script is injected programmatically because
 * MAIN world injection does not work properly via manifest
 * https://bugs.chromium.org/p/chromium/issues/detail?id=634381
 */

class ContentScriptInjectionService {
  private registeredScripts = new Set<string>();

  init = async () => {
    // Register message bridge first and wait a bit to ensure it's loaded
    await this.registerMessageBridge();

    // Small delay to ensure message bridge is loaded and has injected UUIDs
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Then register the scripts that run in MAIN world
    await this.registerPageProvider();
    await this.registerFlowScript();
  };

  private registerMessageBridge = async () => {
    try {
      await chrome.scripting.registerContentScripts([
        {
          id: 'messageBridge',
          matches: ['file://*/*', 'http://*/*', 'https://*/*'],
          js: ['message-bridge.js'],
          runAt: 'document_start',
          world: 'ISOLATED',
          allFrames: true,
        },
      ]);
      this.registeredScripts.add('messageBridge');
      consoleLog('Successfully registered message bridge content script');
    } catch (err) {
      consoleError(`Failed to register message bridge content script: ${err}`);
    }
  };

  private registerPageProvider = async () => {
    try {
      await chrome.scripting.registerContentScripts([
        {
          id: 'pageProvider',
          matches: ['file://*/*', 'http://*/*', 'https://*/*'],
          js: ['pageProvider.js'],
          runAt: 'document_start',
          world: 'MAIN',
          allFrames: true,
        },
      ]);
      this.registeredScripts.add('pageProvider');
      consoleLog('Successfully registered pageProvider content script');
    } catch (err) {
      consoleError(`Failed to register pageProvider content script: ${err}`);
    }
  };

  private registerFlowScript = async () => {
    try {
      await chrome.scripting.registerContentScripts([
        {
          id: 'flowScript',
          matches: ['file://*/*', 'http://*/*', 'https://*/*'],
          js: ['script.js'],
          runAt: 'document_start',
          world: 'MAIN',
          allFrames: true,
        },
      ]);
      this.registeredScripts.add('flowScript');
      consoleLog('Successfully registered flow script content script');
    } catch (err) {
      consoleError(`Failed to register flow script content script: ${err}`);
    }
  };

  // Method to unregister scripts if needed
  unregisterAllScripts = async () => {
    try {
      const registeredIds = Array.from(this.registeredScripts);
      if (registeredIds.length > 0) {
        await chrome.scripting.unregisterContentScripts({
          ids: registeredIds,
        });
        this.registeredScripts.clear();
        consoleLog('Successfully unregistered all content scripts');
      }
    } catch (err) {
      consoleError(`Failed to unregister content scripts: ${err}`);
    }
  };

  // Method to check if scripts are registered
  getRegisteredScripts = () => {
    return Array.from(this.registeredScripts);
  };
}

export default new ContentScriptInjectionService();
