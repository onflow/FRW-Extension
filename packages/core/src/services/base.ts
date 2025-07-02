import { preferenceService, keyringService } from 'background/service';
import { type PreferenceAccount } from 'background/service/preference';

class BaseController {
  getCurrentAccount = async () => {
    let account = preferenceService.getCurrentAccount();
    if (account) {
      const accounts = await this.getAccounts();
      const matchAcct = accounts.find((acct) => account!.address === acct.address);
      if (!matchAcct) account = undefined;
    }

    if (!account) {
      [account] = await this.getAccounts();
      if (!account) return null;
      preferenceService.setCurrentAccount(account);
    }

    return structuredClone(account) as PreferenceAccount;
  };

  syncGetCurrentAccount = () => {
    return preferenceService.getCurrentAccount() || null;
  };

  getAccounts = () => {
    return keyringService.getAllVisibleAccountsArray();
  };
}

export default BaseController;
