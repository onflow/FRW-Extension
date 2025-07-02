import { fn } from 'storybook/test';

import * as actual from './user-data-access';

export const getUserData = fn(actual.getUserData).mockName('getUserData');

export const addUserDataListener = fn(actual.addUserDataListener).mockName('addUserDataListener');
export const removeUserDataListener = fn(actual.removeUserDataListener).mockName(
  'removeUserDataListener'
);
