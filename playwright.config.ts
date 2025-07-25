import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.dev', '.env.pro', '.env.test'] });

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Use 2 workers for parallel execution. */
  workers: 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['list'], // Default reporter for CI console output
        ['html', { open: 'never', outputFolder: 'playwright-report' }], // Generate HTML report on CI
        ['github'], // Optional: if you still want GitHub Actions annotations
      ]
    : [['list'], ['html', { open: 'on-failure', outputFolder: 'playwright-report' }]], // Use list and html locally, open html on failure
  /* Stop after the first test failure */
  maxFailures: process.env.CI ? 1 : 0,

  // set the timeout for each test to 90 seconds. We're sending transactions and waiting for them to be confirmed.
  timeout: 90_000,

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    ...devices['Desktop Chrome'],

    trace: 'retain-on-failure', // Collect trace for failed tests
    video: 'retain-on-failure', // Record video for failed tests
    screenshot: 'only-on-failure', // Take screenshot only on failure

    browserName: 'chromium',
    channel: 'chromium',
  },
  // globalTimeout: 160 * 1000,
  //globalSetup: './e2e/utils/global.setup.ts',
  //globalTeardown: './e2e/utils/global.teardown.ts',
  // timeout: 3_600_000,
  /* Configure projects for major browsers */
  projects: [
    // registration
    {
      name: 'registration-setup',
      testMatch: /.*registration\.setup\.ts/,
      teardown: 'registration-teardown',
      fullyParallel: false,
    },
    {
      name: 'registration-test',
      testMatch: /registration\/.*\.test\.ts/,
      dependencies: ['registration-setup'],
      fullyParallel: false,
    },
    {
      name: 'registration-teardown',
      testMatch: /.*registration\.teardown\.ts/,
      fullyParallel: false,
    },

    // transaction
    {
      name: 'transaction-setup',
      testMatch: /.*transaction\.setup\.ts/,
      teardown: 'transaction-teardown',
      fullyParallel: false,
    },
    {
      name: 'transaction-test',
      testMatch: /transaction\/.*transaction\.test\.ts/,
      dependencies: ['transaction-setup'],
      fullyParallel: false,
    },
    {
      name: 'transaction-teardown',
      testMatch: /.*transaction\.teardown\.ts/,
      fullyParallel: false,
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
