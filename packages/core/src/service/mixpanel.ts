import type { TrackingEvents } from '@/shared/types/tracking-types';

import { version } from '../utils/package-version';

const DISTINCT_ID_KEY = 't_distinct_id';
const DEVICE_ID_PREFIX = '$device:';

interface IDInfo {
  $user_id?: string;
  $device_id: string;
}

interface MixpanelEvent<T> {
  event: string;
  properties: {
    $duration?: number;
    token?: string;
    distinct_id: string;
    time: number;
    $app_version_string: string;
    $browser: string;
    $browser_version: string;
    $os: string;
  } & T;
}

interface MixpanelIdentifyData {
  $distinct_id: string;
  $set_once: {
    $name: string;
    first_seen: string;
  };
  $time: number;
}

type MixpanelRequestData =
  | MixpanelEvent<TrackingEvents[keyof TrackingEvents]>
  | MixpanelIdentifyData;

// Super properties that will be sent with every event
type SuperProperties = {
  app_version: string;
  platform: 'extension';
  environment: 'development' | 'production';
  wallet_type: 'flow';
};

class MixpanelService {
  private static instance: MixpanelService;
  private initialized = false;
  private eventTimers: Partial<Record<keyof TrackingEvents, number>> = {};

  private distinctId?: string;
  private readonly API_URL = 'https://api.mixpanel.com';
  private readonly token: string;
  private superProperties: SuperProperties = {
    app_version: version,
    platform: 'extension',
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    wallet_type: 'flow',
  };

  async #getExtraProps() {
    const extensionVersion = chrome.runtime.getManifest().version;
    const browserInfo = getBrowserInfo();
    //const geoLocation = await this.getGeoLocation();

