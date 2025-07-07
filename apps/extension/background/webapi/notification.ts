import { createTab } from './tab';

chrome.notifications.onClicked.addListener((url) => {
  if (url.startsWith('https://')) {
    createTab(url.split('_randomId_')[0]);
  }
});

const create = (
  url: string,
  title: string,
  message: string,
  icon: string = chrome.runtime.getURL('./images/icon-64.png'),
  priority = 0
) => {
  const randomId = +new Date();

  const notificationId = url && `${url}?randomId_=${randomId}`;
  // Often the registry has a PNG equivalent to the SVG
  // This can't be that reliable, but it's the best we can do for now
  // Notifications don't support SVGs
  // From what I can tell, Flow is the only token that has an SVG logo
  const iconUrl = icon.replace(/\.svg$/, '.png');

  chrome.notifications.create(notificationId, {
    type: 'basic',
    title,
    iconUrl,
    message,
    priority,
  });
};

export default { create };
