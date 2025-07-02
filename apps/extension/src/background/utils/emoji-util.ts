import { type Emoji } from '@/shared/types/wallet-types';
import emoji from 'background/utils/emoji.json';

export const getEmojiList = (): Emoji[] => {
  return emoji.emojis;
};

export const getEmojiByIndex = (index: number): Emoji => {
  const i = index % emoji.emojis.length;
  return emoji.emojis[i];
};
