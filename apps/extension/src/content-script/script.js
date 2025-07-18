// @ts-nocheck
const service = {
  f_type: 'Service',
  f_vsn: '1.0.0',
  type: 'authn',
  uid: 'Flow Wallet',
  endpoint: 'chrome-extension://hpclkefagolihohboafpheddmmgdffjm/popup.html',
  method: 'EXT/RPC',
  id: 'hpclkefagolihohboafpheddmmgdffjm',
  identity: {
    address: '0x33f75ff0b830dcec',
  },
  provider: {
    address: '0x33f75ff0b830dcec',
    name: 'Flow Wallet',
    icon: 'https://lilico.app/frw-logo.png',
    description: 'A wallet created for everyone',
  },
};

function injectExtService(service) {
  if (service.type === 'authn' && service.endpoint !== null) {
    if (!Array.isArray(window.fcl_extensions)) {
      window.fcl_extensions = [];
    }
    window.fcl_extensions.push(service);
  } else {
    // eslint-disable-next-line no-console
    console.error('Authn service is required');
  }
}

injectExtService(service);
