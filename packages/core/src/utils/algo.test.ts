import { expect, test } from 'vitest';

import { getStringFromHashAlgo } from './algo';

test('getAlgoName', () => {
  expect(getStringFromHashAlgo(1)).toBe('SHA2_256');
});
