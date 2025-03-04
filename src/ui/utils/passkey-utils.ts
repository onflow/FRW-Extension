import { Buffer } from 'buffer';

/**
 * Interface for passkey credential information
 */
export interface PasskeyCredential {
  id: string;
  rawId: string;
  createdAt?: string;
}

/**
 * Checks if passkeys are supported by the current browser/device
 * @returns Promise<boolean> Whether passkeys are supported
 */
export const isPasskeySupported = async (): Promise<boolean> => {
  try {
    // Check if the browser supports WebAuthn
    const browserSupported =
      typeof window !== 'undefined' &&
      typeof window.PublicKeyCredential !== 'undefined' &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
        'function';

    if (!browserSupported) {
      return false;
    }

    // Check if the device has a platform authenticator
    const platformAuthenticatorAvailable =
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    return platformAuthenticatorAvailable;
  } catch (error) {
    console.error('Error checking passkey support:', error);
    return false;
  }
};

/**
 * Creates a new passkey credential
 * @param username The username to associate with the passkey
 * @param displayName The display name for the user
 * @param rpName The relying party name (usually the app name)
 * @returns Promise<PublicKeyCredential | null> The created credential or null if creation failed
 */
export const createPasskeyCredential = async (
  username: string,
  displayName: string
): Promise<PublicKeyCredential | null> => {
  try {
    // Generate a random challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Get the domain for the RP ID - use the effective domain
    const rpId = window.location.hostname;

    // Create credential options
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'FRW Extension Wallet',
        id: rpId,
      },
      user: {
        id: new TextEncoder().encode(username),
        name: username,
        displayName: displayName || username,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    };

    // Create credential in the UI context
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    return credential;
  } catch (error) {
    console.error('Error creating passkey credential:', error);
    return null;
  }
};

/**
 * Authenticates with a passkey
 * @param allowedCredentials Array of allowed credential IDs and rawIds
 * @returns Promise<PublicKeyCredential | null> The authenticated credential or null if authentication failed
 */
export const authenticateWithPasskey = async (
  allowedCredentials: PasskeyCredential[]
): Promise<PublicKeyCredential | null> => {
  try {
    // Generate a random challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Get the domain for the RP ID - use the effective domain
    const rpId = window.location.hostname;

    // Prepare allowed credentials from stored credentials
    const allowCredentials = allowedCredentials.map((cred) => ({
      type: 'public-key' as const,
      id: Uint8Array.from(atob(cred.rawId), (c) => c.charCodeAt(0)),
      transports: ['internal'] as AuthenticatorTransport[],
    }));

    // Create credential request options
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials,
      timeout: 60000,
      userVerification: 'required',
      rpId: rpId,
    };

    // Request credential in the UI context (WebAuthn API)
    const credential = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    return credential;
  } catch (error) {
    console.error('Error authenticating with passkey:', error);
    return null;
  }
};

/**
 * Extracts credential data from a PublicKeyCredential
 * @param credential The PublicKeyCredential to extract data from
 * @returns Object containing the credential ID and rawId
 */
export const extractCredentialData = (
  credential: PublicKeyCredential
): { credentialId: string; rawId: string } => {
  const credentialId = credential.id;
  const rawId = Buffer.from(credential.rawId).toString('base64');

  return { credentialId, rawId };
};

/**
 * Parses and categorizes WebAuthn errors
 * @param error The error to parse
 * @returns Object containing error information
 */
export const parseWebAuthnError = (
  error: any
): { message: string; code: string; isUserCancellation: boolean } => {
  let message = 'An unknown error occurred during passkey operation';
  let code = 'unknown_error';
  let isUserCancellation = false;

  if (error instanceof Error) {
    if (error.name === 'NotAllowedError') {
      message = 'Permission denied. You may have cancelled the request.';
      code = 'user_cancelled';
      isUserCancellation = true;
    } else if (error.name === 'SecurityError') {
      message = 'Security error. Operation not allowed in this context.';
      code = 'security_error';
    } else if (error.name === 'NotSupportedError') {
      message = 'This operation is not supported by your browser or device.';
      code = 'not_supported';
    } else if (error.name === 'InvalidStateError') {
      message = 'The operation could not be completed in the current state.';
      code = 'invalid_state';
    } else {
      message = error.message || 'An error occurred during passkey operation';
      code = error.name || 'error';
    }
  }

  return { message, code, isUserCancellation };
};
