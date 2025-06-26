import aesjs from 'aes-js';
import * as bip39 from 'bip39';

import { consoleError, consoleWarn } from '@/shared/utils/console-log';

interface GoogleDriveFileModel {
  kind: string;
  id: string;
  name: string;
  mimeType: string;
}
interface DriveItem {
  username: string;
  data: string;
  version: string;
  uid: string | null;
  time: string | null;
}

// https://developers.google.com/drive/api/v3/reference/files/list
class GoogleDriveService {
  baseURL = 'https://www.googleapis.com/';
  backupName = process.env.GD_BACKUP_NAME!;
  appDataFolder = process.env.GD_FOLDER!;
  scope = 'https://www.googleapis.com/auth/drive.appdata';
  AES_KEY = process.env.GD_AES_KEY!;
  IV = aesjs.utils.utf8.toBytes(process.env.GD_IV!);
  version = '1.0';

  fileList: DriveItem[] | null = null;
  fileId: string | null = null;

  hasBackup = async () => {
    const files = await this.listFiles();
    return files;
  };

  hasUserBackup = async (username: string): Promise<boolean> => {
    const accounts = await this.loadBackupAccounts();
    return accounts.includes(username);
  };

  hasGooglePermission = async (): Promise<boolean> => {
    try {
      const token = await this.getAuthTokenWrapper(false);
      return token !== undefined && token !== null;
    } catch (err) {
      consoleError('hasGooglePermission - not authorized', err);
      return false;
    }
  };

  deleteUserBackup = async (username: string) => {
    const backups: DriveItem[] = await this.loadBackup();
    const newBackups = backups.filter((item) => item.username !== username);
    const updateContent = this.encrypt(JSON.stringify(newBackups), this.AES_KEY);
    if (!this.fileId) {
      throw new Error('Delete backup failed, missing fileId');
    }
    return await this.updateFile(this.fileId, updateContent, true);
  };

  encodeToDriveItem = (
    mnemonic: string,
    username: string,
    uid: string,
    password: string
  ): DriveItem => {
    return {
      username: username,
      version: this.version,
      data: this.encrypt(mnemonic, password),
      uid: uid,
      time: new Date().getTime().toString(),
    };
  };

  parseGoogleText = (encryptedData: string) => {
    let encryptedHex;

    // Attempt to parse the data as JSON
    try {
      const sanitizedData = encryptedData.replace(/\s+/g, '');
      const parsedData = JSON.parse(sanitizedData);
      encryptedHex = parsedData?.hex || parsedData;
    } catch (error) {
      consoleWarn('JSON parsing failed, checking if raw hex string:', error.message);

      const rawHex = encryptedData.replace(/\s+/g, '');
      if (/^[0-9a-fA-F]+$/.test(rawHex)) {
        encryptedHex = rawHex;
      } else {
        throw new Error('Invalid input: not JSON and not a valid hex string');
      }
    }
    return encryptedHex;
  };

  uploadMnemonicToGoogleDrive = async (
    mnemonic: string,
    username: string,
    uid: string,
    password: string
  ) => {
    const item = this.encodeToDriveItem(mnemonic, username, uid, password);
    const files = await this.listFiles();
    if (!files) {
      const newContent = this.encrypt(JSON.stringify([item]), this.AES_KEY);
      const file = await this.createFile(newContent);
      return [file];
    }
    const fileId = files.id;
    this.fileId = fileId;
    const text = await this.getFile(fileId);
    const parsedText = this.parseGoogleText(text);
    const decodeContent = await this.decrypt(parsedText, this.AES_KEY);
    const content: DriveItem[] = JSON.parse(decodeContent);
    const result = content.filter((file) => file.username !== username);
    result.unshift(item);
    const updateContent = this.encrypt(JSON.stringify(result), this.AES_KEY);
    return await this.updateFile(fileId, updateContent);
  };

  loadBackup = async (): Promise<DriveItem[]> => {
    const files = await this.listFiles();
    if (!files) {
      return [];
    }
    const fileId = files.id;
    this.fileId = fileId;
    const text = await this.getFile(fileId);
    const parsedText = this.parseGoogleText(text);
    const decodeContent = await this.decrypt(parsedText, this.AES_KEY);
    const content: DriveItem[] = JSON.parse(decodeContent);
    this.fileList = content;
    return content;
  };

