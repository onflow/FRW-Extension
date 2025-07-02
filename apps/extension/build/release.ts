import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { prompt } from 'enquirer';
import shell from 'shelljs';
import zipdir from 'zip-dir';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
type Version = `${number}.${number}.${number}`;

async function release(): Promise<Version> {
  const input: { version: Version } = await prompt({
    type: 'input',
    name: 'version',
    message: '[Flow Wallet] Please input the release version:',
  });
  const manifestPath = path.resolve(PROJECT_ROOT, '_raw', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  manifest.version = input.version;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  shell.exec(`npm version ${input.version} --force`);
  shell.exec('git add -A');
  shell.exec(`git commit -m "[release] ${input.version}"`);
  shell.exec(`git push origin refs/tags/v${input.version}`);
  shell.exec('git push origin master');

  return input.version;
}

function bundle(version: Version) {
  shell.exec('pnpm build:pro');
  const distPath = path.resolve(PROJECT_ROOT, 'dist');
  zipdir(distPath, { saveTo: `FlowCore_${version}.zip` });
}

release().then(bundle);
