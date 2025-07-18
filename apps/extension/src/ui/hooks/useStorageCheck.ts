import { useEffect, useState } from 'react';

import {
  checkEnoughBalanceForFees,
  evaluateStorage,
} from '@onflow/flow-wallet-shared/utils/evaluate-storage';

import { useFeatureFlag } from './use-feature-flags';
import { useProfiles } from './useProfileHook';

interface StorageCheckResult {
  sufficient?: boolean;
  sufficientAfterAction?: boolean;
}

interface UseStorageCheckProps {
  transferAmount?: string;
  coin?: string;
  movingBetweenEVMAndFlow?: boolean;
}
export const useStorageCheck = ({
  transferAmount, // amount in coins
  coin, // coin name
  movingBetweenEVMAndFlow = false, // are we moving between EVM and Flow?
}: UseStorageCheckProps = {}): StorageCheckResult => {
  const { currentBalance, parentAccountStorageBalance, activeAccountType } = useProfiles();
  const [sufficient, setSufficient] = useState<boolean | undefined>(undefined);
  const [sufficientAfterAction, setSufficientAfterAction] = useState<boolean | undefined>(
    undefined
  );

  const freeGas = useFeatureFlag('free_gas');

  useEffect(() => {
    const checkBalance = async () => {
      setSufficient(undefined);
      setSufficientAfterAction(undefined);
      if (
        activeAccountType === 'main' &&
        parentAccountStorageBalance !== undefined &&
        transferAmount !== undefined &&
        coin !== undefined &&
        movingBetweenEVMAndFlow !== undefined &&
        freeGas !== undefined
      ) {
        const { isStorageSufficient, isBalanceSufficient, isStorageSufficientAfterAction } =
          await evaluateStorage(
            parentAccountStorageBalance,
            transferAmount,
            coin,
            movingBetweenEVMAndFlow,
            freeGas
          );
        setSufficient(isStorageSufficient && isBalanceSufficient);
        setSufficientAfterAction(isStorageSufficientAfterAction);
      } else {
        if (
          currentBalance !== undefined &&
          transferAmount !== undefined &&
          coin !== undefined &&
          freeGas !== undefined
        ) {
          const isBalanceSufficient = await checkEnoughBalanceForFees(
            currentBalance,
            transferAmount,
            coin,
            movingBetweenEVMAndFlow,
            freeGas
          );
          setSufficient(isBalanceSufficient);
        }
      }
    };
    if (activeAccountType !== undefined && parentAccountStorageBalance !== undefined) {
      checkBalance();
    }
  }, [
    currentBalance,
    transferAmount,
    coin,
    movingBetweenEVMAndFlow,
    freeGas,
    activeAccountType,
    parentAccountStorageBalance,
  ]);

  return {
    sufficient,
    sufficientAfterAction,
  };
};
