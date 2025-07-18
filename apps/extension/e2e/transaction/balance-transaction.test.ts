import BN from 'bignumber.js';
import { table } from 'table'; // We'll need to install this

import { switchToEvmAddress, loginToSenderAccount, loginToReceiverAccount } from '../utils/helper';
import { test, expect } from '../utils/loader';

// Define minimum required balances for each token
const REQUIRED_BALANCES_CADENCE = {
  flow: '0.01', // Sum of Flow transactions in Cadence (0.00123456 * 3) plus buffer
  stFlow: '0.002', // stFlow requirement (0.00123456) plus buffer
  'usdc.e': '0.002', // USDC requirement (0.00123456) plus buffer
  beta: '0.002', // BETA requirement (0.00123456) plus buffer
};

const REQUIRED_BALANCES_EVM = {
  flow: '0.15', // Sum of Flow transactions in EVM (0.12345678 + 0.00123456 * 2) plus buffer
  stFlow: '0.000002', // stFlow requirement (0.00000112134354678) plus buffer
  'usdc.e': '0.003', // Bridged USDC requirement (0.002468) plus buffer
  beta: '0.002', // BETA requirement (0.001234567890123456) plus buffer
};

interface BalanceCheckResult {
  tokenName: string;
  required: string;
  actual: string;
  sufficient: boolean;
  context: 'Cadence' | 'EVM';
}

const getTokenBalance = async (page, tokenName: string): Promise<string> => {
  try {
    await page.getByRole('tab', { name: 'coins' }).click();

    // Wait for the specific balance element to be visible to avoid race conditions
    const balanceElement = page.getByTestId(`coin-balance-${tokenName.toLowerCase()}`);
    await balanceElement.waitFor({ state: 'visible', timeout: 15000 }); // Increased timeout

    const balanceText = await balanceElement.textContent();

    // Extract just the number from the balance text
    const balance = balanceText?.match(/[\d.]+/)?.[0];
    if (balance === undefined) {
      console.warn(`Could not parse balance for ${tokenName}. Text was: "${balanceText}"`);
      return 'Error';
    }
    return balance;
  } catch (error) {
    console.error(`Error getting balance for ${tokenName}:`, error);
    return 'Error'; // Return 'Error' or similar to indicate failure
  }
};

// Returns the check result instead of asserting directly
const checkTokenBalance = (
  tokenName: string,
  actualBalance: string,
  requiredBalance: string,
  context: 'Cadence' | 'EVM'
): BalanceCheckResult => {
  let sufficient = false;
  let actual = new BN(0); // Default to 0 if actualBalance is 'Error' or invalid

  if (actualBalance !== 'Error' && !isNaN(Number(actualBalance))) {
    actual = new BN(actualBalance);
    const required = new BN(requiredBalance);
    sufficient = actual.gte(required);
  } else {
    console.warn(`Actual balance for ${tokenName} (${context}) is invalid: "${actualBalance}"`);
  }

  return {
    tokenName,
    required: requiredBalance,
    actual: actualBalance, // Keep original string for reporting, even if 'Error'
    sufficient,
    context,
  };
};

// Helper to run checks for a specific context (Cadence or EVM)
const runBalanceChecks = async (
  page,
  requiredBalances: Record<string, string>,
  context: 'Cadence' | 'EVM'
): Promise<BalanceCheckResult[]> => {
  const results: BalanceCheckResult[] = [];
  for (const [tokenName, requiredBalance] of Object.entries(requiredBalances)) {
    const balance = await getTokenBalance(page, tokenName);
    const result = checkTokenBalance(tokenName, balance, requiredBalance, context);
    results.push(result);
  }
  return results;
};