  loadBackupAccounts = async (): Promise<string[]> => {
    const fileList = await this.loadBackup();
    return fileList.map((item) => item.username);
  };

  loadBackupAccountLists = async (): Promise<DriveItem[]> => {
    const fileList = await this.loadBackup();
    return fileList.map((file) => {
      if (file['userName']) {
        return {
          ...file,
          username: file['userName'],
        };
      }
      return file;
    });
  };

  restoreAccount = async (
    username: string,
    password: string,
    uid = null
  ): Promise<string | null> => {
    const files = await this.fileList;
    if (files && files.length !== 0) {
      let result: DriveItem | undefined;

      // Check by uid first
      if (uid) {
        result = files.find((file) => file.uid === uid);
      }
      if (!result) {
        result = files.find((file) => file.username === username);
      }
      if (result) {
        return this.decrypt(result.data, password);
      }
    }
    return null;
  };

  listFiles = async (): Promise<GoogleDriveFileModel> => {
    const { files } = await this.sendRequest('drive/v3/files/', 'GET', {
      spaces: 'appDataFolder',
    }).then((response) => response.json());
    const firstOutblockBackup = files.find((file) => file.name === this.backupName);
    return firstOutblockBackup;
  };

  getFile = async (fileId: string) => {
    const result = await this.sendRequest(`drive/v3/files/${fileId}/`, 'GET', { alt: 'media' });
    const text = await result.text();
    return text;
  };

