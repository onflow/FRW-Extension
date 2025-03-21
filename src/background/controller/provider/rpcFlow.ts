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
    // check method
    const {
      data: { method },
    } = ctx.request;
    console.log('flow - use #1', method);

    ctx.mapMethod = underline2Camelcase(method);
    if (!providerController[ctx.mapMethod]) {
      // TODO: make rpc whitelist
      try {
        const { result } = await providerController.ethRpc(ctx.request.data);
        return result;
      } catch (error) {
        // Catch any error and throw the custom error
        throw ethErrors.rpc.methodNotFound({
          message: `method [${ctx.request.data.method}] doesn't have a corresponding handler`,
          data: ctx.request.data,
        });
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    const {
      request: {
        session: { origin, name, icon },
      },
      mapMethod,
    } = ctx;
    console.log('flow - use #2 - check connect', mapMethod, origin, name, icon);

    // check connect
    // TODO: create a whitelist and list of safe methods to remove the need for Reflect.getMetadata
    if (
      mapMethod !== 'ethAccounts' &&
      mapMethod !== 'walletRequestPermissions' &&
      mapMethod !== 'walletRevokePermissions' &&
      mapMethod !== 'walletSwitchEthereumChain' &&
      mapMethod !== 'walletWatchAsset' &&
      mapMethod !== 'walletConnect' &&
      mapMethod !== 'walletDisconnect' &&
      mapMethod !== 'walletConnect' &&
      !Reflect.getMetadata('SAFE', providerController, mapMethod)
    ) {
      if (!permissionService.hasPermission(origin) || !(await Wallet.isUnlocked())) {
        ctx.request.requestedApproval = true;
        const { defaultChain, signPermission } = await notificationService.requestApproval(
          {
            params: { origin, name, icon },
            approvalComponent: 'EthConnect',
          },
          { height: 599 }
        );
        permissionService.addConnectedSite(origin, name, icon, defaultChain);
      }
    }

    return next();
  })
  .use(async (ctx, next) => {
    // check need approval
    const {
      request: {
        data: { params, method },
        session: { origin, name, icon },
      },
      mapMethod,
    } = ctx;
    console.log('flow - use #3 - check approval', mapMethod, origin, name, icon);

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
    const { approvalRes, mapMethod, request } = ctx;
    console.log('flow - use #4 - process request', mapMethod, request);

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
        console.log('flow - process result', mapMethod, result);
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
        console.log('flow - process error', mapMethod, e);

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
