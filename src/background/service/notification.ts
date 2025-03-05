import Events from 'events';

import { ethErrors } from 'eth-rpc-errors';
import { EthereumProviderError } from 'eth-rpc-errors/dist/classes';

import { winMgr } from 'background/webapi';
import { IS_CHROME, IS_LINUX } from 'consts';

import { setEnvironmentBadge } from '../utils/setEnvironmentBadge';

interface Approval {
  data: {
    state: number;
    params?: any;
    origin?: string;
    approvalComponent: string;
    requestDefer?: Promise<any>;
    approvalType: string;
  };
  resolve(params?: any): void;
  reject(err: EthereumProviderError<any>): void;
}

// something need user approval in window
// should only open one window, unfocus will close the current notification
class NotificationService extends Events {
  _approval: Approval | null = null;
  notifiWindowId = 0;
  isLocked = false;
  private lastRequestTime = 0;

  get approval() {
    return this._approval;
  }

  set approval(val: Approval | null) {
    this._approval = val;
    if (val === null) {
      setEnvironmentBadge();
    } else {
      chrome.action.setBadgeText({
        text: '1',
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#41CC5D',
      });
    }
  }

  constructor() {
    super();

    winMgr.event.on('windowRemoved', (winId: number) => {
      if (winId === this.notifiWindowId) {
        this.notifiWindowId = 0;
      }
      this.rejectApproval();
    });

    winMgr.event.on('windowFocusChange', (winId: number) => {
      // const account = preferenceService.getCurrentAccount()!;
      if (this.notifiWindowId && winId !== this.notifiWindowId) {
        if (process.env.NODE_ENV === 'production') {
          if (
            IS_CHROME &&
            winId === chrome.windows.WINDOW_ID_NONE &&
            IS_LINUX
            // ||
            // (account?.type === KEYRING_TYPE.WalletConnectKeyring &&
            //   NOT_CLOSE_UNFOCUS_LIST.includes(account.brandName))
          ) {
            // Wired issue: When notification popuped, will focus to -1 first then focus on notification
            return;
          }
          // this.rejectApproval();
        }
      }
    });
  }

  getApproval = () => this.approval?.data;

  resolveApproval = (data?: any, forceReject = false) => {
    if (forceReject) {
      this.approval?.reject(new EthereumProviderError(4001, 'User Cancel'));
    } else {
      this.approval?.resolve(data);
    }
    // Handle the case where the approval is not unlocked
    this.approval = null;
    this.emit('resolve', data);
  };

  rejectApproval = async (err?: string) => {
    // Reject the approval
    this.approval?.reject(ethErrors.provider.userRejectedRequest<any>(err));
    // Clear the approval
    await this.clear();
    // Emit the reject event
    this.emit('reject', err);
  };

  // currently it only support one approval at the same time
  requestApproval = async (data, winProps?): Promise<any> => {
    const now = Date.now();
    if (now - this.lastRequestTime < 1000) {
      throw ethErrors.provider.userRejectedRequest('requested too fast');
    }
    this.lastRequestTime = now;

    if (this.approval) {
      throw ethErrors.provider.userRejectedRequest('please request after current approval resolve');
    }

    return new Promise((resolve, reject) => {
      this.approval = {
        data,
        resolve,
        reject,
      };

      this.openNotification(winProps);
    });
  };

  clear = async () => {
    this.unLock();
    this.approval = null;
    if (this.notifiWindowId) {
      await winMgr.remove(this.notifiWindowId);
      this.notifiWindowId = 0;
    }
  };

  unLock = () => {
    this.isLocked = false;
  };

  lock = () => {
    this.isLocked = true;
  };

  openNotification = (winProps) => {
    if (this.isLocked) return;
    this.lock();

    if (this.notifiWindowId) {
      winMgr.remove(this.notifiWindowId);
      this.notifiWindowId = 0;
    }

    winMgr.openNotification(winProps).then((winId) => {
      this.notifiWindowId = winId!;
    });
  };
}

export default new NotificationService();
