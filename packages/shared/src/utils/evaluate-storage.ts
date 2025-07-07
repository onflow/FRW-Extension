import BigNumber from 'bignumber.js';

import type { AccountBalanceInfo } from '@/shared/types/network-types';

export type EvaluateStorageResult = {
  isStorageSufficient: boolean;
  isBalanceSufficient: boolean;
  isStorageSufficientAfterAction: boolean;
};
const MINIMUM_FLOW_BALANCE = 0.001;
const MINIMUM_STORAGE_BUFFER = 10000; // minimum required storage buffer (10,000 bytes)
const FIXED_MOVE_FEE = 0.0001;
const AVERAGE_TX_FEE = 0.0005;
const BYTES_PER_FLOW = 100 * 1024 * 1024; // 100 MB

export const evaluateStorage = (
  accountStorageInfo: AccountBalanceInfo,
  sendAmount?: string, // UFix64
  coin?: string,
  movingBetweenEVMAndFlow?: boolean,
  freeGas?: boolean,
  featureFlagTxWarningPrediction?: boolean
): EvaluateStorageResult => {
  // Get storage info from openapi service
  const remainingStorage = BigNumber(accountStorageInfo.storageCapacity).minus(
    BigNumber(accountStorageInfo.storageUsed)
  );
  const isStorageSufficient = remainingStorage.gte(MINIMUM_STORAGE_BUFFER);

  // Calculate the flow balance that is used by the storage calculation
  // I don't "love" this approach as it involves a division, but it
  // avoids having to figure out which flow balance is used by the storage calculation
  const flowBalanceAffectingStorage = BigNumber(accountStorageInfo.storageCapacity).div(
    BYTES_PER_FLOW
  );

  // Check if the flow balance is sufficient
  const isBalanceSufficient = flowBalanceAffectingStorage.gte(MINIMUM_FLOW_BALANCE);

  let isStorageSufficientAfterAction = true;

  // Check feature flag

  if (featureFlagTxWarningPrediction) {
    // The feature is enabled, so we need to check if there is enough storage after the action
    if (isStorageSufficient) {
      // Check if there is enough storage after the action
      if (sendAmount !== undefined) {
        // This is the amount of flow that will be used by the transaction
        const flowUsed = (coin === 'flow' ? BigNumber(sendAmount) : BigNumber(0))
          .plus(movingBetweenEVMAndFlow ? BigNumber(FIXED_MOVE_FEE) : BigNumber(0))
          .plus(freeGas ? BigNumber(0) : BigNumber(AVERAGE_TX_FEE));

        const storageAffected = flowUsed.multipliedBy(BYTES_PER_FLOW);
        const remainingStorageAfterAction = BigNumber(accountStorageInfo.storageCapacity).minus(
          storageAffected
        );

        isStorageSufficientAfterAction = remainingStorageAfterAction.gte(MINIMUM_STORAGE_BUFFER);
      }
    }
  }

  return {
    isStorageSufficient,
    isBalanceSufficient,
    isStorageSufficientAfterAction,
  };
};

export const checkEnoughBalanceForFees = (
  sendingAccountBalance: string, // UFix64
  sendAmount: string, // UFix64
  coin: string,
  movingBetweenEVMAndFlow: boolean,
  freeGas: boolean
) => {
  const flowUsed = (coin === 'flow' ? BigNumber(sendAmount) : BigNumber(0))
    .plus(movingBetweenEVMAndFlow ? BigNumber(FIXED_MOVE_FEE) : BigNumber(0))
    .plus(freeGas ? BigNumber(0) : BigNumber(AVERAGE_TX_FEE));

  return BigNumber(sendingAccountBalance).gte(flowUsed);
};

export const checkLowBalance = (
  accountBalance: string // UFix64
) => {
  return BigNumber(accountBalance).lt(MINIMUM_FLOW_BALANCE);
};
