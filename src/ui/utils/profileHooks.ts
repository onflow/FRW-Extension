import { useState, useEffect, useCallback } from 'react';

import eventBus from '@/eventBus';
import { useWallet } from 'ui/utils';

const tempEmoji = [
  {
    emoji: '🥥',
    name: 'Coconut',
    bgcolor: '#FFE4C4',
  },
  {
    emoji: '🥑',
    name: 'Avocado',
    bgcolor: '#98FB98',
  },
];

export const profileHooks = () => {
  const usewallet = useWallet();
  const [emojis, setEmojis] = useState<any>(tempEmoji);
  const fetchEmojis = useCallback(async () => {
    try {
      console.log('fetchEmojis');
      const emojires = await usewallet.getEmoji(); // Ensure useWallet is correctly used
      setEmojis(emojires);
      eventBus.emit('profileChanged');
    } catch (error) {
      console.error('Failed to fetch emojis', error);
    }
  }, []);

  useEffect(() => {
    fetchEmojis();
  }, [fetchEmojis]);

  return {
    emojis,
    updateEmojis: () => {
      fetchEmojis();
    },
  };
};
