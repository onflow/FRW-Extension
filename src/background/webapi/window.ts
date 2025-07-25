import { EventEmitter } from 'events';

import { IS_WINDOWS } from '@/background/webapi/environment';

const event = new EventEmitter();

// if focus other windows, then reject the approval
chrome.windows.onFocusChanged.addListener((winId) => {
  event.emit('windowFocusChange', winId);
});

chrome.windows.onRemoved.addListener((winId) => {
  event.emit('windowRemoved', winId);
});

const BROWSER_HEADER = 80;
const WINDOW_SIZE = {
  width: 400 + (IS_WINDOWS ? 14 : 0), // idk why windows cut the width.
  height: 600,
};

const create = async ({ url, ...rest }): Promise<number | undefined> => {
  const {
    top: cTop,
    left: cLeft,
    width,
  } = await chrome.windows.getCurrent({
    windowTypes: ['normal'],
  });

  const top = cTop! + BROWSER_HEADER;
  const left = cLeft! + width! - WINDOW_SIZE.width;

  // const tabs = await chrome.tabs.query(
  //   {
  //     active: true,
  //     currentWindow: true,
  //   })

  const win = await chrome.windows.create({
    focused: true,
    url,
    type: 'popup',
    top,
    left,
    ...WINDOW_SIZE,
    ...rest,
  });

  // shim firefox
  if (win.left !== left) {
    await chrome.windows.update(win.id!, { left, top, focused: true, drawAttention: true });
  } else {
    await chrome.windows.update(win.id!, { focused: true, drawAttention: true });
  }

  return win.id;
};

const remove = async (winId) => {
  return chrome.windows.remove(winId);
};

const openNotification = ({ route = '', ...rest } = {}): Promise<number | undefined> => {
  const url = `notification.html${route && `#${route}`}`;

  return create({ url, ...rest });
};

export default {
  openNotification,
  event,
  remove,
};