  createFile = async (content: string) => {
    if (content.length === 0) {
      return;
    }

    const file = new Blob([JSON.stringify(content)], { type: 'application/json' });
    const metadata = {
      name: this.backupName, // Filename at Google Drive
      mimeType: 'application/json', // mimeType at Google Drive
      parents: ['appDataFolder'], // Folder ID at Google Drive
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    return await this.sendRequest(
      'upload/drive/v3/files',
      'POST',
      { uploadType: 'multipart', fields: 'id', addParents: 'appDataFolder' },
      {
        metadata: metadata,
        file: content,
      },
      form
    );
  };

  updateFile = async (fileId: string, content: string, isDelete = false) => {
    // Check the content is valid
    const decodeContent = await this.decrypt(content, this.AES_KEY);
    const items: DriveItem[] = JSON.parse(decodeContent);

    // More than one items
    if (items.length > 0) {
      await this.updateFileContent(fileId, content);
    } else {
      // If it is array and it's delete progress
      if (isDelete) {
        await this.updateFileContent(fileId, content);
      }
    }
  };

  private updateFileContent = async (fileId: string, content: string) => {
    const file = new Blob([JSON.stringify(content)], { type: 'application/json' });
    const metadata = {
      name: this.backupName, // Filename at Google Drive
      mimeType: 'application/json', // mimeType at Google Drive
      addParents: ['appDataFolder'], // Folder ID at Google Drive
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    return await this.sendRequest(
      `upload/drive/v3/files/${fileId}`,
      'PATCH',
      { uploadType: 'multipart', fields: 'id', addParents: 'appDataFolder' },
      {
        metadata: metadata,
        file: content,
      },
      form
    );
  };

  deleteFile = async (fileId: string) => {
    return await this.sendRequest(`drive/v3/files/${fileId}`, 'DELETE');
  };

  deleteAllFile = async () => {
    const files = await this.listFiles();
    if (!files) {
      return;
    }
    return this.deleteFile(files.id);
  };

  sendRequest = async (
    url: string,
    method = 'GET',
    params: Record<string, string> = {},
    data = {},
    form: FormData | null = null
  ) => {
    const token = await this.getAuthTokenWrapper();
    const init = {
      method,
      async: true,
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: '*/*',
      },
      contentType: 'application/json',
    };

    if (method.toUpperCase() !== 'GET') {
      init['body'] = JSON.stringify(data);
    }

    // If we have form, we use form instead of json
    if (form) {
      init['body'] = form;
    }

    const requestURL = this.baseURL + url + '?' + new URLSearchParams(params).toString();
    return await fetch(requestURL, init);
  };

  pad_array = (arr, len = 16, fill = 0) => {
    return new Uint8Array([...arr, ...Array(16).fill(fill)]).slice(0, len);
  };

  encrypt = (text: string, password: string, iv = this.IV): string => {
    // The initialization key (must be 16 bytes)
    const key = this.pad_array(aesjs.utils.utf8.toBytes(password));
    // Convert text to bytes (text must be a multiple of 16 bytes)
    const textBytes = aesjs.padding.pkcs7.pad(aesjs.utils.utf8.toBytes(text));
    const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    const encryptedBytes = aesCbc.encrypt(textBytes);
    const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
    // Buffer.from(encryptedBytes).toString('base64')
    return encryptedHex;
  };

  decrypt = (encryptedHex, password: string, iv = this.IV): string => {
    // The initialization key (must be 16 bytes)
    const key = this.pad_array(aesjs.utils.utf8.toBytes(password));
    // When ready to decrypt the hex string, convert it back to bytes
    const encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
    // console.log('encryptedBytes ->', encryptedBytes)
    // The cipher-block chaining mode of operation maintains internal
    // state, so to decrypt a new instance must be instantiated.
    const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    const decryptedBytes = aesjs.padding.pkcs7.strip(aesCbc.decrypt(encryptedBytes));
    // console.log('decryptedBytes ->', decryptedBytes)
    // Convert our bytes back into text
    const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
    return decryptedText.trim();
  };

  getAuthTokenWrapper = async (interactive = true) => {
    return new Promise(function (resolve, reject) {
      const detail = {
        interactive: interactive,
        scopes: ['https://www.googleapis.com/auth/drive.appdata'],
      };
      chrome.identity.getAuthToken(detail, (token) => {
        if (token) {
          resolve(token);
        } else {
          reject(token);
        }
      });
    });
  };

  /**
   * Test if a profile backup can be decrypted with the given password
   * @param username - The username of the profile to test
   * @param password - The password to test
   * @returns Promise<boolean> - Whether decryption was successful
   */
  testProfileBackupDecryption = async (username: string, password: string): Promise<boolean> => {
    try {
      const backups = await this.loadBackup();
      const backup = backups.find((b) => b.username === username);

      if (!backup) {
        return false;
      }

      const decryptedMnemonic = this.decrypt(backup.data, password);
      return bip39.validateMnemonic(decryptedMnemonic);
    } catch (err) {
      consoleError('testProfileBackupDecryption - error', err);
      // Silently handle decryption errors
      return false;
    }
  };

  /**
   * Set new password for specific profile backups
   * @param oldPassword - The current password
   * @param newPassword - The new password to set
   * @param profileUsernames - Array of profile usernames to update passwords for
   * @returns Promise<boolean> - Success status
   */
  setNewPassword = async (
    oldPassword: string,
    newPassword: string,
    profileUsernames: string[]
  ): Promise<boolean> => {
    try {
      if (!(await this.hasGooglePermission())) {
        throw new Error('Not authorized to update password on google backups');
      }

      // Load all backups
      const backups: DriveItem[] = await this.loadBackup();

      if (backups.length === 0 || !this.fileId) {
        return false;
      }

      // Create a new array with updated backups
      const updatedBackups = backups.map((item) => {
        // Only update backups for specified usernames
        if (profileUsernames.includes(item.username)) {
          try {
            // Verify the old password and decrypt
            const decryptedMnemonic = this.decrypt(item.data, oldPassword);
            if (!bip39.validateMnemonic(decryptedMnemonic)) {
              throw new Error(`Decrypted mnemonic is invalid for ${item.username}`);
            }

            // Re-encrypt with new password
            return {
              ...item,
              data: this.encrypt(decryptedMnemonic, newPassword),
              time: new Date().getTime().toString(),
            };
          } catch (err) {
            consoleError(`Failed to update password for profile backup: ${item.username}`, err);
            throw new Error(`Failed to update password for profile backup: ${item.username}`);
          }
        }

        // Return unchanged for non-selected backups
        return item;
      });

      // Atomic approach - all succeeded, now update the file
      const updateContent = this.encrypt(JSON.stringify(updatedBackups), this.AES_KEY);
      await this.updateFile(this.fileId, updateContent, false);
      return true;
    } catch (err) {
      consoleError('Failed to update password on selected profile backups:', err);
      throw new Error('Failed to update password on selected profile backups');
    }
  };
}

export default new GoogleDriveService();
