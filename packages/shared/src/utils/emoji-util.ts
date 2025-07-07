import emoji from '@/shared/constant/emoji.json';
import { type Emoji } from '@/shared/types/wallet-types';

export const getEmojiList = (): Emoji[] => {
  return emoji.emojis;
};

export const getEmojiByIndex = (index: number): Emoji => {
  const i = index % emoji.emojis.length;
  return emoji.emojis[i];
};