// Helper to format and log results, and return overall sufficiency
const reportAndCheckOverallSufficiency = (
  testInfo: ReturnType<typeof test.info>,
  results: BalanceCheckResult[],
  nickname: string,
  address: string
): boolean => {
  const tableData = [
    ['Context', 'Token', 'Required', 'Actual', 'Sufficient'],
    ...results.map((r) => [
      r.context,
      r.tokenName,
      r.required,
      r.actual,
      r.sufficient ? '✅' : '❌',
    ]),
  ];

  // Format the table as a string for attachment
  const reportTitle = `Balance Check Report for ${nickname} (${address})`;
  const reportContent = table(tableData);
  const fullReport = `${reportTitle}\n\n${reportContent}`;

  // Attach the report to the Playwright test results
  testInfo.attach('balance-report', {
    body: fullReport,
    contentType: 'text/plain',
  });

  // Still log summary status to console for quick CI feedback
  console.log(`\n--- ${reportTitle} ---`);
  console.log(reportContent); // Keep console log for immediate feedback if needed

  const allSufficient = results.every((r) => r.sufficient);
  if (!allSufficient) {
    console.error(
      `--> Insufficient balances found for ${nickname} (${address}). Check attached report.`
    );
  } else {
    console.log(`--> All balances sufficient for ${nickname} (${address}).`);
  }
  console.log(`--------------------------------------------------------\n`);

  return allSufficient;
};

test('Verify sufficient token balances for sender account', async ({ page, extensionId }) => {
  test.slow();
  const nickname = process.env.TEST_SENDER_NICKNAME || 'Sender';
  const address = process.env.TEST_SENDER_ADDR || 'Unknown Address';
  const evmAddress = process.env.TEST_SENDER_EVM_ADDR || 'Unknown EVM Address';
  console.log(`Starting balance check for Sender: ${nickname} (${address})`);

  // Login to sender account
  await loginToSenderAccount({ page, extensionId });

  let allResults: BalanceCheckResult[] = [];

  // Check Cadence wallet balances
  console.log('Checking Cadence balances...');
  const cadenceResults = await runBalanceChecks(page, REQUIRED_BALANCES_CADENCE, 'Cadence');
  allResults = allResults.concat(cadenceResults);

  // Switch to EVM wallet and check balances
  console.log('Switching to EVM and checking balances...');
  await switchToEvmAddress({ page, address: evmAddress });
  const evmResults = await runBalanceChecks(page, REQUIRED_BALANCES_EVM, 'EVM');
  allResults = allResults.concat(evmResults);

  // Report results and check overall sufficiency
  const overallSufficient = reportAndCheckOverallSufficiency(
    test.info(),
    allResults,
    nickname,
    address
  );

  // Assert based on the overall result
  expect(
    overallSufficient,
    `One or more token balances are insufficient for ${nickname} (${address}). See attached report.`
  ).toBeTruthy();

  console.log(`Sender (${nickname}) balance verification complete.`);
});

test('Verify sufficient token balances for receiver account', async ({ page, extensionId }) => {
  const nickname = process.env.TEST_RECEIVER_NICKNAME || 'Receiver';
  const address = process.env.TEST_RECEIVER_ADDR || 'Unknown Address';
  const evmAddress = process.env.TEST_RECEIVER_EVM_ADDR || 'Unknown EVM Address';
  console.log(`Starting balance check for Receiver: ${nickname} (${address})`);

  // Login to receiver account
  await loginToReceiverAccount({ page, extensionId });

  let allResults: BalanceCheckResult[] = [];

  // Check Cadence wallet balances
  console.log('Checking Cadence balances...');
  const cadenceResults = await runBalanceChecks(page, REQUIRED_BALANCES_CADENCE, 'Cadence');
  allResults = allResults.concat(cadenceResults);

  // Switch to EVM wallet and check balances
  console.log('Switching to EVM and checking balances...');
  await switchToEvmAddress({ page, address: evmAddress });
  const evmResults = await runBalanceChecks(page, REQUIRED_BALANCES_EVM, 'EVM');
  allResults = allResults.concat(evmResults);

  // Report results and check overall sufficiency
  const overallSufficient = reportAndCheckOverallSufficiency(
    test.info(),
    allResults,
    nickname,
    address
  );

  // Assert based on the overall result
  expect(
    overallSufficient,
    `One or more token balances are insufficient for ${nickname} (${address}). See attached report.`
  ).toBeTruthy();

  console.log(`Receiver (${nickname}) balance verification complete.`);
});
