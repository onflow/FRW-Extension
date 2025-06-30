import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json dynamically to avoid ESM import issues
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
);
const { version } = packageJson;

const PROJECT_ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const mode = args[0];

dotenv.config({ path: `.env.${mode}` });

const IS_BETA = process.env.IS_BETA === 'true';
const OAUTH2_SCOPES = process.env.OAUTH2_SCOPES || '';

const DEVTOOLS_URL = 'http://localhost:8097';

async function fetchDevTools(): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = http.get(DEVTOOLS_URL, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch: ${response.statusCode}`));
        return;
      }

      let data = '';
      response.on('data', (chunk) => (data += chunk));
      response.on('end', () => {
        const modifiedScript = `
          // React DevTools for Chrome Extension
          (function() {
            ${data}
          })();
        `;
        resolve(modifiedScript);
      });
    });

    request.on('error', reject);
  });
}

async function prepare() {
  const manifestPath = path.resolve(PROJECT_ROOT, '_raw', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  manifest.oauth2 = {
    client_id: process.env.OAUTH2_CLIENT_ID,
    scopes: OAUTH2_SCOPES.split(','),
  };
  // Update the version in the manifest
  if (IS_BETA) {
    const betaVersion = process.env.BETA_VERSION;
    if (!betaVersion) {
      throw new Error('BETA_VERSION is not set');
    }

    const betaBuildNumber = betaVersion.replace(/^(\d+\.\d+\.\d+).*beta[^\d]*(\d+).*/, '$2');
    manifest.version = version.replace(/^(\d+)\.(\d+)\.(\d+).*/, `$1$2.$3.${betaBuildNumber}`);

    manifest.name = '__MSG_appNameBeta__';
    manifest.description = '__MSG_appDescriptionBeta__';
    manifest.key = process.env.BETA_MANIFEST_KEY;
    manifest.oauth2.client_id = process.env.BETA_OAUTH2_CLIENT_ID;
  } else {
    manifest.version = version;
    manifest.name = '__MSG_appName__';
    manifest.description = '__MSG_appDescription__';
  }

  if (mode === 'dev') {
    manifest.key = process.env.MANIFEST_KEY;
    manifest.name = 'Flow Wallet Dev';
    try {
      const devToolsScript = await fetchDevTools();
      fs.writeFileSync(path.resolve(__dirname, '../_raw/react-devtools.js'), devToolsScript);

      console.info('✅ React DevTools source fetched successfully');
    } catch {
      console.warn('⚠️ Failed to fetch React DevTools. Run the devtools server first');
      // Write empty file if fetch fails
      fs.writeFileSync(
        path.resolve(__dirname, '../_raw/react-devtools.js'),
        '// React DevTools not available'
      );
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return manifest;
}

prepare();
