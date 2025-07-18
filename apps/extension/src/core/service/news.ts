import { type NewsItem } from '@onflow/flow-wallet-shared/types/news-types';
import { consoleError } from '@onflow/flow-wallet-shared/utils/console-log';

import { newsKey, newsRefreshRegex, type NewsStore } from '@/data-model/cache-data-keys';
import {
  readAndDismissedNewsKey,
  type ReadAndDismissedNewsStore,
} from '@/data-model/user-data-keys';

import openapi from './openapi';
import { getValidData, registerRefreshListener, setCachedData } from '../utils/data-cache';
import createPersistStore from '../utils/persistStore';

class NewsService {
  store!: ReadAndDismissedNewsStore;

  init = async () => {
    try {
      this.store = await createPersistStore<ReadAndDismissedNewsStore>({
        name: readAndDismissedNewsKey(), // Must be unique name
        template: {
          readIds: [], // ids of news that are read
          dismissedIds: [], // ids of news that are dismissed
        },
        fromStorage: true,
      });
    } catch (error) {
      consoleError('Error initializing NewsService', error);
    }
    registerRefreshListener(newsRefreshRegex, this.loadNews);
  };

  loadNews = async () => {
    const unfilteredNews = await openapi.getNews();

    // Filter out news that are expired
    const timeNow = new Date(Date.now());

    const news = unfilteredNews.filter((n: { expiryTime: Date }) => {
      return n.expiryTime > timeNow;
    });

    setCachedData(newsKey(), news, 5 * 60_000); // 5 minutes
    return news;
  };

  getNews = async (): Promise<NewsItem[]> => {
    const cachedNews = await getValidData<NewsStore>(newsKey());
    if (cachedNews) {
      return cachedNews;
    }
    return this.loadNews();
  };

  isRead = (id: string): boolean => {
    // TODO: we could use a set for this, but it's not a big deal
    return this.store?.readIds?.includes(id);
  };

  markAsRead = async (id: string): Promise<boolean> => {
    if (!this.store) await this.init();

    const news = await this.getNews();

    if (!this.isRead(id)) {
      // Use this opportunity to clear the read ids that are not in the new news
      // Don't love this, but it's a quick way to do it
      this.store.readIds = [
        ...this.store.readIds.filter((readId) => news.some((n) => n.id === readId)),
        id,
      ];
      // Marked as read
      return true;
    }
    // Already read
    return false;
  };

  markAllAsRead = async () => {
    if (!this.store) await this.init();

    const news = await this.getNews();
    this.store.readIds = news.map((n) => n.id);
  };

  getUnreadCount = async () => {
    if (!this.store) await this.init();

    // Not sure I love this, but it's a quick way to get the unread count
    // The frontend should cache the unread count
    const news = await this.getNews();

    const unreadCount = news.reduce((count, item) => (this.isRead(item.id) ? count : count + 1), 0);

    return unreadCount;
  };

  isDismissed = (id: string): boolean => {
    // TODO: we could use a set for this, but it's not a big deal
    return this.store?.dismissedIds?.includes(id);
  };

  markAsDismissed = async (id: string) => {
    if (!this.store) await this.init();

    // Mark as read first
    this.markAsRead(id);

    // Add to dismissed ids if not already there
    if (!this.isDismissed(id)) {
      const newDismissedIds = [...this.store.dismissedIds, id];
      this.store.dismissedIds = newDismissedIds;
    }
  };

  clear = () => {
    if (this.store) {
      this.store.readIds = [];
      this.store.dismissedIds = [];
    }
  };
}

export default new NewsService();
