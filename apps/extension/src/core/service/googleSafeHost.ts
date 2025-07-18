import createPersistStore from '../utils/persistStore';

interface GoogleHostModel {
  url: string;
}

interface GoogleSafeHostStore {
  blockList: string[];
  expiry: number;
}

// https://developers.google.com/safe-browsing/v4/lookup-api
// https://transparencyreport.google.com/safe-browsing/search
class GoogleSafeHost {
  baseURL = 'https://safebrowsing.googleapis.com';
  key = process.env.GOOGLE_API;
  version = '1.0';

  store!: GoogleSafeHostStore;

  init = async () => {
    this.store = await createPersistStore<GoogleSafeHostStore>({
      name: 'nft',
      template: {
        blockList: [],
        expiry: 0,
      },
    });
  };

  getExpiry = () => {
    return this.store.expiry;
  };

  // 10 minutes
  setExpiry = (expiry: number = 1000 * 60 * 60) => {
    this.store.expiry = new Date().getTime() + expiry;
  };

  checkHostSafe = async (hosts: string[]): Promise<string[]> => {
    if (hosts.length === 0) {
      return [];
    }
    const hostList = hosts.map((host) => new URL(host).host);
    const unique = Array.from(new Set(hostList)).map((host): GoogleHostModel => ({ url: host }));
    const { data } = await this.sendRequest(unique);
    this.setExpiry();
    if (data.matches && data.matches.length > 0) {
      const blockList = data.matches.map((item) => item.threat.url);
      blockList
        .filter((block) => !this.store.blockList.includes(block))
        .forEach((block) => this.store.blockList.push(block));
      return blockList;
    }
    return [];
  };

  getBlockList = async (hosts: string[] = [], forceCheck = false): Promise<string[]> => {
    if (forceCheck) {
      return await this.checkHostSafe(hosts);
    }

    const now = new Date().getTime();
    if (now > this.store.expiry) {
      this.store.blockList = [];
      return await this.checkHostSafe(hosts);
    }

    return this.store.blockList;
  };

  sendRequest = async (urls: GoogleHostModel[]) => {
    const url = new URL(`${this.baseURL}/v4/threatMatches:find`);
    if (this.key) {
      url.searchParams.append('key', this.key);
    }
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client: {
          clientId: 'lilico-extension',
          clientVersion: '0.0.1',
        },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
            'THREAT_TYPE_UNSPECIFIED',
          ],
          platformTypes: ['ALL_PLATFORMS'],
          threatEntryTypes: ['URL'],
          threatEntries: urls,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  };
}

export default new GoogleSafeHost();
