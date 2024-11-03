import React from 'react';
import ReactDOM from 'react-dom';
import Views from './views';
import { Message } from '@/utils';
import { getUITypeName } from 'ui/utils';
import eventBus from '@/eventBus';
import { EVENTS } from 'consts';
// import './style/index.less';


function initAppMeta() {
  const head = document.querySelector('head');
  const icon = document.createElement('link');
  icon.href = 'https://lilico.app/fcw-logo.png';
  icon.rel = 'icon';
  head?.appendChild(icon);
  const name = document.createElement('meta');
  name.name = 'name';
  name.content = 'Flow Wallet';
  head?.appendChild(name);
  const description = document.createElement('meta');
  description.name = 'description';
  description.content = chrome.i18n.getMessage('appDescription');
  head?.appendChild(description);
}

initAppMeta();

const { PortMessage } = Message;
const portMessageChannel = new PortMessage();
portMessageChannel.connect(getUITypeName());

const wallet: Record<string, any> = new Proxy(
  {},
  {
    get(obj, key) {
      // console.log('portMessageChannel', obj, key);
      switch (key) {
        case 'openapi':
          return new Proxy(
            {},
            {
              get(obj, key) {
                return function (...params: any) {

                  chrome.runtime.sendMessage({message: 'openapi'}, function (response) {
                    // console.log(response);
                  });

                  return portMessageChannel.request({
                    type: 'openapi',
                    method: key,
                    params,
                  });
                };
              },
            }
          );
          break;
        default:
          return function (...params: any) {

            chrome.runtime.sendMessage(
              {
                type: 'controller', 
                method: key,
                params,
              }, function (response) {
                // console.log('portMessageChannel 3 ->', response);
              });

            // console.log('portMessageChannel 2', obj, key);

            return portMessageChannel.request({
              type: 'controller',
              method: key,
              params,
            });
          };
      }
    },
  }
);

portMessageChannel.listen((data) => {
  console.log('portMessageChannel.listen ->', data);
  if (data.type === 'broadcast') {
    eventBus.emit(data.method, data.params);
  }
});

eventBus.addEventListener(EVENTS.broadcastToBackground, (data) => {
  console.log('eventBus.addEventListener ->', data);
  portMessageChannel.request({
    type: 'broadcast',
    method: data.method,
    params: data.data,
  });
});

ReactDOM.render(<Views wallet={wallet} />, document.getElementById('root'));