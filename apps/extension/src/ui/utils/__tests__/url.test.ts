import { describe, it, expect } from 'vitest';

import { obj2query } from '../url';

describe('obj2query', () => {
  it('should convert hex to decimal', () => {
    expect(obj2query({ a: '1', b: '2' })).toBe('a=1&b=2');
  });
});
