import { stripSensitive } from './strip-sensitive';

const DEPLOYMENT_ENV = process.env.DEPLOYMENT_ENV;
const IS_BETA = process.env.IS_BETA === 'true';
const IS_PROD = process.env.NODE_ENV === 'production' || DEPLOYMENT_ENV === 'production' || IS_BETA;

const extensionId =
  chrome?.runtime?.id || IS_BETA
    ? 'lpgbokkinafiehohpkiccnlncmeonkfc'
    : DEPLOYMENT_ENV === 'production'
      ? 'hpclkefagolihohboafpheddmmgdffjm'
      : 'cfiagdgiikmjgfjnlballglniejjgegi';

// Get the formatted stack trace
const getFormattedStackTrace = () => {
  const error = new Error();
  if (!error?.stack) {
    return "can't get stack trace";
  }

  const stack = error.stack
    .split('\n')
    .slice(2) // Remove the Error creation line and the getFormattedStackTrace function call
    .map((line) => line.trim())
    .join('\n');

  return stack;
};

export type ConsoleMessageType =
  | 'console_log'
  | 'console_info'
  | 'console_error'
  | 'console_warn'
  | 'console_debug'
  | 'console_trace';

export const trackConsole = (type: ConsoleMessageType, message: string, code: number = 0) => {
  const sanitizedMessage = stripSensitive(message);
  try {
    chrome?.runtime?.sendMessage(extensionId, {
      type,
      message: sanitizedMessage,
      stack: getFormattedStackTrace(),
      code,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Could not track console error', error);
  }
};

const _consoleLog = (...args: unknown[]) => {
  trackConsole('console_log', ` ${args.join(' ')}`);
};

const _consoleInfo = (...args: unknown[]) => {
  trackConsole('console_info', ` ${args.join(' ')}`);
};

const _consoleError = (...args: unknown[]) => {
  const stringArgs = args.map((arg) => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg);
    }
    return arg?.toString() || 'undefined';
  });

  const sanitizedMessage = stripSensitive(stringArgs.join(' '));
  // eslint-disable-next-line no-console
  console.error(sanitizedMessage);
  try {
    trackConsole('console_error', sanitizedMessage);
  } catch {
    // ignore
    // eslint-disable-next-line no-console
    console.error('Could not track console error');
  }
};

const _consoleWarn = (...args: unknown[]) => {
  trackConsole('console_warn', ` ${args.join(' ')}`);
};

const _consoleDebug = (...args: unknown[]) => {
  trackConsole('console_debug', ` ${args.join(' ')}`);
};

const _consoleTrace = (...args: unknown[]) => {
  trackConsole('console_trace', ` ${args.join(' ')}`);
};

// Export the original console functions if not in production
export const consoleLog = IS_PROD ? _consoleLog : console.log; // eslint-disable-line no-console
export const consoleInfo = IS_PROD ? _consoleInfo : console.info; // eslint-disable-line no-console
export const consoleError = IS_PROD ? _consoleError : console.error; // eslint-disable-line no-console
export const consoleWarn = IS_PROD ? _consoleWarn : console.warn; // eslint-disable-line no-console
export const consoleDebug = IS_PROD ? _consoleDebug : console.debug; // eslint-disable-line no-console
export const consoleTrace = IS_PROD ? _consoleTrace : console.trace; // eslint-disable-line no-console
