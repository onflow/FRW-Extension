import aesjs from 'aes-js';
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
interface DriveData {
  address: string;
  data: string;
}

// https://developers.google.com/drive/api/v3/reference/files/list
class GoogleDriveService {
  baseURL = 'https://www.googleapis.com/';
  backupName = process.env.GD_BACKUP_NAME!
  appDataFolder = process.env.GD_FOLDER!
  scope = 'https://www.googleapis.com/auth/drive.appdata'
  AES_KEY = process.env.GD_AES_KEY!
  IV = aesjs.utils.utf8.toBytes(process.env.GD_IV!)
  version = '1.0'

  fileList: DriveItem[] | null = null
  fileId: string | null = null

  hasBackup = async () => {
    const files = await this.listFiles()
    return files.length > 0
  }

  hasUserBackup = async (username: string): Promise<boolean> => {
    const accounts = await this.loadBackupAccounts()
    return accounts.includes(username)
  }

  hasGooglePremission = async (): Promise<boolean> => {
    try {
      const token = await this.getAuthTokenWrapper(false)
      return token != undefined || token != null
    } catch (err) {
      return false
    }
  }

  deleteUserBackup = async (username: string) => {
    const backups: DriveItem[] = await this.loadBackup()
    const newBackups = backups.filter((item) => item.username !== username)
    const updateContent = this.encrypt(JSON.stringify(newBackups), this.AES_KEY)
    if (!this.fileId) {
      throw new Error('Delete backup failed, missing fileId')
    }
    return await this.updateFile(this.fileId, updateContent, true)
  }

  encodeToDriveItem = (mnemonic: string, username: string, uid: string, password: string): DriveItem => {
    return {
      username: username,
      version: this.version,
      data: this.encrypt(mnemonic, password),
      uid: uid,
      time: new Date().getTime().toString()
    }
  }

  uploadMnemonicToGoogleDrive = async (mnemonic: string, username: string, uid: string, password: string) => {
    // TODO: FIX this
    // const hasBackup =  await this.hasBackup()
    const item = this.encodeToDriveItem(mnemonic, username, uid, password)
    const files = await this.listFiles();
    if (files.length === 0) {
      // No backup
      const content = this.encrypt(JSON.stringify([item]), this.AES_KEY)
      return await this.createFile(content)
    }
    // Has backup then append the file
    const fileId = files[0].id
    this.fileId = fileId
    const fileContent = await this.getFile(fileId)
    const text = await fileContent.text()
    const decodeContent = await this.decrypt(JSON.parse(text), this.AES_KEY)
    const content: DriveItem[] = JSON.parse(decodeContent)
    const result = content.filter(file => file.username !== username)
    result.unshift(item)
    const updateContent = this.encrypt(JSON.stringify(result), this.AES_KEY)
    return await this.updateFile(fileId, updateContent)
  }

  loadBackup = async (): Promise<DriveItem[]> => {
    const files = await this.listFiles();
    if (files.length === 0) {
      return [];
    }
    const firstOutblockBackup = files.find(file => file.name === "outblock_backup");
    if (!firstOutblockBackup) {
      return [];
    }
    const fileId = firstOutblockBackup.id
    this.fileId = fileId
    const fileContent = await this.getFile(fileId)
    const text = await fileContent.text()
    const decodeContent = await this.decrypt(JSON.parse(text), this.AES_KEY)
    const content: DriveItem[] = JSON.parse(decodeContent);
    console.log('content ', content)
    this.fileList = content
    return content
  }

  loadBackupAccounts = async (): Promise<string[]> => {
    const fileList = await this.loadBackup()
    return fileList.map(item => item.username)
  }

  loadBackupAccountLists = async (): Promise<DriveItem[]> => {
    const fileList = await this.loadBackup()
    return fileList.map(file => {
      if (file['userName']) {
        return {
          ...file,
          username: file['userName'],
        };
      }
      return file;
    });
  }

  restoreAccount = async (username: string, password: string, uid = null): Promise<string | null> => {
    const files = await this.fileList
    if (files && files.length !== 0) {
      let result: DriveItem | undefined;

      // Check by uid first
      if (uid) {
        result = files.find(file => file.uid === uid);
      }
      if (!result) {
        result = files.find(file => file.username === username);
      }
      if (result) {
        return this.decrypt(result.data, password);
      }
    }
    return null
  }

  listFiles = async (): Promise<GoogleDriveFileModel[]> => {
    const { files } = await this.sendRequest('drive/v3/files/', 'GET', {
      spaces: 'appDataFolder',
    }).then((response) => response.json());
    return files
  };

  getFile = async (fileId: string) => {
    return await this.sendRequest(`drive/v3/files/${fileId}/`, 'GET', { alt: 'media' });
  }

