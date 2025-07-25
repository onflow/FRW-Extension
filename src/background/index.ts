import 'reflect-metadata';

import {
  authenticationService,
  addressBookService,
  coinListService,
  evmNftService,
  googleSafeHostService,
  keyringService,
  logListener,
  mixpanelTrack,
  newsService,
  nftService,
  openapiService,
  permissionService,
  preferenceService,
  remoteConfigService,
  sessionService,
  tokenListService,
  transactionActivityService,
  userInfoService,
  userWalletService,
  versionService,
  googleDriveService,
} from '@onflow/frw-core';
import { ethErrors } from 'eth-rpc-errors';

import { initializeChromeLogging } from '@onflow/frw-extension-shared/chrome-logger';
import eventBus from '@onflow/frw-extension-shared/message/eventBus';
import { Message } from '@onflow/frw-extension-shared/messaging';
import storage from '@onflow/frw-extension-shared/storage';
import { EVENTS } from '@onflow/frw-shared/constant';
import { type WalletAddress } from '@onflow/frw-shared/types';
import { isValidFlowAddress, consoleError, consoleLog } from '@onflow/frw-shared/utils';

import providerController from '@/background/controller/provider';
import { preAuthzServiceDefinition } from '@/background/controller/serviceDefinition';
import walletController, { type WalletController } from '@/background/controller/wallet';

import notificationService from './controller/notification';
import { setEnvironmentBadge } from './utils/setEnvironmentBadge';
import packageJson from '../../package.json';
import { getFirbaseConfig } from './utils/firebaseConfig';

const { PortMessage } = Message;

const chromeWindow = await chrome.windows.getCurrent();

let appStoreLoaded = false;

// API URLs
const API_GO_SERVER_URL = process.env.API_GO_SERVER_URL;
const API_BASE_URL = process.env.API_BASE_URL;
const FB_FUNCTIONS_URL = process.env.FB_FUNCTIONS;
const SCRIPTS_PUBLIC_KEY = process.env.SCRIPTS_PUBLIC_KEY;

async function restoreAppState() {
  // eslint-disable-next-line no-console
  console.log('restoreAppState');
  // Init authentication first
  await authenticationService.init(getFirbaseConfig());

  // Now we can init openapi
  if (!API_GO_SERVER_URL || !API_BASE_URL || !FB_FUNCTIONS_URL || !SCRIPTS_PUBLIC_KEY) {
    throw new Error(
      'API_GO_SERVER_URL, API_BASE_URL, FB_FUNCTIONS_URL, SCRIPTS_PUBLIC_KEY must be set'
    );
  }
  // eslint-disable-next-line no-console
  console.log('restoreAppState - init openapi');
  // Init openapi second. This starts fcl
  await openapiService.init(
    API_GO_SERVER_URL, // registrationURL
    API_BASE_URL, // webNextURL
    FB_FUNCTIONS_URL, // functionsURL
    SCRIPTS_PUBLIC_KEY, // scriptsPublicKey
    process.env.NODE_ENV === 'development' // isDev
  );
  // eslint-disable-next-line no-console
  console.log('restoreAppState - init keyring');
  // Load keyring store
  await keyringService.loadKeyringStore();

  // clear premnemonic in storage
  storage.remove('premnemonic');
  storage.remove('tempPassword');
  // enable free gas fee
  storage.get('lilicoPayer').then((value) => {
    if (value === null || value === undefined) {
      storage.set('lilicoPayer', true);
    }
  });

  // Init keyring and openapi first since this two service will not be migrated
  // await migrateData();

  await permissionService.init();
  await preferenceService.init();
  await coinListService.init();
  await userInfoService.init();
  await addressBookService.init();

  await userWalletService.init();
  await transactionActivityService.init();
  await nftService.init();
  await evmNftService.init();
  await googleDriveService.init({
    baseURL: 'https://www.googleapis.com/',
    backupName: process.env.GD_BACKUP_NAME!,
    appDataFolder: process.env.GD_FOLDER!,
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    AES_KEY: process.env.GD_AES_KEY!,
    IV: process.env.GD_IV!,
  });
  await googleSafeHostService.init({
    baseURL: 'https://safebrowsing.googleapis.com/',
    key: process.env.GOOGLE_API!,
  });

  if (process.env.MIXPANEL_TOKEN) {
    await mixpanelTrack.init(process.env.MIXPANEL_TOKEN);

    // Initialize Chrome logging - has to be done after mixpanel is initialized
    initializeChromeLogging();
  }
  await logListener.init();
  await tokenListService.init();
  await remoteConfigService.init();
  await newsService.init();

  await versionService.init(packageJson.version);

  // rpcCache.start();

  appStoreLoaded = true;

  // Set the loaded flag to true so that the UI knows the app is ready
  await walletController.setLoaded(true);
}

