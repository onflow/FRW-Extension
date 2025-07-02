import { FlowNetwork, MAINNET_NETWORK, TESTNET_NETWORK } from '../types/network-types';

/**
 * A set of cadence scripts
 * The key is the script name
 * The value is a hex encoded cadence script
 */
export type CadenceScripts = Record<string, string>;

/**
 * A collection of cadence scripts
 * The key is the category name
 * The value is a CadenceScripts object
 */
export type CategoryScripts = {
  [category: string]: CadenceScripts;
};

/**
 * A collection of cadence scripts
 * The key is the network name
 * The value is a CadenceCategoryScripts object
 */
export type NetworkScripts = {
  version: string;
  scripts: {
    mainnet: CategoryScripts;
    testnet: CategoryScripts;
  };
};
