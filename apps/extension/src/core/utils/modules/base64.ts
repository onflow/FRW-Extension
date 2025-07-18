import { toUint8Array } from './WebAuthnDecoder';

function atobUrlSafe(text: string): string {
  text = text
    .replace(/\s+/g, '') // removes whitespace such as linefeeds from input encoded string
    .replace(/-/g, '+') // replace '-' with '+'
    .replace(/_/g, '/'); // replace '_' with '/'
  switch (text.length % 4) {
    case 2:
      text += '==';
      break;
    case 3:
      text += '=';
      break;
    default:
      break; // if padding is wrong then eventually the atob call below fails
  }
  return atob(text);
}

/*
 * Base64 encode url safe
 * https://tools.ietf.org/html/rfc7515#appendix-C
 * https://tools.ietf.org/html/rfc4648#section-5
 */
function btoaUrlSafe(text: string): string {
  text = btoa(text)
    .replace(/\+/g, '-') // replace '+' with '-'
    .replace(/\//g, '_') // replace '/' with '_'
    .replace(/=+$/, ''); // remove trailing padding characters
  return text;
}

/**
 * base64url encode bytes
 * @param {ArrayBuffer|Uint8Array} array - array of bytes
 * @returns {string} - base64url encoded string
 */
function encodeArray(array: ArrayBuffer | Uint8Array): string {
  const arrayUint8 = toUint8Array(array);
  return btoaUrlSafe(Array.from(arrayUint8, (t) => String.fromCharCode(t)).join(''));
}

/**
 * base64url decode string
 * @param {string} value - base64url encoded string
 * @returns {Uint8Array} - array of bytes
 */
function decodeArray(value: string): Uint8Array {
  if (typeof value !== 'string') {
    throw new Error('invalid argument');
  }
  return Uint8Array.from(atobUrlSafe(value), (t) => t.charCodeAt(0));
}

export { encodeArray, decodeArray, atobUrlSafe, btoaUrlSafe };
