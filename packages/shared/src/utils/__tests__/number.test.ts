import { describe, it, expect } from 'vitest';

import {
  formatLargeNumber,
  addDotSeparators,
  trimDecimalAmount,
  validateAmount,
  convertToIntegerAmount,
} from '../number';

describe('formatLargeNumber', () => {
  it('should format numbers into human readable format', () => {
    expect(formatLargeNumber(1500000)).toBe('1.500M');
    expect(formatLargeNumber(2500000000)).toBe('2.500B');
    expect(formatLargeNumber(1500000000000)).toBe('1.500T');
  });

  it('should handle numbers less than 1M', () => {
    expect(formatLargeNumber(999999)).toBe('999999');
  });

  it('should handle string numbers with $ prefix', () => {
    expect(formatLargeNumber('$1500000')).toBe('1.500M');
  });
});

describe('addDotSeparators', () => {
  it('should format numbers with proper separators', () => {
    expect(addDotSeparators('1234567.89')).toBe('1,234,567.89');
  });

  it('should handle trailing zeros', () => {
    expect(addDotSeparators('1234.50000000')).toBe('1,234.5');
  });

  it('should preserve at least some decimal places', () => {
    expect(addDotSeparators('1234.00000000')).toBe('1,234.000');
  });
});

describe('trimDecimalAmount', () => {
  it('should handle real-time input correctly', () => {
    // Basic cases
    expect(trimDecimalAmount('123', 2, 'entering')).toBe('123');
    expect(trimDecimalAmount('123.', 2, 'entering')).toBe('123.');
    expect(trimDecimalAmount('123.4', 2, 'entering')).toBe('123.4');

    // Multiple decimal points
    expect(trimDecimalAmount('12..34.56', 2, 'entering')).toBe('12.');
    expect(trimDecimalAmount('12.34.56', 2, 'entering')).toBe('12.34');

    // Leading zeros
    expect(trimDecimalAmount('000123', 2, 'entering')).toBe('123');
    expect(trimDecimalAmount('0', 2, 'entering')).toBe('0');
    expect(trimDecimalAmount('00.123', 2, 'entering')).toBe('0.12');

    // Decimal cases
    expect(trimDecimalAmount('.123', 2, 'entering')).toBe('0.12');
    expect(trimDecimalAmount('.', 2, 'entering')).toBe('0.');
    expect(trimDecimalAmount('', 2, 'entering')).toBe('');
  });
});

describe('trimDecimalAmount clean', () => {
  it('should handle empty and invalid inputs', () => {
    expect(trimDecimalAmount('', 2, 'clean')).toBe('0.0');
    expect(trimDecimalAmount('   ', 2, 'clean')).toBe('0.0');
    expect(trimDecimalAmount('.', 2, 'clean')).toBe('0.0');
    expect(trimDecimalAmount('..', 2, 'clean')).toBe('0.0');
  });

  it('should format final amounts correctly', () => {
    // Basic cases
    expect(trimDecimalAmount('123', 2, 'clean')).toBe('123.0');
    expect(trimDecimalAmount('123.', 2, 'clean')).toBe('123.0');
    expect(trimDecimalAmount('123.4', 2, 'clean')).toBe('123.4');
    expect(trimDecimalAmount('123.40', 2, 'clean')).toBe('123.4');
    // Removes extra zeros even when truncating
    expect(trimDecimalAmount('123.401', 2, 'clean')).toBe('123.4');
    expect(trimDecimalAmount('123.471', 2, 'clean')).toBe('123.47');
    // Truncates doesn't round up
    expect(trimDecimalAmount('123.479', 2, 'clean')).toBe('123.47');

    // Multiple decimal points
    expect(trimDecimalAmount('12..34.56', 2, 'clean')).toBe('12.0');
    expect(trimDecimalAmount('12.34.56', 2, 'clean')).toBe('12.34');

    // Leading zeros
    expect(trimDecimalAmount('000123', 2, 'clean')).toBe('123.0');
    expect(trimDecimalAmount('0', 2, 'clean')).toBe('0.0');
    expect(trimDecimalAmount('00.123', 2, 'clean')).toBe('0.12');

    // Decimal cases
    expect(trimDecimalAmount('.123', 2, 'clean')).toBe('0.12');
    expect(trimDecimalAmount('.', 2, 'clean')).toBe('0.0');
    expect(trimDecimalAmount('', 2, 'clean')).toBe('0.0');
    // Handle getting rid of trailing zeros
    expect(trimDecimalAmount('123.000', 2, 'clean')).toBe('123.0');
  });
});