  createFile = async (content: string) => {
    if (content.length === 0) {
      return
    }

    const file = new Blob([JSON.stringify(content)], { type: 'application/json' });
    const metadata = {
      'name': this.backupName, // Filename at Google Drive
      'mimeType': 'application/json', // mimeType at Google Drive
      'parents': ['appDataFolder'], // Folder ID at Google Drive
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    // return await this.makeXMLRequest('post', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', form)

    return await this.sendRequest('upload/drive/v3/files', 'POST',
      { uploadType: 'multipart', fields: 'id', addParents: 'appDataFolder' },
      {
        metadata: metadata,
        file: content
      },
      form)
  }

  updateFile = async (fileId: string, content: string, isDelete = false) => {

    // Check the content is valid
    const decodeContent = await this.decrypt(content, this.AES_KEY)
    const items: DriveItem[] = JSON.parse(decodeContent)

    // More than one items
    if (items.length > 0) {
      await this.updateFileContent(fileId, content)
    } else {
      // If it is array and it's delete progress
      if (isDelete) {
        await this.updateFileContent(fileId, content)
      }
    }
  }

  private updateFileContent = async (fileId: string, content: string) => {
    const file = new Blob([JSON.stringify(content)], { type: 'application/json' });
    const metadata = {
      'name': this.backupName, // Filename at Google Drive
      'mimeType': 'application/json', // mimeType at Google Drive
      'addParents': ['appDataFolder'], // Folder ID at Google Drive
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    return await this.sendRequest(`upload/drive/v3/files/${fileId}`, 'PATCH',
      { uploadType: 'multipart', fields: 'id', addParents: 'appDataFolder' },
      {
        metadata: metadata,
        file: content
      }, form)
  }

  deleteFile = async (fileId: string) => {
    return await this.sendRequest(`drive/v3/files/${fileId}`, 'DELETE');
  };

  deleteAllFile = async () => {
    const files = await this.listFiles();
    return Promise.all(files.map(file => (this.deleteFile(file.id))))
  }

  sendRequest = async (
    url: string,
    method = 'GET',
    params: Record<string, string> = {},
    data = {},
    form: FormData | null = null
  ) => {
    const token = await this.getAuthTokenWrapper();
    const init = {
      method: method,
      async: true,
      headers: {
        Authorization: 'Bearer ' + token,
        'Accept': '*/*',
      },
      contentType: 'json',
    };

    if (method.toUpperCase() !== 'GET') {
      init['body'] = JSON.stringify(data)
    }

    // If we have form, we use form instead of json
    if (form) {
      init['body'] = form
    }

    const requestURL = this.baseURL + url + '?' + new URLSearchParams(params).toString()
    return await fetch(
      requestURL,
      init
    );
  };

  pad_array = (arr, len = 16, fill = 0) => {
    return new Uint8Array([...arr, ...(Array(16).fill(fill))]).slice(0, len);
  }

  encrypt = (text: string, password: string, iv = this.IV): string => {
    // The initialization key (must be 16 bytes)
    const key = this.pad_array(aesjs.utils.utf8.toBytes(password))
    // Convert text to bytes (text must be a multiple of 16 bytes)
    const textBytes = aesjs.padding.pkcs7.pad(aesjs.utils.utf8.toBytes(text));
    const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    const encryptedBytes = aesCbc.encrypt(textBytes);
    const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
    // Buffer.from(encryptedBytes).toString('base64')
    return encryptedHex;
  }

  decrypt = (encryptedHex, password: string, iv = this.IV): string => {
    // The initialization key (must be 16 bytes)
    const key = this.pad_array(aesjs.utils.utf8.toBytes(password))
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
    // console.log('decryptedText ->', decryptedText);
    return decryptedText.trim();
  }

  // makeXMLRequest = async (method, url, data) => {
  //   const token = await this.getAuthTokenWrapper();
  //   return new Promise(function (resolve, reject) {
  //     const xhr = new XMLHttpRequest();
  //     xhr.open(method, url);
  //     xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  //     xhr.responseType = 'json';
  //     xhr.onload = function () {
  //       if (this.status >= 200 && this.status < 300) {
  //         resolve(xhr.response);
  //       } else {
  //         reject({
  //           status: this.status,
  //           statusText: xhr.statusText
  //         });
  //       }
  //     };
  //     xhr.onerror = function () {
  //       reject({
  //         status: this.status,
  //         statusText: xhr.statusText
  //       });
  //     };
  //     xhr.send(data);
  //   })
  // }

  getAuthTokenWrapper = async (interactive = true) => {
    return new Promise(function (resolve, reject) {
      const detail = { interactive: interactive, scopes: ['https://www.googleapis.com/auth/drive.appdata'] }
      chrome.identity.getAuthToken(detail, (token) => {
        if (token) {
          resolve(token);
        } else {
          reject(token);
        }
      });
    });
  };
}

export default new GoogleDriveService();
