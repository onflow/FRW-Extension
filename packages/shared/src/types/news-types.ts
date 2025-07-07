/*
 * News items
 */
export type NewsType = 'message' | 'image';

export type NewsPriority = 'urgent' | 'high' | 'medium' | 'low';

export type NewsDisplayType =
  | 'once' // show once
  | 'click' // close it when user click on it
  | 'expiry'; // it will display until it expired

export type NewsConditionType =
  | 'unknown'
  | 'canUpgrade'
  | 'isIOS'
  | 'isAndroid'
  | 'isWeb'
  | 'insufficientStorage'
  | 'insufficientBalance';

export interface NewsItem {
  id: string;
  priority: NewsPriority;
  type: NewsType;
  title: string;
  body?: string;
  icon?: string;
  image?: string;
  url?: string;
  expiryTime: Date;
  displayType: NewsDisplayType;
  conditions?: { type: NewsConditionType }[];
}
