// TODO: remove this function. It's called from CoinList and Wallet
/**
 * @deprecated
 */
export const formatLargeNumber = (num) => {
  if (typeof num === 'string' && num.startsWith('$')) {
    num = num.slice(1);
  }

  if (num >= 1e12) {
    return (num / 1e12).toFixed(3) + 'T'; // Trillions
  } else if (num >= 1e9) {
    return (num / 1e9).toFixed(3) + 'B'; // Billions
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(3) + 'M'; // Millions
  } else {
    return num.toString(); // Less than 1M, return as-is
  }
};

// TODO: remove this function. It's called from TokenInfoCard.tsx
export const addDotSeparators = (num) => {
  // replace with http://numeraljs.com/ if more requirements
  const [integerPart, decimalPart] = parseFloat(num).toFixed(8).split('.');

  // Format the integer part with comma separators
  const newIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const trimmedDecimal = decimalPart.replace(/0+$/, '');
  const formattedDecimal = trimmedDecimal.length > 0 ? trimmedDecimal : decimalPart.slice(-3);

  return `${newIntegerPart}.${formattedDecimal}`;
};

/**
 * Trims the decimal part of an amount to the given max decimal places
 * @param value - The amount to trim
 * @param decimals - The maximum number of decimal places
 * @param mode - Whether the user is in the process of entering the amount (entering),
 *              should we clean the amount (clean), or should we return the exact decimal places (exact)
 *              Always rounds down to the nearest decimal place
 */
export const trimDecimalAmount = (
  value: string,
  decimals: number,
  mode: 'entering' | 'clean' | 'exact',
  roundingMode: 'down' | 'up' | 'nearest' = 'down'
) => {
  // Remove minus signs and non-digit/non-decimal characters
  const cleanValue = value.replace(/[^\d.]/g, '');

  // Find the first decimal point and ignore everything after a second one
  const firstDecimalIndex = cleanValue.indexOf('.');
  let trimmedValue = '';
  if (firstDecimalIndex !== -1) {
    const beforeDecimal = cleanValue.slice(0, firstDecimalIndex).replace(/^0+/, '');
    const afterDecimalParts = cleanValue.slice(firstDecimalIndex + 1).split('.');
    const afterDecimal = afterDecimalParts.length > 0 ? afterDecimalParts[0] : '';

    // Handle integer part
    const integerPart = beforeDecimal === '' ? '0' : beforeDecimal;

    // Handle decimal part
    const trimmedDecimal = afterDecimal.slice(0, decimals);

    trimmedValue = trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : `${integerPart}.`;
  } else {
    // No decimal point case
    trimmedValue =
      cleanValue === '' ? '' : cleanValue === '0' ? '0' : cleanValue.replace(/^0+/, '');
  }

  if (mode === 'entering') {
    // Return the value as is
    return trimmedValue;
  }

  // Are we displaying or passing the value to a function. i.e. clean up trailing zeros
  if (mode === 'clean') {
    // If the value is an empty string, return '0.0'
    if (trimmedValue === '') {
      return '0.0';
    }
    // The user is not in the process of entering the amount, clean the amount to remove trailing zeros
    if (trimmedValue.includes('.')) {
      const [integerPart, decimalPart] = trimmedValue.split('.');
      if (!decimalPart) {
        return `${integerPart}.0`;
      }

      const trimmedDecimal = decimalPart.replace(/0+$/, '');
      trimmedValue = trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : `${integerPart}.0`;
    } else {
      // No decimal point, add one
      trimmedValue = `${trimmedValue}.0`;
    }

    return trimmedValue;
  }

  // Do we want to show the exact number of decimal places?
  if (mode === 'exact') {
    // We want an exact number of decimal places

    const splitValue = trimmedValue.split('.');
    const integerPart = splitValue[0] === '' ? '0' : splitValue[0];

    const decimalPart = splitValue.length > 1 ? splitValue[1] : '';
    if (decimals <= 0) {
      trimmedValue = integerPart;
    } else if (decimalPart.length > decimals) {
      // We need to round down to the nearest decimal place
      const roundedDecimal = decimalPart.slice(0, decimals);
      trimmedValue = `${integerPart}.${roundedDecimal}`;
    } else {
      // We need to pad the decimal part with zeros
      const paddedDecimal = decimalPart.padEnd(decimals, '0');
      trimmedValue = `${integerPart}.${paddedDecimal}`;
    }
  }

  return trimmedValue;
};

// Validate that a string is a valid transaction amount with the given max decimal places
// Unless maxDecimals is zero, a decimal point is required, default is 0 just in case caller doesn't know
// If exact is true, the amount must have exactly maxDecimals decimal places
export const validateAmount = (amount: string, maxDecimals: number = 0, exact = false): boolean => {
  const regex =
    maxDecimals === 0
      ? `^(0|[1-9]\\d*)$`
      : exact
        ? `^(0|[1-9]\\d*)\\.\\d{${maxDecimals}}$`
        : `^(0|[1-9]\\d*)\\.\\d{1,${maxDecimals}}$`;

  return new RegExp(regex).test(amount);
};

export const convertToIntegerAmount = (amount: string, decimals: number): string => {
  // Check if the amount is valid
  if (!validateAmount(amount, decimals)) {
    throw new Error(
      `Invalid amount or decimal places - amount: \'${amount}\', decimals: ${decimals}`
    );
  }

  // Create an integer string based on the required token decimals
  const parts = amount.split('.');
  const hasDecimal = parts.length > 1;
  const integerPart = parts[0];
  const decimalPart = hasDecimal ? parts[1] : '';
  // Pad the decimal part with zeros
  const paddedDecimal = decimalPart.padEnd(decimals, '0');
  // Remove leading zeros
  return `${integerPart}${paddedDecimal}`.replace(/^0+/, '') || '0';
};

export const numberWithCommas = (x: string) => {
  // Split string into integer and decimal parts (if any)
  const parts = x.split('.');
  const integerPart = parts[0];

  // Only add commas if the integer part is between 4 and 6 digits
  if (integerPart.length >= 4 && integerPart.length <= 6) {
    // Add commas every 3 digits from the right
    const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // Reconstruct number with decimal part if it exists
    return parts.length > 1 ? `${withCommas}.${parts[1]}` : withCommas;
  }

  return x;
};

export const convertFlowBalanceToString = (balance: number): string => {
  // Convert from a 10^8 number to a string with 8 decimal places
  return `${Math.floor(balance / 1e8).toString()}.${(balance % 1e8).toString().padStart(8, '0')}`;
};
