import Message from './index';

/**
 * PostMessage class for communication between the page provider and content script.
 * This class handles sending and receiving messages via `window.postMessage`,
 * and includes security measures to support cross-origin iframes safely.
 */
export default class PostMessage extends Message {
  // The target origin for postMessage calls. Defaults to the window's current origin
  // for security, but can be dynamically changed for responses.
  private _targetOrigin: string;
  private _uuid: string;

  // Stores the origin of the last received message. This is crucial for sending
  // responses back to the correct cross-origin iframe.
  private _lastOrigin?: string;

  constructor(uuid?: string) {
    super();
    if (!uuid) {
      throw new Error('UUID is required for PostMessage communication');
    }
    this._uuid = uuid;
    // Default to the current window's origin for security.
    this._targetOrigin = window.location.origin;
  }

  connect = () => {
    window.addEventListener('message', this._handleMessage);
    return this;
  };

  listen = (listenCallback) => {
    this.listenCallback = listenCallback;
    window.addEventListener('message', this._handleMessage);
    return this;
  };

  /**
   * Handles incoming messages from the window.
   * It performs security checks to ensure the message is from a valid source
   * (the window itself or one of its frames) and has the correct structure.
   */
  private _handleMessage = (event: MessageEvent) => {
    // Security check: only accept messages from the current window or its frames.
    // This allows for communication with dApps running in iframes.
    if (event.source !== window && event.source !== window.self) {
      if (!Array.from(window.frames).includes(event.source as Window)) {
        return;
      }
    }

    // Ensure the message has the required properties for our protocol.
    if (!event.data || !event.data.type || event.data.uuid !== this._uuid) {
      return;
    }

    const { type, data } = event.data;

    // Store the origin of the sender. This is used to send the response
    // back to the correct origin, which is vital for iframe support.
    this._lastOrigin = event.origin;

    if (type === 'frw:message') {
      this.emit('message', data);
    } else if (type === 'frw:response') {
      this.onResponse(data);
    } else if (type === 'frw:request') {
      this.onRequest(data);
    }
  };

  /**
   * Sends a message via window.postMessage.
   * It dynamically sets the targetOrigin for responses to ensure they are sent
   * securely to the source of the request, even across different origins.
   */
  send = (type: string, data: any) => {
    let targetOrigin = this._targetOrigin;

    // For responses, we must use the origin of the original requestor.
    // This is critical for securely communicating with cross-origin iframes.
    if (type === 'response') {
      targetOrigin = this._lastOrigin || this._targetOrigin;
    }

    window.postMessage(
      {
        type: `frw:${type}`,
        data,
        uuid: this._uuid,
        source: 'frw-provider',
      },
      targetOrigin
    );
  };

  dispose = () => {
    this._dispose();
    window.removeEventListener('message', this._handleMessage);
  };
}
