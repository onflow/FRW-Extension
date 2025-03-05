// @todo: Remove this entire service.
// See the comments for why this entire service is pointless, and if it DID work why it's dangerous.
import { createSessionStore } from 'background/utils';

import googleDriveService from './googleDrive';

interface PasswordStore {
  password: string;
  rand: string;
  veryfiPwd: string;
}

class Password {
  store!: PasswordStore;

  init = async () => {
    // This initializes the store
    // createSessionStore calls createProxy, which creates a proxy object that watches for changes to the store
    // The idea is when a change is detected, it calls debounce, which queues a function to save the store to sessionStorage
    // So INITIALLY, the store is of type PasswordStore
    //
    // However, we are using SESSION storage to store the store and the only time this store is created is when init is called.
    // This happens once when the extension is installed - which is the start of the session.
    // So the store is always empty when we create it so it never reads any data from session storage.

    this.store = await createSessionStore<PasswordStore>({
      name: 'password',
      template: {
        password: '',
        veryfiPwd: '',
        rand: (Math.random() + 1).toString(36).substring(7),
      },
    });
  };

  clear = () => {
    // This is called whenever the wallet is locked, but...
    //
    // There is a function in wallet, isUnlocked, that checks if the wallet is locked.
    // If it is locked, it will TRY to unlock the wallet using the password stored in this service.
    // Even though the intention of this service was to store the password in session storage,
    // it will always start out empty because the store is initialized when the extension is installed.
    // That's where the fun starts...
    //
    // If getPassword returns an empty string in isUnlocked, then this function is called.
    // It looks like the intention of this function is to clear the password from the store.
    // However, it doesn't do that.
    // It just sets the store to an empty object
    // This changes the type of the store to a plain object instead of a session store proxy.
    //
    // So after this function is called - which it always will be - any calls to setPassword will not be watched by the proxy.
    // And the password will not be saved to session storage.
    //
    // This is great because we NEVER should have been saving the password to local session storage in the first place.
    this.store = {
      password: '',
      veryfiPwd: '',
      rand: (Math.random() + 1).toString(36).substring(7),
    };
  };

  getPassword = async (): Promise<any> => {
    // As stated above, this function is called only from isUnlocked in wallet.
    //
    // The intention of this function is to return the password from the store.
    // However, the store is always empty because it is initialized when the extension is installed.
    //
    // Also the only time this function is called is when the wallet is locked.
    // Locking the wallet clears the store.
    //
    // So this function will always return an empty string.
    //
    // This is great because we NEVER should have been saving the password to local session storage in the first place.

    const encryptedPass = this.store.password;
    const password = await googleDriveService.decrypt(encryptedPass, this.store.rand);
    return password;
  };

  setPassword = async (password: string) => {
    // This function is called when the user sets a password.
    //
    // It encrypts the password and saves it to the store object.

    // By the time this function is called, the store is already a plain object in memory as we would have called clear.
    // So setting this just stores the password in memory - encrypted by this random number which IS NOT the same number as in session storage.
    //
    const encryptedPass = await googleDriveService.encrypt(password, this.store.rand);
    this.store.password = encryptedPass;
  };
}

// That's why this entire service is pointless and we should get rid of it

export default new Password();
