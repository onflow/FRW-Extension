import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

export async function detectBrowsers() {
  // Detect Brave (Brave exposes a special API)
  let isBrave = false;
  // @ts-ignore
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    try {
      // @ts-ignore
      isBrave = await navigator.brave.isBrave();
    } catch (e) {
      consoleError(e);
      isBrave = false;
    }
  }

  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor;

  // Detect Opera:
  // Opera may expose window.opr and include "OPR/" in its user agent.
  const isOpera =
    // @ts-ignore
    (!!window.opr && !!opr.addons) || !!window.opera || userAgent.indexOf(' OPR/') > -1;

  // Detect Edge (Chromium‑based or Legacy):
  // New Edge uses "Edg/" while legacy Edge used "Edge/"
  const isEdge = userAgent.indexOf('Edg/') > -1 || userAgent.indexOf('Edge/') > -1;

  // Detect Chrome:
  // Chrome includes "Chrome" in the UA and "Google Inc." as the vendor.
  // We exclude Edge and Opera since they are also Chromium‑based.
  const isChrome =
    userAgent.indexOf('Chrome') > -1 && vendor.indexOf('Google Inc') > -1 && !isOpera && !isEdge;

  // Detect Firefox:
  // Firefox exposes the InstallTrigger object.
  // @ts-ignore
  const isFirefox = typeof InstallTrigger !== 'undefined';

  // Detect Safari:
  // Safari’s UA contains "Safari" but not "Chrome" or "Android".
  // This regex isn’t perfect but works for many cases.
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);

  // Detect Chromium:
  // Some builds of the open‑source Chromium browser include the string "Chromium"
  const isChromium = userAgent.indexOf('Chromium') > -1;

  // Detect Arc:
  // Arc (by The Browser Company) sometimes includes "Arc" in its user agent.
  const isArc = userAgent.indexOf('Arc') > -1;

  return {
    Brave: isBrave,
    Opera: isOpera,
    Edge: isEdge,
    Chrome: isChrome,
    Firefox: isFirefox,
    Safari: isSafari,
    Chromium: isChromium,
    Arc: isArc,
  };
}

export const isChromeOnly = (detectedBrowsers) => {
  const { Chrome, ...rest } = detectedBrowsers;
  const notChrome = Object.values(rest).some((browser) => browser);
  return Chrome && !notChrome;
};

export const isChrome = async () => {
  const detectedBrowsers = await detectBrowsers();
  return isChromeOnly(detectedBrowsers);
};
