import { initWasm } from '@trustwallet/wallet-core';

import {
  FLOW_BIP44_PATH,
  HASH_ALGO,
  KEY_TYPE,
  SIGN_ALGO,
} from '../../../shared/utils/algo-constants';

import { decodeArray } from './base64';
import { addCredential, readSettings } from './settings';
import {
  decodeAuthenticatorData,
  decodeClientDataJSON,
  decodeAttestationObject,
} from './WebAuthnDecoder';

function getRandomBytes(length) {
  const array = new Uint8Array(length ?? 32);
  crypto.getRandomValues(array);
  return array;
}

const createPasskey = async (name, displayName, rpName) => {
  const userId = getRandomBytes(16);
  const setup: CredentialCreationOptions = {
    publicKey: {
      challenge: getRandomBytes(20),
      rp: {
        name: rpName,
      },
      user: {
        id: userId,
        name: name,
        displayName: displayName,
      },
      pubKeyCredParams: [
        {
          type: 'public-key',
          alg: -7,
        },
      ],
    },
  };

  const result = await navigator.credentials.create(setup);
  if (
    !result ||
    !(result instanceof PublicKeyCredential) ||
    !(result.response instanceof AuthenticatorAttestationResponse)
  ) {
    return null;
  }
  const authenticatorResponse: AuthenticatorAttestationResponse = result.response;
  const attestationObject = decodeAttestationObject(authenticatorResponse.attestationObject);
  const authData = decodeAuthenticatorData(attestationObject.authData);
  addCredential(
    await readSettings(),
    setup.publicKey!.user,
    result.id,
    authData.attestedCredentialData.credentialPublicKey,
    result.response
  );
  return { userId, result, userName: name };
};

const getPasskey = async (id, rpName) => {
  const setup: CredentialRequestOptions = {
    publicKey: {
      challenge: getRandomBytes(20),
      rpId: rpName,
    },
  };

  if (id && id.length > 0) {
    setup.publicKey!.allowCredentials = [
      {
        type: 'public-key',
        id: decodeArray(id),
      },
    ];
  }

  const result = await navigator.credentials.get(setup);
  if (
    !result ||
    !(result instanceof PublicKeyCredential) ||
    !(result.response instanceof AuthenticatorAssertionResponse)
  ) {
    return null;
  }
  const json = decodeClientDataJSON(result.response.clientDataJSON);
  const authenticatorResponse: AuthenticatorAssertionResponse = result.response;
  const test = decodeAuthenticatorData(authenticatorResponse.authenticatorData);
  return result;
};

const getPKfromLogin = async (result) => {
  const { HDWallet, Curve } = await initWasm();
  const wallet = HDWallet.createWithEntropy(result.response.userHandle, '');
  const pk = wallet.getKeyByCurve(Curve.nist256p1, FLOW_BIP44_PATH);
  const pubk = pk.getPublicKeyNist256p1().uncompressed().data();
  const json = decodeClientDataJSON(result.response.clientDataJSON);

  return {
    mnemonic: wallet.mnemonic(),
    type: KEY_TYPE.PASSKEY,
    pk: uint8Array2Hex(pk.data()),
    pubK: uint8Array2Hex(pubk).replace(/^04/, ''),
    keyIndex: 0,
    signAlgo: SIGN_ALGO.P256,
    hashAlgo: HASH_ALGO.SHA256,
    addtional: {
      clientDataJSON: json,
    },
  };
};

const getPKfromRegister = async ({ userId, result }) => {
  if (!userId) {
    return null;
  }
  const { HDWallet, Curve } = await initWasm();
  const wallet = HDWallet.createWithEntropy(userId, '');
  const pk = wallet.getKeyByCurve(Curve.nist256p1, FLOW_BIP44_PATH);
  const pubk = pk.getPublicKeyNist256p1().uncompressed().data();
  return {
    type: KEY_TYPE.PASSKEY,
    mnemonic: wallet.mnemonic(),
    pk: uint8Array2Hex(pk.data()),
    pubK: uint8Array2Hex(pubk).replace(/^04/, ''),
    keyIndex: 0,
    signAlgo: SIGN_ALGO.P256,
    hashAlgo: HASH_ALGO.SHA256,
  };
};

const uint8Array2Hex = (input) => {
  const buffer = Buffer.from(input);
  return buffer.toString('hex');
};

export { createPasskey, getPasskey, getPKfromLogin, getPKfromRegister };
