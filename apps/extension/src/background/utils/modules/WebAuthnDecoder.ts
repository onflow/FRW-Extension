import { CborSimpleDecoder, BinaryReader } from './CborSimpleDecoder';
import { coseToJwk } from './Crypto';
import { AttestedCredentialData, AuthenticatorData } from './WebAuthnTypes';

/**
 * Convert to Uint8Array
 * @param {Uint8Array|ArrayBuffer} data
 * @returns {Uint8Array}
 */
export function toUint8Array(data) {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  throw new Error('invalid argument');
}

/**
 * Convert to ArrayBuffer
 * @param {Uint8Array|ArrayBuffer} data
 * @returns {ArrayBuffer}
 */
export function toArrayBuffer(data: Uint8Array | ArrayBuffer): ArrayBuffer {
  if (data instanceof Uint8Array) {
    return data.buffer;
  }
  if (data instanceof ArrayBuffer) {
    return data;
  }
  throw new Error('invalid argument');
}

/**
 * Convert to DataView
 * @param {Uint8Array|ArrayBuffer|DataView} data
 * @returns {DataView}
 */
export function toDataView(data: DataView | ArrayBuffer | Uint8Array): DataView {
  if (data instanceof DataView) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new DataView(data);
  }
  if (data instanceof Uint8Array) {
    return new DataView(data.buffer);
  }
  throw new Error('invalid argument');
}

/**
 * Invokes JSON.parse to decode clientDataJSON
 * @see https://w3c.github.io/webauthn/#dom-authenticatorresponse-clientdatajson
 * @param {Uint8Array|ArrayBuffer} data
 * @returns {object}
 */
export function decodeClientDataJSON(data: ArrayBuffer): object {
  const uint8Array = toUint8Array(data);
  return JSON.parse(Array.from(uint8Array, (t: number) => String.fromCharCode(t)).join(''));
}

export type AttestationFormat =
  | 'fido-u2f'
  | 'packed'
  | 'android-safetynet'
  | 'android-key'
  | 'tpm'
  | 'apple'
  | 'none';

export type AttestationStatement = {
  get(key: 'sig'): Uint8Array | undefined;
  get(key: 'x5c'): Uint8Array[] | undefined;
  get(key: 'response'): Uint8Array | undefined;
  get(key: 'alg'): number | undefined;
  get(key: 'ver'): string | undefined;
  get(key: 'certInfo'): Uint8Array | undefined;
  get(key: 'pubArea'): Uint8Array | undefined;
  // `Map` properties
  readonly size: number;
};
export type AttestationObject = {
  fmt: AttestationFormat;
  attStmt: AttestationStatement;
  authData: Uint8Array;
};

/**
 * Invokes CborSimpleDecoder.readObject to decode attestationObject
 * @see https://w3c.github.io/webauthn/#dom-authenticatorattestationresponse-attestationobject
 * @param {Uint8Array|ArrayBuffer} data
 * @returns {object}
 */

export function decodeAttestationObject(data: ArrayBuffer): AttestationObject {
  const arrayBuffer = toArrayBuffer(data);
  return CborSimpleDecoder.readObject(new BinaryReader(arrayBuffer));
}

/**
 * Decodes authenticatorData
 * @see https://w3c.github.io/webauthn/#authenticator-data
 * @param {Uint8Array|ArrayBuffer} data
 * @returns {WebAuthn.AuthenticatorData}
 */
export function decodeAuthenticatorData(data: ArrayBuffer) {
  const arrayBuffer = toArrayBuffer(data);
  const reader = new BinaryReader(arrayBuffer);

  /**
   * https://w3c.github.io/webauthn/#sec-authenticator-data
   *
   * rpIdHash 32
   * flags 1
   *  bit 0 up
   *  bit 2 uv
   *  bit 6 at
   *  bit 7 ed
   * signCount 4
   * attestedCredentialData variable
   * extensions variable
   */
  const authenticatorData = new AuthenticatorData();
  // rpIdHash
  authenticatorData.rpIdHash = reader.readBytes(32);
  // flags
  authenticatorData.flags = reader.readUInt8();
  // signCount
  authenticatorData.signCount = reader.readUInt32();

  // attestedCredentialData
  if (authenticatorData.at) {
    /**
     * https://w3c.github.io/webauthn/#sec-attested-credential-data
     *
     * aaguid 16
     * credentialIdLength 2
     * credentialId L
     * credentialPublicKey variable
     */
    authenticatorData.attestedCredentialData = new AttestedCredentialData();
    // aaguid
    authenticatorData.attestedCredentialData.aaguid = reader.readBytes(16);
    // credentialIdLength
    const credentialIdLength = reader.readUInt16();
    // credentialId
    authenticatorData.attestedCredentialData.credentialId = reader.readBytes(credentialIdLength);
    // credentialPublicKey
    const credentialPublicKey = CborSimpleDecoder.readObject(reader);
    authenticatorData.attestedCredentialData.credentialPublicKey = coseToJwk(credentialPublicKey);
  }

  // extensions
  if (authenticatorData.ed) {
    authenticatorData.extensions = reader.readBytes(
      reader.byteLength - reader.byteOffset - reader.readerOffset
    );
  }

  return authenticatorData;
}

export { coseToJwk, CborSimpleDecoder, BinaryReader };

export { verifyAssertionSignature } from './Signature';
