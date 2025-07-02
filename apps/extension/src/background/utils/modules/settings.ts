import { consoleError } from '@/shared/utils/console-log';

import storage from '../../../shared/utils/storage';

import { jsonToString } from './utils';

type CredentialSetting = {
  instant: string;
  user: {
    name: string;
    displayName: string;
  };
  id: string;
  credentialPublicKey: Uint8Array;
  response: AuthenticatorAttestationResponse;
};
type Settings = {
  credentials: Record<string, CredentialSetting>;
  rp?: Record<string, unknown>;
  user?: Record<string, unknown>;
};

export function addCredential(
  settings: Settings,
  user: PublicKeyCredentialUserEntity,
  id: string,
  credentialPublicKey: Uint8Array,
  response: AuthenticatorAttestationResponse
) {
  if (id && id.length > 0) {
    settings.credentials[id] = {
      instant: new Date().toISOString(),
      user: {
        name: user.name,
        displayName: user.displayName,
      },
      id: id,
      credentialPublicKey: credentialPublicKey,
      response: response,
    };
    saveSettings(settings);
  }
}

export function getCredential(settings: Settings, id: string) {
  const cred = settings.credentials[id];
  return cred;
}

export async function getUsername(id: string): Promise<string | null> {
  const settings = await readSettings();
  if (id in settings.credentials) {
    const cred = settings.credentials[id];
    return cred.user.name;
  }
  return null;
}

export async function readSettings(): Promise<Settings> {
  let settings: Settings = {
    credentials: {},
  };
  const s = await storage.get('passkey-settings');
  if (!s) {
    return settings;
  }

  try {
    settings = JSON.parse(s);

    if (!settings.credentials) {
      settings.credentials = {};
    }
    if ('rp' in settings) {
      delete settings.rp;
    }
    if ('user' in settings) {
      delete settings.user;
    }
  } catch {
    consoleError('Error parsing settings');
  }

  return settings;
}

export function saveSettings(settings: Settings) {
  if (settings) {
    storage.set('passkey-settings', jsonToString(settings));
  } else {
    storage.remove('passkey-settings');
  }
}
