import { keyringService, sessionService } from '@onflow/frw-core';
import { ethErrors } from 'eth-rpc-errors';

import tab from '@/background/webapi/tab';

import internalMethod from './internalMethod';
import rpcFlow from './rpcFlow';

tab.on('tabRemove', (id) => {
  sessionService.deleteSession(id);
});

export default async (req) => {
  const {
    data: { method },
  } = req;

  if (internalMethod[method]) {
    return internalMethod[method](req);
  }

  const hasVault = keyringService.hasVault();
  if (!hasVault) {
    throw ethErrors.provider.userRejectedRequest({
      message: 'wallet must has at least one account',
    });
  }

  return rpcFlow(req);
};