restoreAppState();

chrome.runtime.onInstalled.addListener(({ reason }: chrome.runtime.InstalledDetails) => {
  // chrome.runtime.OnInstalledReason.Install
  if (reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('index.html'),
    });
  } else {
    walletController.clearAllStorage();
  }
});

function forceReconnect(port) {
  deleteTimer(port);
  port.disconnect();
}

function deleteTimer(port) {
  if (port._timer) {
    clearTimeout(port._timer);
    delete port._timer;
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request === 'ping') {
    sendResponse('pong');
    return;
  }
  sendResponse();
});

// for page provider
chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
  // openapiService.getConfig();

  // @ts-ignore
  port._timer = setTimeout(forceReconnect, 250e3, port);
  port.onDisconnect.addListener(deleteTimer);

  if (port.name === 'popup' || port.name === 'notification' || port.name === 'tab') {
    const pm = new PortMessage(port);
    pm.listen((data) => {
      if (data?.type) {
        switch (data.type) {
          case 'broadcast':
            eventBus.emit(data.method, data.params);
            break;
          case 'openapi':
            if (walletController.openapi[data.method]) {
              return walletController.openapi[data.method].apply(null, data.params);
            }
            break;
          case 'controller':
          default:
            if (data.method) {
              return walletController[data.method].apply(null, data.params);
            }
        }
      }
    });

    const boardcastCallback = (data: any) => {
      pm.request({
        type: 'broadcast',
        method: data.method,
        params: data.params,
      });
    };

    if (port.name === 'popup') {
      preferenceService.setPopupOpen(true);

      port.onDisconnect.addListener(() => {
        preferenceService.setPopupOpen(false);
      });
    }

    eventBus.addEventListener(EVENTS.broadcastToUI, boardcastCallback);
    port.onDisconnect.addListener(() => {
      eventBus.removeEventListener(EVENTS.broadcastToUI, boardcastCallback);
    });

    return;
  }

  if (!port.sender?.tab) {
    return;
  }

  const pm = new PortMessage(port);

  pm.listen(async (data) => {
    // if (!appStoreLoaded) {
    //   throw ethErrors.provider.disconnected();
    // }

    const sessionId = port.sender?.tab?.id;
    const session = sessionService.getOrCreateSession(sessionId);

    const req = { data, session };
    // for background push to respective page
    req.session.pushMessage = (event, data) => {
      pm.send('message', { event, data });
    };

    return providerController(req);
  });
});

declare global {
  interface Window {
    wallet: WalletController;
  }
}

// for popup operate
chromeWindow['wallet'] = new Proxy(walletController, {
  get(target, propKey, receiver) {
    if (!appStoreLoaded) {
      throw ethErrors.provider.disconnected();
    }
    return Reflect.get(target, propKey, receiver);
  },
});

const findPath = (service) => {
  switch (service.type) {
    case 'authn':
      return 'Connect';
    case 'authz':
      return 'Confirmation';
    case 'user-signature':
      return 'SignMessage';
    default:
      return 'Connect';
  }
};

