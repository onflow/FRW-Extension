import { ethErrors } from 'eth-rpc-errors';

import eventBus from '@/eventBus';
import { isValidEthereumAddress } from '@/shared/utils/address';
import {
  keyringService,
  notificationService,
  permissionService,
  userWalletService,
} from 'background/service';
import { PromiseFlow, underline2Camelcase } from 'background/utils';
import { EVENTS } from 'consts';

import Wallet from '../wallet';

import providerController from './controller';

const isSignApproval = (type: string) => {
  const SIGN_APPROVALS = ['SignText', 'SignTypedData', 'SignTx', 'EthConfirm'];
  return SIGN_APPROVALS.includes(type);
};

const lockedOrigins = new Set<string>();

const flow = new PromiseFlow();
const flowContext = flow
  .use(async (ctx, next) => {
    console.log('ctx #1 - check method', ctx);
    // check method
    const {
      data: { method },
    } = ctx.request;
    ctx.mapMethod = underline2Camelcase(method);
    console.log('ctx.mapMethod', ctx.mapMethod);

    if (!providerController[ctx.mapMethod]) {
      // TODO: make rpc whitelist
      try {
        const result = await providerController.ethRpc(ctx.request.data);
        console.log('ethRpc result', result);
        return result;
      } catch (error) {
        console.log('ethRpc error', error);
        // Catch any error and throw the custom error
        throw ethErrors.rpc.methodNotFound({
          message: `method [${ctx.request.data.method}] doesn't have a corresponding handler`,
          data: ctx.request.data,
        });
      }
    }

    return next();
  })
  // .use(async (ctx, next) => {
  //   console.log('ctx #2 - check something...', ctx);

  //   const {
  //     request: {
  //       session: { origin },
  //     },
  //     mapMethod,
  //   } = ctx;
  //   if (!Reflect.getMetadata('SAFE', providerController, mapMethod)) {
  //     Check that we're unlocked and have a connected site
  //     const mainwallet = await Wallet.getMainWallet();
  //     console.log('mainwallet', mainwallet);
  //     const evmAddress = await Wallet.queryEvmAddress(mainwallet);
  //     console.log('evmAddress', evmAddress);
  //     console.log('isValidEthereumAddress', isValidEthereumAddress(evmAddress));
  //     const currentNetwork = await Wallet.getNetwork();

  //     if (!isValidEthereumAddress(evmAddress)) {
  //       throw new Error('evm must has at least one account.');
  //     }
  //     const isUnlock = keyringService.memStore.getState().isUnlocked;
  //     const site = permissionService.getConnectedSite(origin);
  //     console.log('site / isUnlock', site, isUnlock);
  //     if (mapMethod === 'ethAccounts' && (!site || !isUnlock)) {
  //       console.log('error', 'Origin not connected. Please connect first');

  //       throw new Error('Origin not connected. Please connect first.');
  //     }
  //   }

  //   return next();
  // })
  .use(async (ctx, next) => {
    console.log('ctx #3 - check connect', ctx);
    const {
      request: {
        session: { origin, name, icon },
      },
      mapMethod,
    } = ctx;
    // check connect
    if (!Reflect.getMetadata('SAFE', providerController, mapMethod)) {
      console.log(
        'permissionService.hasPermission(origin)',
        permissionService.hasPermission(origin)
      );
      if (!permissionService.hasPermission(origin)) {
        ctx.request.requestedApproval = true;
        const { defaultChain, signPermission } = await notificationService.requestApproval(
          {
            params: { origin, name, icon },
            approvalComponent: 'EthConnect',
          },
          { height: 599 }
        );
        console.log('defaultChain / signPermission', defaultChain, signPermission);

        permissionService.addConnectedSite(origin, name, icon, defaultChain);
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    console.log('ctx #4 - check need approval', ctx);

    // check need approval
    const {
      request: {
        data: { params, method },
        session: { origin, name, icon },
      },
      mapMethod,
    } = ctx;
    const [approvalType, condition, { height = 599 } = {}] =
      Reflect.getMetadata('APPROVAL', providerController, mapMethod) || [];
    if (mapMethod === 'ethSendTransaction' || mapMethod === 'personalSign') {
      ctx.request.requestedApproval = true;
      ctx.approvalRes = await notificationService.requestApproval(
        {
          approvalComponent: 'EthConfirm',
          params: {
            method,
            data: params,
            session: { origin, name, icon },
          },
          origin,
        },
        { height }
      );
      if (isSignApproval('EthConfirm')) {
        permissionService.updateConnectSite(origin, { isSigned: true }, true);
      } else {
        permissionService.touchConnectedSite(origin);
      }
    }

    return next();
  })
  .use(async (ctx) => {
    console.log('ctx #5 - process request', ctx);
    const { approvalRes, mapMethod, request } = ctx;
    // process request
    const [approvalType] = Reflect.getMetadata('APPROVAL', providerController, mapMethod) || [];
    const { uiRequestComponent, ...rest } = approvalRes || {};
    const {
      session: { origin },
    } = request;
    const requestDefer = Promise.resolve(
      providerController[mapMethod]({
        ...request,
        approvalRes,
      })
    );

    requestDefer
      .then((result) => {
        if (isSignApproval(approvalType)) {
          eventBus.emit(EVENTS.broadcastToUI, {
            method: EVENTS.SIGN_FINISHED,
            params: {
              success: true,
              data: result,
            },
          });
        }
        return result;
      })
      .catch((e: any) => {
        if (isSignApproval(approvalType)) {
          eventBus.emit(EVENTS.broadcastToUI, {
            method: EVENTS.SIGN_FINISHED,
            params: {
              success: false,
              errorMsg: JSON.stringify(e),
            },
          });
        }
      });
    async function requestApprovalLoop({ uiRequestComponent, ...rest }) {
      ctx.request.requestedApproval = true;
      const res = await notificationService.requestApproval({
        approvalComponent: uiRequestComponent,
        params: rest,
        origin,
        approvalType,
      });
      if (res.uiRequestComponent) {
        return await requestApprovalLoop(res);
      } else {
        return res;
      }
    }
    if (uiRequestComponent) {
      ctx.request.requestedApproval = true;
      return await requestApprovalLoop({ uiRequestComponent, ...rest });
    }

    return requestDefer;
  })
  .callback();

export default (request) => {
  const ctx: any = { request: { ...request, requestedApproval: false } };
  return flowContext(ctx).finally(() => {
    if (ctx.request.requestedApproval) {
      flow.requestedApproval = false;
      // only unlock notification if current flow is an approval flow
      notificationService.unLock();
    }
  });
};
