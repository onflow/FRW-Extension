import fs from 'fs';
import path from 'path';

import base, { type BrowserContext, chromium } from '@playwright/test';

const getKeysFilePath = () => {
  return path.join(import.meta.dirname, `../../playwright/.auth/keys.json`);
};

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, call) => {
    const pathToExtension = path.join(import.meta.dirname, '../../dist');
    // Figure out folder to use
    // Check if setup, test, or teardown
    const projectName = test.info().project.name;
    const projectDependencies = test.info().project.dependencies;
    const isSetup = projectName.match(/.*(setup).*/);
    const isTransaction =
      projectName.includes('transaction-setup') ||
      projectDependencies.includes('transaction-setup');
    const isRegistration =
      projectName.includes('registration-setup') ||
      projectDependencies.includes('registration-setup');

    const baseFolderName = `/tmp/test-user-data-dir-${isTransaction ? 'transaction' : isRegistration ? 'registration' : 'other'}`;
    let dataDir = baseFolderName;
    if (!isSetup && !isRegistration) {
      // Copy the base folder to a new folder with the parallel index
      dataDir = `${baseFolderName}-${process.env.TEST_WORKER_INDEX}`;

      fs.cpSync(baseFolderName, dataDir, { recursive: true });
    }

    console.log(`Launching extension for project ${projectName} with data dir ${dataDir}`);

    const context = await chromium.launchPersistentContext(dataDir, {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--allow-read-clipboard',
        '--allow-write-clipboard',
        '--lang=en-US',
      ],
      locale: 'en-US',
      env: {
        ...process.env,
        TEST_MODE: 'true',
        LANGUAGE: 'en_US',
      },
      permissions: ['clipboard-read', 'clipboard-write'],
    });

    await call(context);
    await context.close();
  },
  extensionId: async ({ context }, call) => {
    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent('serviceworker');
    const extensionId = background.url().split('/')[2];
    await call(extensionId);
  },
});

export const cleanExtension = async (projectName: string) => {
  console.log(
    'Cleaning extension for - parallel index, worker index, project',
    process.env.TEST_PARALLEL_INDEX,
    process.env.TEST_WORKER_INDEX,
    process.env.TEST_PROJECT
  );

  const userDataDir = `/tmp/test-user-data-dir-${projectName}`;
  const baseDir = '/tmp';

  // Read all directories in /tmp
  const files = fs.readdirSync(baseDir);

  // Find and remove all directories that match the pattern
  files.forEach((file) => {
    const fullPath = path.join(baseDir, file);
    if (file.startsWith(`test-user-data-dir-${projectName}`) && fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  });
};

// save keys auth file

export const saveAuth = async (auth) => {
  const keysFilePath = getKeysFilePath();

  if (auth) {
    // Ensure directory exists

    const dirPath = path.dirname(keysFilePath);
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(keysFilePath, JSON.stringify(auth));
  } else {
    if (fs.existsSync(keysFilePath)) {
      fs.unlinkSync(keysFilePath);
    }
  }
};
// get keys auth file

export const getAuth = async () => {
  const keysFilePath = getKeysFilePath();
  const keysFileContent = fs.existsSync(keysFilePath)
    ? fs.readFileSync(keysFilePath, 'utf8')
    : null;
  const keysFile = keysFileContent ? JSON.parse(keysFileContent) : null;
  return keysFile || { password: '', addr: '', nickname: '' };
};
// delete keys file

export const cleanAuth = async () => {
  await saveAuth(null);
};

export const expect = test.expect;
