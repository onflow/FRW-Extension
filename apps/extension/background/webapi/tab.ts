import { EventEmitter } from 'events';

const tabEvent = new EventEmitter();

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    tabEvent.emit('tabUrlChanged', tabId, changeInfo.url);
  }
});

// window close will trigger this event also
chrome.tabs.onRemoved.addListener((tabId) => {
  tabEvent.emit('tabRemove', tabId);
});

const createTab = async (url): Promise<number | undefined> => {
  const tab = await chrome.tabs.create({
    active: true,
    url,
  });

  return tab?.id;
};

const openIndexPage = (route = ''): Promise<number | undefined> => {
  const url = `index.html${route && `#${route}`}`;

  return createTab(url);
};

export default tabEvent;

export { createTab, openIndexPage };