    const extraProps = {
      $app_version_string: extensionVersion,
      $browser: browserInfo.browser,
      $browser_version: browserInfo.version,
      time: timestamp() / 1000,
      $os: (await chrome.runtime.getPlatformInfo()).os,
    };
    return extraProps;
  }

  async getIdInfo(): Promise<IDInfo | undefined> {
    const res = await chrome.storage.local.get(DISTINCT_ID_KEY);
    const idInfo = res?.[DISTINCT_ID_KEY] as IDInfo | undefined;
    return idInfo;
  }

  async setIdInfo(info: Partial<IDInfo>) {
    const _info = await this.getIdInfo();
    const newInfo = {
      ...(_info ? _info : {}),
      ...info,
    };
    await chrome.storage.local.set({ [DISTINCT_ID_KEY]: newInfo });
  }

  private constructor() {
    // Private constructor for singleton
    this.token = process.env.MIXPANEL_TOKEN!;
    if (!this.token) {
      // eslint-disable-next-line no-console
      console.error('MIXPANEL_TOKEN is not defined in environment variables');
    }
  }

  static getInstance(): MixpanelService {
    if (!MixpanelService.instance) {
      MixpanelService.instance = new MixpanelService();
    }
    return MixpanelService.instance;
  }

  async init() {
    if (this.initialized) return;

    const ids = await this.getIdInfo();
    if (!ids?.$device_id) {
      await this.setIdInfo({ $device_id: UUID() });
    }
    this.initialized = true;
  }

  private async sendRequest(endpoint: string, data: MixpanelRequestData) {
    await this.init();

    const body = {
      ...data,
    };
    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain',
        },
        body: JSON.stringify([body]),
      });

      if (!response.ok) {
        throw new Error(`Mixpanel API error: ${response.statusText}`);
      }

      const responseText = await response.text();

      if (responseText !== '1') {
        throw new Error(`Mixpanel API returned unexpected response: ${responseText}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('error sending event to Mixpanel - raw', error);
      if (error instanceof Error) {
        // eslint-disable-next-line no-console
        console.error('Error sending event to Mixpanel:', error.message);
      }
    }
  }

  private removeTimer(eventName: keyof TrackingEvents) {
    const startTimeStamp = this.eventTimers[eventName];
    this.eventTimers[eventName] = undefined;

    return startTimeStamp;
  }

  async time<T extends keyof TrackingEvents>(eventName: T) {
    await this.init();

    // Start the timer for the event
    this.eventTimers[eventName] = Date.now();
  }

  async track<T extends keyof TrackingEvents>(eventName: T, properties: TrackingEvents[T]) {
    await this.init();

    const ids = await this.getIdInfo();
    const deviceId = ids?.$device_id;
    const userId = ids?.$user_id;
    const distinct_id = userId || DEVICE_ID_PREFIX + deviceId;

    const baseProperties = {
      token: this.token,
      distinct_id,
      ...(await this.#getExtraProps()),
      ...this.superProperties,
    };

    const event: MixpanelEvent<TrackingEvents[T]> = {
      event: eventName,
      properties: {
        ...baseProperties,
        ...properties,
      },
    };
    // Add duration if the timer was started
    const startTimeStamp = this.removeTimer(eventName);
    if (startTimeStamp !== undefined) {
      event.properties.$duration = Date.now() - startTimeStamp;
    }

    //Set determine geo location from ip as ip=1
    await this.sendRequest('/track?ip=1', event);
  }
  async trackPageView(pathname: string) {
    await this.init();

    await this.track('$mp_web_page_view', {
      current_page_title: 'Flow Wallet',
      current_domain: 'flow-extension',
      current_url_path: pathname,
      current_url_protocol: 'chrome-extension:',
    });
  }
  async identify(userId: string, name?: string) {
    await this.init();
    // get previous id.
    const ids = await this.getIdInfo();
    const deviceId = ids?.$device_id;
    if (!deviceId) return;
    if (deviceId === userId) return;
    await this.track('$identify', {
      distinct_id: userId,
      $anon_distinct_id: deviceId,
      $name: name,
    });
    await this.setIdInfo({ $user_id: userId });
  }

  async reset() {
    if (!this.initialized) return;
    this.distinctId = undefined;

    return chrome.storage.local.remove(DISTINCT_ID_KEY).then(() => {
      return this.setIdInfo({ $device_id: UUID() });
    });
  }
}

export const mixpanelTrack = MixpanelService.getInstance();

// https://github.com/mixpanel/mixpanel-js/blob/3623fe0132860386eeed31756e0d7eb4e61997ed/src/utils.js#L862C5-L889C7
function UUID() {
  const T = function () {
    const time = +new Date(); // cross-browser version of Date.now()
    let ticks = 0;

    while (time === +new Date()) {
      ticks++;
    }
    return time.toString(16) + Math.floor(ticks).toString(16);
  };
  const R = function () {
    return Math.random().toString(16).replace('.', '');
  };
  const UA = function () {
    const ua = navigator.userAgent;
    let i,
      ch,
      buffer: number[] = [],
      ret = 0;

    function xor(result: number, byte_array: number[]) {
      let j,
        tmp = 0;
      for (j = 0; j < byte_array.length; j++) {
        tmp |= buffer[j] << (j * 8);
      }
      return result ^ tmp;
    }

    for (i = 0; i < ua.length; i++) {
      ch = ua.charCodeAt(i);
      buffer.unshift(ch & 0xff);
      if (buffer.length >= 4) {
        ret = xor(ret, buffer);
        buffer = [];
      }
    }

    if (buffer.length > 0) {
      ret = xor(ret, buffer);
    }

    return ret.toString(16);
  };
  const se = (Math.floor(Math.random() * 1000) * Math.floor(Math.random() * 10000)).toString(16);
  return T() + '-' + R() + '-' + UA() + '-' + se + '-' + T();
}

function timestamp() {
  Date.now =
    Date.now ||
    function () {
      return +new Date();
    };
  return Date.now();
}

function getBrowserInfo() {
  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor;
  let browser, version;

  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    version = userAgent.match(/Firefox\/([0-9]+)/)?.[1];
  } else if (userAgent.includes(' OPR/')) {
    browser = 'Opera';
    version = userAgent.match(/Safari\/([0-9]+)/)?.[1]; // not tested
  } else if (vendor && vendor.includes('Apple')) {
    browser = 'Safari';
    version = userAgent.match(/Safari\/([0-9]+)/)?.[1];
  } else if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
    version = userAgent.match(/Chrome\/([0-9]+)/)?.[1];
  }
  return { browser, version };
}