const handlePreAuthz = async (id) => {
  // setApproval(true);
  // const wallet = await
  const payer = await walletController.getPayerAddressAndKeyId();
  const address = await userWalletService.getCurrentAddress();
  const network = await userWalletService.getNetwork();

  const keyIndex = await userWalletService.getKeyIndex();
  const services = preAuthzServiceDefinition(
    address,
    keyIndex,
    payer.address,
    payer.keyId,
    network
  );

  if (id) {
    chrome.tabs.sendMessage(id, { status: 'APPROVED', data: services });
    // chrome.tabs.sendMessage(id, services)

    // if (chrome.tabs) {
    //   if (windowId) {
    //     chrome.windows.update(windowId, { focused: true })
    //   }
    //   // await chrome.tabs.highlight({tabs: tabId})
    //   await chrome.tabs.update(id, { active: true });
    // }
    // resolveApproval();
  }
};

// Function called when a new message is received
const extMessageHandler = (msg, sender, sendResponse) => {
  // Messages from FCL, posted to window and proxied from content.js
  const { service } = msg;

  if (msg.type === 'FLOW::TX') {
    // DO NOT LISTEN
    walletController.listenTransaction(msg.txId, false);
    // fcl.tx(msg.txId).subscribe(txStatus => {})
  }

  if (msg.type === 'FCW:CS:LOADED') {
    chrome.tabs
      .query({
        active: true,
        lastFocusedWindow: true,
      })
      .then((tabs) => {
        const tabId = tabs[0].id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, {
            type: 'FCW:NETWORK',
            network: userWalletService.getNetwork(),
          });
        }
      });
  }
  // Launches extension popup window
  if (
    service?.endpoint &&
    (service?.endpoint === 'chrome-extension://hpclkefagolihohboafpheddmmgdffjm/popup.html' ||
      service?.endpoint ===
        'chrome-extension://hpclkefagolihohboafpheddmmgdffjm/popup.html?network=testnet')
  ) {
    chrome.tabs
      .query({
        active: true,
        lastFocusedWindow: true,
      })
      .then(async (tabs) => {
        const tabId = tabs[0].id;

        // Check if current address is flow address
        try {
          const currentAddress = await userWalletService.getCurrentAddress();
          if (!currentAddress || !isValidFlowAddress(currentAddress)) {
            const parentAddress = await userWalletService.getParentAddress();
            if (!parentAddress) {
              throw new Error('Parent address not found');
            }
            await userWalletService.setCurrentAccount(
              parentAddress,
              parentAddress as WalletAddress
            );
          }
        } catch (error) {
          consoleError('Error validating or setting current address:', error);
        }
        if (service.type === 'pre-authz') {
          handlePreAuthz(tabId);
        } else {
          notificationService
            .requestApproval(
              {
                params: { tabId, type: service.type },
                approvalComponent: findPath(service),
              },
              { height: service.type === 'authz' ? 700 : 620 }
            )
            .then((res) => {
              if (res === 'unlocked') {
                notificationService.requestApproval(
                  {
                    params: { tabId, type: service.type },
                    approvalComponent: findPath(service),
                  },
                  { height: service.type === 'authz' ? 700 : 620 }
                );
              }
            });
        }
      });
  }
  sendResponse({ status: 'ok' });
};

/**
 * Fired when a message is sent from either an extension process or a content script.
 */
chrome.runtime.onMessage.addListener(extMessageHandler);

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'foo') return;
  port.onMessage.addListener(onMessage);
  port.onDisconnect.addListener(deleteTimer);
  port['_timer'] = setTimeout(forceReconnect, 250e3, port);
});

function onMessage(msg, port) {
  consoleLog('received', msg, 'from', port.sender);
}

// Call it when extension starts
setEnvironmentBadge();

function saveTimestamp() {
  const timestamp = new Date().toISOString();

  chrome.storage.session.set({ timestamp });
}

const SAVE_TIMESTAMP_INTERVAL_MS = 2 * 1000;

saveTimestamp();
setInterval(saveTimestamp, SAVE_TIMESTAMP_INTERVAL_MS);
