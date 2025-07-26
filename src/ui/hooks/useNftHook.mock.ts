import { fn } from 'storybook/test';

import * as actual from './useNftHook';

// These are the mock function instances, exported with the names the component expects.
export const useCadenceNftCollectionsAndIds = fn(actual.useCadenceNftCollectionsAndIds).mockName(
  'useCadenceNftCollectionsAndIds'
);
export const useFullCadenceNftCollectionList = fn(actual.useFullCadenceNftCollectionList).mockName(
  'useFullCadenceNftCollectionList'
);
export const useChildAccountNfts = fn(actual.useChildAccountNfts).mockName('useChildAccountNfts');
