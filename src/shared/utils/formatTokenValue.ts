import BigNumber from 'bignumber.js';

import { numberWithCommas } from './number';

interface TokenValueParts {
  leadingPart: string;
  zeroPart: number | null;
  endingPart: string | null;
}

interface FormattedTokenValue {
  decimalValueString: string;
  formattedTokenValue: TokenValueParts;
}
export const formatDecimalAmount = (
  value: string,
  decimals: number,
  roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_DOWN
) => {
  return BigNumber(value).toFixed(decimals, roundingMode);
};
/**
 * Converts scientific notation to decimal string
 * @param numStr - Number in scientific notation (e.g., "1e-7")
 * @returns Decimal string (e.g., "0.0000001")
 */
function scientificToDecimal(numStr: string): string {
  // Convert string to number to handle scientific notation
  const num = Number(numStr);

  // Check if the number is in scientific notation
  if (Math.abs(num) < 1e-6 || /e/i.test(numStr)) {
    // Convert to decimal string without scientific notation
    const str = num.toFixed(20);
    // Remove trailing zeros after decimal point
    return str.replace(/\.?0+$/, '');
  }

  return numStr;
}

/**
 * Condenses a token value or price to a more readable format ensuring that non zero numbers are not displayed as zero
 * @param valueString - The price string to format.
 * @param zeroCondenseThreshold - The number of zeros to condense. example: 4 would condense 0.0000123 to 0.0(3)12.
 * First zero after decimal point is maintained for readability.
 * @param maxSignificantDecimals - The number of decimals to display.
 * If -1, the number of decimals is determined by the number of significant digits.
 * Otherwise, it works like this:
 * If the number of decimals is <= maxSignificantDecimals, the number of decimals is the number of decimals.
 * If the number of decimals is >= maxSignificantDecimals, but there are less zeros than zeroCondenseThreshold, then at least one significant digit is displayed.
 * If the number of decimals is >= maxSignificantDecimals or zeroCondenseThreshold, then the number is zero condensed and 2 significant digits are displayed.
 * Trailing zeros are removed.
 * @param roundingMode - The rounding mode to use.
 * @returns The formatted price.
 */
export function formatTokenValueOrPrice(
  valueString: string,
  zeroCondenseThreshold = 4, // 0.0000123 -> 0.0(3)12
  maxSignificantDecimals = -1, // 0.123 -> 0.12
  roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP
): FormattedTokenValue {
  // Handle empty or invalid input
  if (!valueString || valueString === '0') {
    return {
      decimalValueString: valueString,
      formattedTokenValue: {
        leadingPart: '',
        zeroPart: null,
        endingPart: null,
      },
    };
  }
  const numToString = (num: BigNumber) => {
    if (maxSignificantDecimals === -1) {
      return num.toFixed();
    }
    return num.decimalPlaces(maxSignificantDecimals, roundingMode).toFixed();
  };

  // Convert scientific notation to decimal string otherwise return the original string
  const decimalStr = scientificToDecimal(valueString);
  // Handle numbers >= 1
  if (!decimalStr.startsWith('0.')) {
    const bigNum = new BigNumber(decimalStr);
    // Check how big it is
    let roundedDecimalStr = '';
    if (bigNum.gt(1e12)) {
      roundedDecimalStr = numToString(bigNum.dividedBy(1e12)) + 'T';
    } else if (bigNum.gt(1e9)) {
      roundedDecimalStr = numToString(bigNum.dividedBy(1e9)) + 'B';
    } else if (bigNum.gt(1e6)) {
      roundedDecimalStr = numToString(bigNum.dividedBy(1e6)) + 'M';
    } else {
      roundedDecimalStr = numToString(bigNum);
    }

    // This is not a small number that needs to be zero condensed

    return {
      decimalValueString: decimalStr,
      formattedTokenValue: {
        leadingPart: roundedDecimalStr,
        zeroPart: null,
        endingPart: null,
      },
    };
  }

  // Count zeros after decimal point
  let zeroCount = 0;
  let firstNonZeroIndex = 2; // Start after "0."

  while (decimalStr[firstNonZeroIndex] === '0' && firstNonZeroIndex < decimalStr.length) {
    zeroCount++;
    firstNonZeroIndex++;
  }
  // 0.01 => 0.01
  // 0.00
  // Note if displayDecimals is -1, we will use the minimum number of decimal places to display up to 2 significant digits
  const roundedDecimalStr = BigNumber(decimalStr).toFixed(
    Math.max(Math.min(zeroCount + 2, decimalStr.length - 2), maxSignificantDecimals),
    roundingMode
  );

  // If we don't have enough zeros to meet threshold, return formatted number
  if (zeroCount < zeroCondenseThreshold) {
    return {
      decimalValueString: decimalStr,
      formattedTokenValue: {
        leadingPart:
          roundedDecimalStr.endsWith('0') && zeroCount >= maxSignificantDecimals
            ? roundedDecimalStr.slice(0, -1)
            : roundedDecimalStr,
        zeroPart: null,
        endingPart: null,
      },
    };
  }

  // Break up the price into parts for condensed format

  const significantDigits = roundedDecimalStr.slice(firstNonZeroIndex, firstNonZeroIndex + 2);
  return {
    decimalValueString: decimalStr,
    formattedTokenValue: {
      leadingPart: '0.0',
      zeroPart: zeroCount,
      endingPart: significantDigits,
    },
  };
}
