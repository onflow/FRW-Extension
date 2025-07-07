export const getCurrentTab = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  return tabs[0];
};

export const openInTab = async (url, needClose = true): Promise<number | undefined> => {
  const tab = await chrome.tabs.create({
    active: true,
    url,
  });

  if (needClose) window.close();

  return tab?.id;
};

export const getCurrentWindow = async (): Promise<number | undefined> => {
  const { id } = await chrome.windows.getCurrent({
    windowTypes: ['popup'],
  });

  return id;
};

export const openInternalPageInTab = (path: string, useWebapi = true) => {
  if (useWebapi) {
    openInTab(`./index.html#/${path}`);
  } else {
    window.open(`./index.html#/${path}`);
  }
};
