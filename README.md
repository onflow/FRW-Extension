## Contribution

If you'd like to contribute to the extension, you'll need to install Node.js, pnpm, and get access to the development environment.

### TLDR

1. `npm install --global corepack@latest`
2. `corepack enable pnpm`
3. `pnpm i`
4. Get `.env.dev` from another developer
5. `pnpm build:dev`
6. Load Unpacked at `chrome://extensions/` in developer mode and pick the `dist` folder created by build:dev

### Install Node & Dependencies

1. Install Node.js version v22.11 or later using a [package manager](https://nodejs.org/en/download/package-manager)
2. Install pnpm `corepack enable pnpm`
3. Run `pnpm i` to install dependencies

Mac / Linux

```
# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# Install Node.js version v22.11 or later
nvm install 22

# Use the version of Node.js specifcied in .nvmrc
nvm use 22
# install pnpm
corepack enable pnpm

# checkout dev branch
git checkout dev

# install dependencies
pnpm i
```

Windows

```
# installs fnm (Fast Node Manager)
winget install Schniz.fnm

# configure fnm environment
fnm env --use-on-cd | Out-String | Invoke-Expression

# download and install Node.js
fnm use --install-if-missing 22

# install pnpm
corepack enable pnpm

# install dependencies
pnpm i
```

### Configure Environment Variables

Environment variables are needed to interact with certain services. There are two versions of the .env file: one for development, one for release.

- .env.dev
- .env.prd

You should only ever need the development version of the .env file as the release version is built using GitHub Actions. The best thing to do is get a copy of the .env.dev file from a developer and add it to the project but **be sure to remove the `DEV_PASSWORD` variable from the file before sharing it.** Never commit the .env.dev file to the repository.

The .env.example file includes all the variables that are needed for the extension to work.

### Building for Development

- (Optional) Run `pnpm react-devtools` to open the React DevTools in your browser. If this is running when you start the development build, the extension will include the React DevTools code. The code is downloaded statically and built into the extension as extensions cannot load external scripts.
- Run `pnpm build:dev` on Mac / Linux, `pnpm winBuild:dev` on Windows. This will build the extension with file watching and console logging.
- Open Chrome, go to `chrome://extensions`, enable "Developer mode", click "Load unpacked", and select the `dist` folder.

### Wallets

During development, you'll often be unlocking the wallet. As Chrome extensions cannot use many password managers, we have included a way for developers to set a default password for wallets. This password will be pre-filled in the wallet unlock popup when in development mode.

In .env.dev, set the `DEV_PASSWORD` variable to the password you want to use. This can be any password you want but it must pass the password policy. DO NOT SHARE THIS PASSWORD WITH ANYONE.

You can then create a wallet or import an existing wallet to start using the extension. If you go to the settings page in the extension, you can turn on Developer Mode which will allow you to switch between mainnet and testnet chains.

### Testing & development

- `pnpm test` will run the tests in watch mode.
- As you code, VS Code or Cursor will automatically lint and format your code when you save files.
- When you check in code using git, the linter will run to check and format your code.

_NOTE: We are working to create a test environment for the extension. This will allow you to test the with emulated transactions and wallets._

### Folder Structure

- `src/` contains the source code for the extension.
- `_raw/` contains the raw files for the extension.
- `dist/` contains the built extension.
- `_locales/` contains the locale files for the extension.
- `build/` contains the webpack build files for the extension.
- `__tests__/` contains tests

The source code is written in TypeScript and uses React on the UI. We have separated the code into the following folders:

- `src/ui/` contains the UI code for the extension popup.
- `src/background/` contains the background code for the extension service worker.
- `src/content-script/` contains the content scripts for the extension.
- `src/shared/` contains the shared utils and types between the different parts of the extension.

There are lint rules in place to ensure, the background code never includes any UI code, and that the service worker doesn't directly interact with globals such as `window` or `document`.

The UI communicates with the background service worker using the `chrome.runtime.sendMessage` and `chrome.runtime.onMessage` APIs. There is a WalletController class that handles the communication with the background service worker. This is the main way the UI interacts with the background service worker. The WalletController proxies the wallet methods in the background service worker using messaging to act as controller for the UI.

### Workflow

We work on the `dev` branch of the repository. Before you start working on the extension, create a branch for the feature you're working on from the `dev` branch. We then have a Github project that co-ordinates features between the iOS, Android, and web extension teams. Please link the issue to the Flow Wallet project and update status as you work on the feature.

1. Always create a new branch from the `dev` branch.
2. When you're ready to merge your branch into `dev`, create a pull request from your branch to the `dev` branch.
3. When the pull request is approved, merge it into the `dev` branch.
4. When you're ready to release a new version of the extension, create a pull request from the `dev` branch to the `master` branch.
5. When the pull request is approved, merge it into the `master` branch.
6. When the release is ready to be built, the `master` branch will be built and released to the Chrome Web Store.

### Language

The extension supports multiple languages. The language files are stored in the `_raw/_locales/` folder. You should put any new strings into these files.

1. Copy `_raw/_locales/en/messages.json` to `_raw/_locales/${localCode}/messages.json` (Find your locale code in [https://en.wikipedia.org/wiki/Language_localisation#Language_tags_and_codes](https://en.wikipedia.org/wiki/Language_localisation#Language_tags_and_codes))
2. Replace content in `message` property to appropriate locale language

ATTENTION: When you create a new key, make sure the key doesen't include space and not duplicated with existing phrase (case insensitive).

## Test Environment Variables

Setup the following environment variables in .env.dev file:

- TEST_PASSWORD: The password for the test wallet

## Analyzing High Priority Issues

This repository includes tools to analyze high-priority issues across repositories. To use these tools:

1. Install GitHub CLI if you haven't already:

   ```bash
   # macOS
   brew install gh

   # Windows
   winget install --id GitHub.cli

   ```

2. Login to GitHub CLI with project permissions:

   ```bash
   pnpm gh:login
   ```

   Follow the prompts to complete authentication. Make sure to:

   - Choose "GitHub.com" for the account
   - Choose "HTTPS" for the protocol
   - Choose "Y" to authenticate Git with your GitHub credentials
   - Choose "Login with a web browser" for authentication method

3. Run the analysis:
   ```bash
   pnpm analyze:priority
   ```

The analysis will generate several files in the `.github-data` directory:

- `index.html`: Overview of all repositories with high-priority issues
- For each repository with high-priority issues:
  - `{repo-name}-bug-heatmap.html`: Interactive visualization of bug hotspots
  - `{repo-name}-high-priority-report.md`: Detailed markdown report
  - `{repo-name}-high-priority-changes.json`: Raw data for further analysis
