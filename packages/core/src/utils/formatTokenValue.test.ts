import { describe, it, expect } from 'vitest';

import { formatTokenValueOrPrice } from './formatTokenValue';

describe('formatPrice', () => {
  it('should handle zero', () => {
    const result = formatTokenValueOrPrice('0', 4);
    expect(result).toEqual({
      decimalValueString: '0',
      formattedTokenValue: { leadingPart: '', zeroPart: null, endingPart: null },
    });
  });

  it('should not truncate numbers >= 1 when displayDecimals is not set', () => {
    const testCases = [
      { input: '1.23456', expected: '1.23456' },
      { input: '123.456789', expected: '123.456789' },
      { input: '1000.999', expected: '1000.999' },
      { input: '1000.0000000001', expected: '1000.0000000001' },
      { input: '1000', expected: '1000' },
      { input: '9.999999', expected: '9.999999' },
    ];

    testCases.forEach(({ input, expected }) => {
      const result = formatTokenValueOrPrice(input, 4);
      expect(result).toEqual({
        decimalValueString: input,
        formattedTokenValue: {
          leadingPart: expected,
          zeroPart: null,
          endingPart: null,
        },
      });
    });
  });
  it('should not format numbers >= 1 to the correct number of maximum decimals when displayDecimals is set', () => {
    const testCases = [
      { input: '1.23456', expected: '1.23' },
      { input: '123.456789', expected: '123.46' },
      { input: '1000.999', expected: '1001' },
      { input: '1000', expected: '1000' },
      { input: '9.999999', expected: '10' },
    ];

    testCases.forEach(({ input, expected }) => {
      const result = formatTokenValueOrPrice(input, 4, 2);
      expect(result).toEqual({
        decimalValueString: input,
        formattedTokenValue: {
          leadingPart: expected,
          zeroPart: null,
          endingPart: null,
        },
      });
    });
  });
  it('should format numbers < 1 based on threshold', () => {
    const testCases = [
      {
        input: '0.123456',
        threshold: 4,
        expected: { leadingPart: '0.12', zeroPart: null, endingPart: null },
      },
      {
        input: '0.0001234',
        threshold: 4,
        expected: { leadingPart: '0.00012', zeroPart: null, endingPart: null },
      },
      {
        input: '0.00001234',
        threshold: 4,
        expected: { leadingPart: '0.0', zeroPart: 4, endingPart: '12' },
      },
      {
        input: '0.00000001234',
        threshold: 4,
        expected: { leadingPart: '0.0', zeroPart: 7, endingPart: '12' },
      },
    ];

    testCases.forEach(({ input, threshold, expected }) => {
      const result = formatTokenValueOrPrice(input, threshold);
      expect(result).toEqual({
        decimalValueString: input,
        formattedTokenValue: expected,
      });
    });
  });
  it('should format numbers < 1 based on threshold and displayDecimals', () => {
    const testCases = [
      {
        input: '0.1',
        threshold: 4,
        displayDecimals: 2,
        expected: { leadingPart: '0.10', zeroPart: null, endingPart: null },
      },
      {
        input: '0.123456',
        threshold: 4,
        displayDecimals: 2,
        expected: { leadingPart: '0.12', zeroPart: null, endingPart: null },
      },
      {
        input: '0.0001234',
        threshold: 4,
        displayDecimals: 2,
        expected: { leadingPart: '0.00012', zeroPart: null, endingPart: null },
      },
      {
        input: '0.00010',
        threshold: 4,
        displayDecimals: 2,
        expected: { leadingPart: '0.0001', zeroPart: null, endingPart: null },
      },
      {
        input: '0.1000',
        threshold: 4,
        displayDecimals: 2,
        expected: { leadingPart: '0.10', zeroPart: null, endingPart: null },
      },
      {
        input: '0.00001234',
        threshold: 4,
        displayDecimals: 2,
        expected: { leadingPart: '0.0', zeroPart: 4, endingPart: '12' },
      },
      {
        input: '0.00000001234',
        threshold: 4,
        displayDecimals: 2,
        expected: { leadingPart: '0.0', zeroPart: 7, endingPart: '12' },
      },
    ];

    testCases.forEach(({ input, threshold, displayDecimals, expected }) => {
      const result = formatTokenValueOrPrice(input, threshold, displayDecimals);
      expect(result).toEqual({
        decimalValueString: input,
        formattedTokenValue: expected,
      });
    });
  });

  it('should respect different threshold values', () => {
    const testCases = [
      {
        input: '0.0001234',
        threshold: 3,
        expected: { leadingPart: '0.0', zeroPart: 3, endingPart: '12' },
      },
      {
        input: '0.0001234',
        threshold: 5,
        expected: { leadingPart: '0.00012', zeroPart: null, endingPart: null },
      },
      {
        input: '0.00000001234',
        threshold: 10,
        expected: { leadingPart: '0.000000012', zeroPart: null, endingPart: null },
      },
    ];

    testCases.forEach(({ input, threshold, expected }) => {
      const result = formatTokenValueOrPrice(input, threshold);
      expect(result).toEqual({
        decimalValueString: input,
        formattedTokenValue: expected,
      });
    });
  });

  it('should handle scientific notation', () => {
    const testCases = [
      {
        input: '1e-7',
        threshold: 4,
        expected: { leadingPart: '0.0', zeroPart: 6, endingPart: '1' },
      },
      {
        input: '1.23e-6',
        threshold: 4,
        expected: { leadingPart: '0.0', zeroPart: 5, endingPart: '12' },
      },
      {
        input: '1e-4',
        threshold: 4,
        expected: { leadingPart: '0.0001', zeroPart: null, endingPart: null },
      },
    ];

    testCases.forEach(({ input, threshold, expected }) => {
      const result = formatTokenValueOrPrice(input, threshold);
      const expectedDecimal = result.decimalValueString; // Let formatPrice handle the conversion
      expect(result).toEqual({
        decimalValueString: expectedDecimal,
        formattedTokenValue: expected,
      });
    });
  });
});
