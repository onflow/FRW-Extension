# Test info

- Name: setup new wallet or login if already registered
- Location: /home/runner/work/FRW-Extension/FRW-Extension/e2e/registration/registration.setup.ts:5:1

# Error details

```
Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for getByPlaceholder('Username')

    at registerAccount (/home/runner/work/FRW-Extension/FRW-Extension/e2e/utils/helper.ts:151:43)
    at registerTestUser (/home/runner/work/FRW-Extension/FRW-Extension/e2e/utils/helper.ts:235:7)
    at /home/runner/work/FRW-Extension/FRW-Extension/e2e/registration/registration.setup.ts:19:5
```

# Test source

```ts
   51 |   // Navigate and wait for network to be idle
   52 |   await page.goto(`chrome-extension://${extensionId}/index.html#/unlock`);
   53 |
   54 |   await page.waitForSelector('.logoContainer', { state: 'visible' });
   55 |   await closeOpenedPages(page);
   56 |
   57 |   await fillInPassword({ page, password });
   58 |
   59 |   const unlockBtn = await page.getByRole('button', { name: 'Unlock Wallet' });
   60 |
   61 |   await expect(unlockBtn).toBeEnabled({ enabled: true, timeout: 60_000 });
   62 |
   63 |   // close all pages except the current page (the extension opens them in the background)
   64 |   await unlockBtn.click();
   65 |   // get address
   66 |   let flowAddr = await getCurrentAddress(page);
   67 |   if (flowAddr !== addr && isValidEthereumAddress(flowAddr)) {
   68 |     await switchToMainAccount({ page, address: addr });
   69 |     flowAddr = await getCurrentAddress(page);
   70 |   }
   71 |   if (flowAddr !== addr) {
   72 |     // switch to the correct account
   73 |     await page.getByTestId('account-menu-button').click();
   74 |     await page.getByRole('button', { name: 'close' }).click();
   75 |     await expect(page.getByText('Profiles', { exact: true })).toBeVisible();
   76 |     // Switch to the correct account. Note doest not handle more than 3 accounts loaded
   77 |     await page.getByTestId(`profile-item-nickname-${nickname}`).click();
   78 |     await expect(page.getByRole('progressbar').getByRole('img')).not.toBeVisible();
   79 |     // get address
   80 |     flowAddr = await getCurrentAddress(page);
   81 |     if (flowAddr !== addr && isValidEthereumAddress(flowAddr)) {
   82 |       await switchToMainAccount({ page, address: addr });
   83 |       flowAddr = await getCurrentAddress(page);
   84 |     }
   85 |   }
   86 |
   87 |   expect(flowAddr).toBe(addr);
   88 |
   89 |   // Wait for the coins to be loaded
   90 |   await expect(page.getByTestId('coin-balance-flow')).toBeVisible({ timeout: 30_000 });
   91 | };
   92 |
   93 | export const loginAsTestUser = async ({ page, extensionId }) => {
   94 |   const keysFile = await getAuth();
   95 |
   96 |   if (keysFile.password === '') {
   97 |     return false;
   98 |   }
   99 |
  100 |   const { password, addr, nickname } = keysFile;
  101 |
  102 |   return loginToExtensionAccount({ page, extensionId, password, addr, nickname });
  103 | };
  104 |
  105 | const getNumber = (str: string) => {
  106 |   const match = str.match(/\d+/);
  107 |   return match ? parseInt(match[0]) : null;
  108 | };
  109 |
  110 | export const fillInPassword = async ({ page, password }) => {
  111 |   // Handle both create a password and confirm your password
  112 |   let filledAtLeastOneField = false;
  113 |   if (await page.getByLabel('Password').isVisible()) {
  114 |     await page.getByLabel('Password').clear();
  115 |     await page.getByLabel('Password').fill(password);
  116 |     filledAtLeastOneField = true;
  117 |   }
  118 |
  119 |   if (await page.getByRole('textbox', { name: 'Enter your password' }).isVisible()) {
  120 |     await page.getByRole('textbox', { name: 'Enter your password' }).clear();
  121 |     await page.getByRole('textbox', { name: 'Enter your password' }).fill(password);
  122 |     filledAtLeastOneField = true;
  123 |   }
  124 |   if (await page.getByRole('textbox', { name: 'Create a password' }).isVisible()) {
  125 |     await page.getByRole('textbox', { name: 'Create a password' }).clear();
  126 |     await page.getByRole('textbox', { name: 'Create a password' }).fill(password);
  127 |     filledAtLeastOneField = true;
  128 |   }
  129 |   if (await page.getByRole('textbox', { name: 'Confirm your password' }).isVisible()) {
  130 |     await page.getByRole('textbox', { name: 'Confirm your password' }).clear();
  131 |     await page.getByRole('textbox', { name: 'Confirm your password' }).fill(password);
  132 |     filledAtLeastOneField = true;
  133 |   }
  134 |   // Make sure we filled at least one field
  135 |   expect(filledAtLeastOneField).toBe(true);
  136 | };
  137 |
  138 | export const registerAccount = async ({ page, extensionId, username, password }) => {
  139 |   // We're starting from a fresh install, so create a new wallet
  140 |   await closeOpenedPages(page);
  141 |   // Wait for the welcome page to be fully loaded
  142 |   await page.waitForSelector('.welcomeBox', { state: 'visible' });
  143 |
  144 |   // Click on register button
  145 |   await page.getByRole('link', { name: 'Create a new wallet' }).click();
  146 |
  147 |   // Wait for the register page to be fully loaded
  148 |   await page.getByText('Your username will be used to').isVisible();
  149 |
  150 |   // Fill in the form
> 151 |   await page.getByPlaceholder('Username').fill(username);
      |                                           ^ Error: locator.fill: Target page, context or browser has been closed
  152 |
  153 |   // Click on register button
  154 |   await page.getByRole('button', { name: 'Next' }).click();
  155 |
  156 |   await page
  157 |     .locator('div')
  158 |     .filter({ hasText: /^Click here to reveal phrase$/ })
  159 |     .getByRole('button')
  160 |     .click();
  161 |
  162 |   await page.getByRole('button', { name: 'Copy' }).click();
  163 |
  164 |   // got keys from clipboard
  165 |   const clipboardText = await page.evaluate(getClipboardText);
  166 |
  167 |   const keyArr = clipboardText.split(' ');
  168 |
  169 |   // next step
  170 |   await page.getByRole('button', { name: 'Okay, I have saved it properly' }).click();
  171 |
  172 |   // get puzzles
  173 |   const firstIdx = await page.locator('div').getByText('#').first().textContent();
  174 |   const secondIdx = await page.locator('div').getByText('#').nth(1).textContent();
  175 |   const thirdIdx = await page.locator('div').getByText('#').nth(2).textContent();
  176 |
  177 |   const firstMnemonic = keyArr[getNumber(firstIdx!)! - 1];
  178 |   const secondMnemonic = keyArr[getNumber(secondIdx!)! - 1];
  179 |   const thirdMnemonic = keyArr[getNumber(thirdIdx!)! - 1];
  180 |
  181 |   // console.log(firstMnemonic, secondMnemonic, thirdMnemonic);
  182 |   // click the right mnemonic word
  183 |
  184 |   // resolve mnemonics puzzles
  185 |   await page.getByLabel('row0').getByRole('button', { name: firstMnemonic }).click();
  186 |   await page.getByLabel('row1').getByRole('button', { name: secondMnemonic }).click();
  187 |   await page.getByLabel('row2').getByRole('button', { name: thirdMnemonic }).click();
  188 |
  189 |   await page
  190 |     .locator('div')
  191 |     .filter({ hasText: /^Next$/ })
  192 |     .click();
  193 |
  194 |   // fill
  195 |   await fillInPassword({ page, password });
  196 |
  197 |   await page.getByLabel("I agree to Flow Wallet's").click();
  198 |
  199 |   const registerBtn = await page.getByRole('button', { name: 'Register' });
  200 |   await registerBtn.click();
  201 |   await expect(page.getByRole('button', { name: 'Connect and Back up' })).toBeVisible({
  202 |     timeout: 120_000,
  203 |   });
  204 |
  205 |   // await unlockBtn.isEnabled();
  206 |   await page.goto(`chrome-extension://${extensionId}/index.html#/dashboard`);
  207 |
  208 |   // get address
  209 |
  210 |   const flowAddr = await getCurrentAddress(page);
  211 |
  212 |   // save keys and pwd to keys file
  213 |   return {
  214 |     privateKey: clipboardText,
  215 |     password: password,
  216 |     addr: flowAddr,
  217 |   };
  218 | };
  219 |
  220 | export const registerTestUser = async ({ page, extensionId }) => {
  221 |   const username = `testuser${String.fromCharCode(
  222 |     ...Array(4)
  223 |       .fill(0)
  224 |       .map(() => Math.floor(Math.random() * 26) + 97)
  225 |   )}`;
  226 |   const password = process.env.TEST_PASSWORD;
  227 |   if (!password) {
  228 |     throw new Error('TEST_PASSWORD is not set');
  229 |   }
  230 |
  231 |   const {
  232 |     privateKey,
  233 |     password: pwd,
  234 |     addr,
  235 |   } = await registerAccount({ page, extensionId, username, password });
  236 |
  237 |   await saveAuth({
  238 |     privateKey,
  239 |     password: pwd,
  240 |     addr,
  241 |     nickname: username,
  242 |   });
  243 | };
  244 |
  245 | export const importAccountBySeedPhrase = async ({
  246 |   page,
  247 |   extensionId,
  248 |   seedPhrase,
  249 |   username,
  250 |   accountAddr = '',
  251 | }) => {
```