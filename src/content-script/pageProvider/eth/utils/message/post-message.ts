import Message from './index';

export default class PostMessage extends Message {
  private _targetOrigin: string;
  private _uuid: string;

  constructor(uuid?: string) {
    super();
    if (!uuid) {
      throw new Error('UUID is required for PostMessage communication');
    }
    this._uuid = uuid;
    this._targetOrigin = '*'; // We'll restrict this in production
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

  private _handleMessage = (event: MessageEvent) => {
    // Basic security check - in production we'd want to be more restrictive
    if (!event.data || !event.data.type || event.data.uuid !== this._uuid) {
      return;
    }

    const { type, data } = event.data;

    if (type === 'frw:message') {
      this.emit('message', data);
    } else if (type === 'frw:response') {
      this.onResponse(data);
    } else if (type === 'frw:request') {
      this.onRequest(data);
    }
  };

  send = (type: string, data: any) => {
    window.postMessage(
      {
        type: `frw:${type}`,
        data,
        uuid: this._uuid,
        source: 'frw-provider',
      },
      this._targetOrigin
    );
  };

  dispose = () => {
    this._dispose();
    window.removeEventListener('message', this._handleMessage);
  };
}
