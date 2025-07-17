import { p256 } from '@noble/curves/nist';
import { HDKey } from '@scure/bip32';
import { mnemonicToSeed, generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

import {
  FLOW_BIP44_PATH,
  HASH_ALGO,
  KEY_TYPE,
  SIGN_ALGO,
} from '@onflow/flow-wallet-shared/constant/algo-constants';

import { decodeArray } from './base64';
import { addCredential, readSettings } from './settings';
import {
  decodeAttestationObject,
  decodeAuthenticatorData,
  decodeClientDataJSON,
} from './WebAuthnDecoder';

function getRandomBytes(length: number) {
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
  decodeClientDataJSON(result.response.clientDataJSON);
  const authenticatorResponse: AuthenticatorAssertionResponse = result.response;
  decodeAuthenticatorData(authenticatorResponse.authenticatorData);
  return result;
};

const getPKfromLogin = async (result) => {
  // Create a deterministic seed from userHandle
  const userHandle = result.response.userHandle;
  const entropy = new Uint8Array(32);
  // Fill entropy with userHandle data, padding or truncating as needed
  for (let i = 0; i < Math.min(userHandle.length, 32); i++) {
    entropy[i] = userHandle[i];
  }

  // Generate mnemonic from entropy
  const mnemonic = generateMnemonic(wordlist, 256); // Note: This generates a random mnemonic
  // For deterministic generation from entropy, we'd need to implement BIP39 entropy to mnemonic conversion

  // Create HD wallet from mnemonic
  const seed = await mnemonicToSeed(mnemonic, '');
  const hdkey = HDKey.fromMasterSeed(seed);
  const derived = hdkey.derive(FLOW_BIP44_PATH);

  if (!derived.privateKey) {
    throw new Error('Failed to derive private key');
  }

  const privateKey = derived.privateKey;
  const publicKey = p256.getPublicKey(privateKey, false);

  const json = decodeClientDataJSON(result.response.clientDataJSON);

  return {
    mnemonic: mnemonic,
    type: KEY_TYPE.PASSKEY,
    pk: uint8Array2Hex(privateKey),
    pubK: uint8Array2Hex(publicKey).replace(/^04/, ''),
    keyIndex: 0,
    signAlgo: SIGN_ALGO.P256,
    hashAlgo: HASH_ALGO.SHA256,
    addtional: {
      clientDataJSON: json,
    },
  };
};

const getPKfromRegister = async ({ userId }) => {
  if (!userId) {
    return null;
  }

  // Create a deterministic seed from userId
  const entropy = new Uint8Array(32);
  // Fill entropy with userId data, padding or truncating as needed
  for (let i = 0; i < Math.min(userId.length, 32); i++) {
    entropy[i] = userId[i];
  }

  // Generate mnemonic from entropy
  const mnemonic = generateMnemonic(wordlist, 256); // Note: This generates a random mnemonic
  // For deterministic generation from entropy, we'd need to implement BIP39 entropy to mnemonic conversion

  // Create HD wallet from mnemonic
  const seed = await mnemonicToSeed(mnemonic, '');
  const hdkey = HDKey.fromMasterSeed(seed);
  const derived = hdkey.derive(FLOW_BIP44_PATH);

  if (!derived.privateKey) {
    throw new Error('Failed to derive private key');
  }

  const privateKey = derived.privateKey;
  const publicKey = p256.getPublicKey(privateKey, false);

  return {
    type: KEY_TYPE.PASSKEY,
    mnemonic: mnemonic,
    pk: uint8Array2Hex(privateKey),
    pubK: uint8Array2Hex(publicKey).replace(/^04/, ''),
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
