import * as ethUtil from 'ethereumjs-util';
import pageStateCache from '../service/pageStateCache';
export { default as createPersistStore } from './persisitStore';
export { default as createSessionStore } from './sessionStore';
import { storage } from '@/background/webapi';
import { version } from '@/../package.json';

// {a:{b: string}} => {1: 'a.b'}
// later same [source] value will override [result] key generated before
const retrieveValuePath = (obj) => {
  const arr = [...Object.entries(obj)];
  const result = {};
  const parentKey: string[] = [];
  let lastParent;

  while (arr.length) {
    const curNode = arr.shift();
    const [key, value] = curNode!;
    if (lastParent && lastParent[key] !== value) {
      parentKey.pop();
    }

    if (typeof value === 'object') {
      arr.unshift(...Object.entries(value!));
      parentKey.push(key);
      lastParent = value;
    } else if (typeof value === 'string') {
      result[value] = `${[...parentKey, key].join('.')}`;
    }
  }

  return result;
};

export const underline2Camelcase = (str: string) => {
  return str.replace(/_(.)/g, (m, p1) => p1.toUpperCase());
};

export { retrieveValuePath };
export { default as PromiseFlow } from './promiseFlow';

export function normalizeAddress(input: number | string): string {
  if (!input) {
    return '';
  }

  if (typeof input === 'number') {
    const buffer = ethUtil.toBuffer(input);
    input = ethUtil.bufferToHex(buffer);
  }

  if (typeof input !== 'string') {
    let msg = 'eth-sig-util.normalize() requires hex string or integer input.';
    msg += ` received ${typeof input}: ${input}`;
    throw new Error(msg);
  }

  return ethUtil.addHexPrefix(input);
}

export const wait = (fn: () => void, ms = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      fn();
      resolve(true);
    }, ms);
  });
};

export const setPageStateCacheWhenPopupClose = (data) => {
  const cache = pageStateCache.get();
  if (cache && cache.path === '/import/wallet-connect') {
    pageStateCache.set({
      ...cache,
      states: {
        ...cache.states,
        data,
      },
    });
  }
};

export const hasWalletConnectPageStateCache = () => {
  const cache = pageStateCache.get();
  if (cache && cache.path === '/import/wallet-connect') {
    return true;
  }
  return false;
};

export const isSameAddress = (a: string, b: string) => {
  return a.toLowerCase() === b.toLowerCase();
};

export const getScripts = async (folder: string, scriptName: string) => {
  const { data } = await storage.get('cadenceScripts');
  const files = data[folder];
  const script = files[scriptName];
  const scriptString = Buffer.from(script, 'base64').toString('utf-8');
  const modifiedScriptString = scriptString
    .replaceAll('<platform_info>', `Extension-${version}`);
  return modifiedScriptString;
};

export const findKeyAndInfo = (keys, publicKey) => {
  const index = findPublicKeyIndex(keys, publicKey);
  if (index >= 0) {
    const key = keys.keys[index];
    return {
      index: index,
      signAlgo: key.signAlgoString,
      hashAlgo: key.hashAlgoString,
      publicKey: key.publicKey,
    };
  }
  return null;
};

export const findPublicKeyIndex = (data, publicKey) => {
  return data.keys.findIndex((key) => key.publicKey === publicKey);
};
