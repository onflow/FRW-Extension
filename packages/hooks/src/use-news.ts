import { useCallback, useMemo } from 'react';

import { type NewsConditionType, type NewsItem } from '@/shared/types/news-types';
import { newsKey } from '@/shared/utils/cache-data-keys';
import { consoleError } from '@/shared/utils/console-log';
import { checkLowBalance, evaluateStorage } from '@/shared/utils/evaluate-storage';
import {
  readAndDismissedNewsKey,
  type ReadAndDismissedNewsStore,
} from '@/shared/utils/user-data-keys';

import packageJson from '../../../package.json';

import { useCachedData, useUserData } from './use-data';
import { useLatestVersion } from './use-feature-flags';
import { useWallet } from './use-wallet';
import { useProfiles } from './useProfileHook';

const CURRENT_VERSION = packageJson.version;

const compareVersions = (current: string, latest: string): number => {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (currentPart !== latestPart) {
      return currentPart - latestPart;
    }
  }
  return 0;
};

export const useNews = () => {
  const {
    activeAccountType,
    mainAddress,
    currentWallet,
    parentAccountStorageBalance,
    currentBalance,
  } = useProfiles();
  const wallet = useWallet();
  const cachedNews = useCachedData<NewsItem[]>(newsKey());
  const readAndDismissedNews = useUserData<ReadAndDismissedNewsStore>(readAndDismissedNewsKey());
  const latestVersion = useLatestVersion();

  const loading =
    activeAccountType === undefined ||
    mainAddress === undefined ||
    currentWallet === undefined ||
    parentAccountStorageBalance === undefined ||
    currentBalance === undefined ||
    latestVersion === undefined ||
    cachedNews === undefined;

  const evaluateCondition = useCallback(
    (condition: NewsConditionType): boolean => {
      switch (condition) {
        case 'isWeb':
          return true; // Always true for Chrome extension

        case 'isIOS':
        case 'isAndroid':
          return false; // Always false for Chrome extension

        case 'canUpgrade':
          try {
            if (!latestVersion) {
              return false;
            }
            const canUpgrade = compareVersions(CURRENT_VERSION, latestVersion) < 0;
            return canUpgrade;
          } catch (err) {
            consoleError('Error evaluating canUpgrade', err);
            return false;
          }

        case 'insufficientStorage': {
          if (activeAccountType !== 'main' || parentAccountStorageBalance === undefined) {
            return false;
          }
          const { isStorageSufficient } = evaluateStorage(parentAccountStorageBalance);
          return !isStorageSufficient;
        }
        case 'insufficientBalance': {
          if (currentBalance === undefined) {
            return false;
          }
          const isLowBalance = checkLowBalance(currentBalance);
          return isLowBalance;
        }

        case 'unknown':
        default:
          return false; // Unknown conditions are considered unmet
      }
    },
    [activeAccountType, parentAccountStorageBalance, currentBalance, latestVersion]
  );

  const evaluateConditions = useCallback(
    (conditions?: { type: NewsConditionType }[]): boolean => {
      if (!conditions || conditions.length === 0) {
        return true; // No conditions means always show
      }

      // Evaluate all conditions (AND logic)
      for (const condition of conditions) {
        if (!evaluateCondition(condition.type)) {
          return false;
        }
      }
      return true;
    },
    [evaluateCondition]
  );

  const newsForActiveAccount = useMemo(() => {
    if (loading) return undefined;
    return cachedNews?.filter((newsItem) => {
      // Check if the news is dismissed

      if (readAndDismissedNews?.dismissedIds.includes(newsItem.id)) {
        return false;
      }
      // Check if the conditions are met
      if (!evaluateConditions(newsItem.conditions)) {
        return false;
      }
      return true;
    });
  }, [loading, cachedNews, evaluateConditions, readAndDismissedNews?.dismissedIds]);

  return {
    news: newsForActiveAccount,
    unreadCount: newsForActiveAccount?.length ?? 0,
    dismissNews: (id: string) => {
      return wallet.markNewsAsDismissed(id);
    },
    markAsRead: (id: string) => {
      return wallet.markNewsAsRead(id);
    },
    markAllAsRead: () => {
      return wallet.markAllNewsAsRead();
    },
  };
};