describe('validateAmount', () => {
  describe('with exact=false (default)', () => {
    it('should validate whole numbers', () => {
      expect(validateAmount('123.0', 2)).toBe(true);
      expect(validateAmount('0.0', 2)).toBe(true);
      expect(validateAmount('1000000.0', 2)).toBe(true);
    });

    it('should validate numbers with decimals up to maxDecimals', () => {
      expect(validateAmount('123.45', 2)).toBe(true);
      expect(validateAmount('123.4', 2)).toBe(true);
      expect(validateAmount('0.45', 2)).toBe(true);
    });

    it('should reject numbers with more decimals than maxDecimals', () => {
      expect(validateAmount('123.456', 2)).toBe(false);
      expect(validateAmount('0.123', 2)).toBe(false);
    });

    it('should reject invalid number formats', () => {
      expect(validateAmount('123..45', 2)).toBe(false);
      expect(validateAmount('123.', 2)).toBe(false);
      expect(validateAmount('.123', 2)).toBe(false);
      expect(validateAmount('abc', 2)).toBe(false);
      expect(validateAmount('12.34.56', 2)).toBe(false);
      expect(validateAmount('-123.45', 2)).toBe(false);
      expect(validateAmount('+123.45', 2)).toBe(false);
      expect(validateAmount('123', 2)).toBe(false);
      expect(validateAmount('0', 2)).toBe(false);
    });
  });

  describe('with exact=true', () => {
    it('should validate numbers with exactly maxDecimals decimal places', () => {
      expect(validateAmount('123.45', 2, true)).toBe(true);
      expect(validateAmount('0.45', 2, true)).toBe(true);
    });

    it('should reject numbers with fewer decimals than maxDecimals', () => {
      expect(validateAmount('123.4', 2, true)).toBe(false);
      expect(validateAmount('123.0', 2, true)).toBe(false);
      expect(validateAmount('123', 2, true)).toBe(false);
    });

    it('should reject numbers with more decimals than maxDecimals', () => {
      expect(validateAmount('123.456', 2, true)).toBe(false);
    });

    it('should reject invalid number formats', () => {
      expect(validateAmount('123..45', 2, true)).toBe(false);
      expect(validateAmount('123.', 2, true)).toBe(false);
      expect(validateAmount('.123', 2, true)).toBe(false);
      expect(validateAmount('abc', 2, true)).toBe(false);
      expect(validateAmount('12.34.56', 2, true)).toBe(false);
      expect(validateAmount('-123.45', 2, true)).toBe(false);
      expect(validateAmount('+123.45', 2, true)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle zero maxDecimals', () => {
      expect(validateAmount('123', 0)).toBe(true);
      expect(validateAmount('123.0', 0)).toBe(false);
      expect(validateAmount('123.', 0)).toBe(false);
    });

    it('should handle large maxDecimals', () => {
      expect(validateAmount('123.123456789', 9)).toBe(true);
      expect(validateAmount('123.1234567890', 9)).toBe(false);
    });

    it('should handle leading zeros', () => {
      expect(validateAmount('00123.45', 2)).toBe(false);
      expect(validateAmount('0123.45', 2)).toBe(false);
    });

    it('should handle trailing zeros', () => {
      expect(validateAmount('123.450', 2)).toBe(false);
      expect(validateAmount('123.4500', 2)).toBe(false);
    });
  });
});

describe('convertToIntegerAmount', () => {
  it('should convert decimal amounts to integer amounts with correct padding', () => {
    expect(convertToIntegerAmount('123.45', 4)).toBe('1234500');
    expect(convertToIntegerAmount('0.1', 8)).toBe('10000000');
    expect(convertToIntegerAmount('1000.5', 6)).toBe('1000500000');
  });

  it('should handle whole numbers', () => {
    expect(convertToIntegerAmount('123.0', 2)).toBe('12300');
    expect(convertToIntegerAmount('1000.0', 4)).toBe('10000000');
    expect(convertToIntegerAmount('0.0', 6)).toBe('0');
  });

  it('should handle amounts with exact decimal places', () => {
    expect(convertToIntegerAmount('123.4567', 4)).toBe('1234567');
    expect(convertToIntegerAmount('0.12345678', 8)).toBe('12345678');
  });

  it('should throw error for invalid amounts', () => {
    expect(() => convertToIntegerAmount('123.456', 2)).toThrow('Invalid amount or decimal places');
    expect(() => convertToIntegerAmount('abc', 2)).toThrow('Invalid amount or decimal places');
    expect(() => convertToIntegerAmount('123..45', 2)).toThrow('Invalid amount or decimal places');
    expect(() => convertToIntegerAmount('-123.45', 2)).toThrow('Invalid amount or decimal places');
    expect(() => convertToIntegerAmount('123', 2)).toThrow('Invalid amount or decimal places');
  });

  it('should handle zero amounts with different decimal places', () => {
    expect(convertToIntegerAmount('0.0', 4)).toBe('0');
    expect(convertToIntegerAmount('0.00', 4)).toBe('0');
    expect(convertToIntegerAmount('0.0', 8)).toBe('0');
  });

  it('should handle amounts with trailing zeros', () => {
    expect(convertToIntegerAmount('123.4000', 6)).toBe('123400000');
    expect(convertToIntegerAmount('100.00', 4)).toBe('1000000');
  });
});
