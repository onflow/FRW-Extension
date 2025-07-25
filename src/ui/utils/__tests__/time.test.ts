import { describe, it, expect } from 'vitest';

import { formatSeconds, timeago } from '../time';

describe('formatSeconds', () => {
  it('should format seconds less than 60', () => {
    expect(formatSeconds(45)).toBe('45 sec');
    expect(formatSeconds(1)).toBe('1 sec');
  });

  it('should format seconds into minutes and seconds', () => {
    expect(formatSeconds(65)).toBe('1 min 5 sec');
    expect(formatSeconds(120)).toBe('2 min');
    expect(formatSeconds(150)).toBe('2 min 30 sec');
  });

  it('should handle edge cases', () => {
    expect(formatSeconds(0)).toBe('0 sec');
    expect(formatSeconds(60)).toBe('1 min');
  });
});

describe('timeago', () => {
  it('should calculate time difference correctly', () => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const result = timeago(now, fiveMinutesAgo);

    expect(result).toEqual({
      hour: 0,
      minute: 5,
      second: 0,
    });
  });

  it('should handle hour differences', () => {
    const now = Date.now();
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;
    const result = timeago(now, twoHoursAgo);

    expect(result).toEqual({
      hour: 2,
      minute: 0,
      second: 0,
    });
  });

  it('should handle complex time differences', () => {
    const now = Date.now();
    const timeInPast = now - (2 * 60 * 60 * 1000 + 30 * 60 * 1000 + 15 * 1000);
    const result = timeago(now, timeInPast);

    expect(result).toEqual({
      hour: 2,
      minute: 30,
      second: 15,
    });
  });

  it('should work regardless of argument order', () => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const result1 = timeago(now, fiveMinutesAgo);
    const result2 = timeago(fiveMinutesAgo, now);

    expect(result1).toEqual(result2);
  });
});
