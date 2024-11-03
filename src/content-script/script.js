/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { WalletUtils } from '@onflow/fcl';
// import { nanoid } from 'nanoid';

// const channelName = nanoid();
// the script element with src won't execute immediately
// use inline script element instead!
// const container = document.head || document.documentElement;
// const ele = document.createElement('script');
// in prevent of webpack optimized code do some magic(e.g. double/sigle quote wrap),
// seperate content assignment to two line
// use AssetReplacePlugin to replace pageprovider content
// let content = `var channelName = '${channelName}';`;
// content += '#PAGEPROVIDER#';

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
}

WalletUtils.injectExtService(service);
