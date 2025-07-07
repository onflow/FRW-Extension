import { encodeArray } from './base64';

export function replacer(_k: string, v: unknown) {
  if (v instanceof ArrayBuffer) {
    return encodeArray(v);
  }
  if (v instanceof Uint8Array) {
    return encodeArray(v);
  }
  return v;
}

export function jsonToString(obj: unknown) {
  return JSON.stringify(obj, replacer, 2);
}
