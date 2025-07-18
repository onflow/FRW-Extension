import { describe, it, expect } from 'vitest';

import { isChromeOnly } from '../browser';

describe('detect is chrome browser', () => {
  it('should return false for chromium browser', () => {
    const detectedBrowsers = {
      Brave: true,
      Opera: false,
      Edge: false,
      Chrome: true,
      Firefox: false,
      Safari: false,
      Chromium: false,
      Arc: false,
    };
    const result = isChromeOnly(detectedBrowsers);
    expect(result).toBe(false);
  });
  it('should return false for non-chrome browser', () => {
    const detectedBrowsers = {
      Brave: false,
      Opera: true,
      Edge: false,
      Chrome: false,
      Firefox: false,
      Safari: false,
      Chromium: false,
      Arc: false,
    };
    const result = isChromeOnly(detectedBrowsers);
    expect(result).toBe(false);
  });
  it('should return true for chrome browser', () => {
    const detectedBrowsers = {
      Brave: false,
      Opera: false,
      Edge: false,
      Chrome: true,
      Firefox: false,
      Safari: false,
      Chromium: false,
      Arc: false,
    };
    const result = isChromeOnly(detectedBrowsers);
    expect(result).toBe(true);
  });
});
