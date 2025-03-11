import 'reflect-metadata';
import { ethErrors } from 'eth-rpc-errors';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  indexedDBLocalPersistence,
  setPersistence,
  onAuthStateChanged,
} from 'firebase/auth/web-extension';

import eventBus from '@/eventBus';
import { Message } from '@/shared/utils/messaging';
import type { WalletController } from 'background/controller/wallet';
import { EVENTS } from 'consts';

import { providerController, walletController } from './controller';
import { preAuthzServiceDefinition } from './controller/serviceDefinition';
import {
  permissionService,
  preferenceService,
  sessionService,
  keyringService,
  openapiService,
  pageStateCacheService,
  coinListService,
  userInfoService,
  addressBookService,
  userWalletService,
  notificationService,
  transactionService,
  nftService,
  evmNftService,
  googleSafeHostService,
  passwordService,
  mixpanelTrack,
} from './service';
import { getFirbaseConfig } from './utils/firebaseConfig';
import { setEnvironmentBadge } from './utils/setEnvironmentBadge';
import { storage } from './webapi';
const { PortMessage } = Message;

const chromeWindow = await chrome.windows.getCurrent();

let appStoreLoaded = false;

async function initAppMeta() {
  // Initialize Firebase
  // console.log('<- initAppMeta ->')
  // const document = chromeWindow.document;
  // const head = document.querySelector('head');
  // const icon = document.createElement('link');
  // icon.href = 'https://raw.githubusercontent.com/Outblock/Lilico-Web/main/asset/icon-128.png';
  // icon.rel = 'icon';
  // head?.appendChild(icon);
  // const name = document.createElement('meta');
  // name.name = 'name';
  // name.content = 'Lilico';
  // head?.appendChild(name);
  // const description = document.createElement('meta');
  // description.name = 'description';
  // description.content = i18n.t('appDescription');
  // head?.appendChild(description);

  firebaseSetup();

  // note fcl setup is async
  await userWalletService.setupFcl();
}

async function firebaseSetup() {
  const env: string = process.env.NODE_ENV!;
  const firebaseConfig = getFirbaseConfig();
  console.log(process.env.NODE_ENV);
  // const firebaseProductionConfig = prodConig;

  const app = initializeApp(firebaseConfig, env);

  const auth = getAuth(app);
  setPersistence(auth, indexedDBLocalPersistence);
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User
      // note fcl setup is async
      userWalletService.setupFcl();
    } else {
      // User is signed out
      signInAnonymously(auth);
    }
  });
}

async function restoreAppState() {
  const keyringState = await storage.get('keyringState');
  keyringService.loadStore(keyringState);
  keyringService.store.subscribe((value) => storage.set('keyringState', value));
  await openapiService.init();

  // clear premnemonic in storage
  storage.remove('premnemonic');
  // enable free gas fee
  storage.get('freeGas').then((value) => {
    if (value === null || value === undefined) {
      storage.set('freeGas', true);
    }
  });
  storage.get('lilicoPayer').then((value) => {
    if (value === null || value === undefined) {
      storage.set('lilicoPayer', true);
    }
  });

  // Init keyring and openapi first since this two service will not be migrated
  // await migrateData();

  await permissionService.init();
  await preferenceService.init();
  await pageStateCacheService.init();
  await coinListService.init();
  await userInfoService.init();
  await addressBookService.init();
  await userWalletService.init();
  await transactionService.init();
  await nftService.init();
  await evmNftService.init();
  await googleSafeHostService.init();
  await passwordService.init();
  await mixpanelTrack.init();
  // rpcCache.start();

  appStoreLoaded = true;

  await initAppMeta();

  // Set the loaded flag to true so that the UI knows the app is ready
  walletController.setLoaded(true);
  console.log('restoreAppState chrome.runtime.sendMessage->');
  chrome.runtime.sendMessage({ type: 'walletInitialized' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log(
        'chrome.runtime.sendMessage - Message delivery failed:',
        chrome.runtime.lastError.message
      );
    } else {
      console.log('chrome.runtime.sendMessage - Message delivered successfully:', response);
    }
  });
  console.log('restoreAppState chrome.tabs.query->');
  chrome.tabs
    .query({
      active: true,
      lastFocusedWindow: true,
    })
    .then((tabs) => {
      tabs.forEach((tab) => {
        const tabId = tab.id;
        if (tabId && !tab.url?.match(/^chrome*/)) {
          console.log('restoreAppState chrome.tabs.sendMessage->', tabId);
          chrome.tabs.sendMessage(tabId, { type: 'walletInitialized' }, (response) => {
            if (chrome.runtime.lastError) {
              console.log(
                'chrome.tabs.sendMessage - Message delivery failed:',
                chrome.runtime.lastError.message
              );
              // You can implement retry logic or alternative actions here
            } else {
              console.log('chrome.tabs.sendMessage - Message delivered successfully:', response);
            }
          });
        }
      });
    });
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
      // console.log('PortMessage ->', data);
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

    // console.log('pm.listen ->', data);

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

  const ki = await storage.get('keyIndex');
  const keyIndex = Number(ki);
  const services = preAuthzServiceDefinition(
    address,
    keyIndex,
    payer.address,
    payer.keyId,
    network
  );

  // console.log('handlePreAuthz ->', services, opener, id)
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

// chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
//   console.log('wake me up');
// });

// Function called when a new message is received
const extMessageHandler = (msg, sender, sendResponse) => {
  // Messages from FCL, posted to window and proxied from content.js
  const { service } = msg;

  // console.log('extMessageHandler ->', msg)

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
      .then((tabs) => {
        const tabId = tabs[0].id;

        if (service.type === 'pre-authz') {
          handlePreAuthz(tabId);
        } else {
          console.log('notificationService.requestApproval ->', service, findPath(service));
          console.log('notificationService.msg ->', msg);
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
  // return true
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
  console.log('received', msg, 'from', port.sender);
}

console.log('Is fetch native?', fetch.toString().includes('[native code]'));

// Call it when extension starts
setEnvironmentBadge();

function saveTimestamp() {
  const timestamp = new Date().toISOString();

  chrome.storage.session.set({ timestamp });
}

const SAVE_TIMESTAMP_INTERVAL_MS = 2 * 1000;

saveTimestamp();
setInterval(saveTimestamp, SAVE_TIMESTAMP_INTERVAL_MS);
