import {
  Typography,
  Box,
  List,
  ListItemText,
  ListItemIcon,
  ListItem,
  ListItemButton,
  Divider,
  CardMedia,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useRouteMatch, useHistory } from 'react-router-dom';

import { storage } from '@/background/webapi';
import {
  type MainAccountWithBalance,
  type MainAccount,
  type WalletAccount,
  type WalletAccountWithBalance,
  type Emoji,
} from '@/shared/types/wallet-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import { LinkIcon } from '@/ui/assets/icons/LinkIcon';
import { LLHeader } from '@/ui/components';
import { AccountCard } from '@/ui/components/account/account-card';
import { BaseAccountHierarchy } from '@/ui/components/account/base-account-hierarchy';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80 } from '@/ui/style/color';
import { useWallet } from 'ui/utils';

const tempEmoji: Emoji[] = [
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

const AccountList = () => {
  const usewallet = useWallet();
  const { currentWallet, walletList, network } = useProfiles();
  const [emojis, setEmojis] = useState<Emoji[]>(tempEmoji);
  const [isInitialized, setIsInitialized] = useState(false);
  const history = useHistory();

  const handleAccountClick = (accountAddress: string, parentAddress?: string) => {
    // Find the account for storage
    const account = walletList?.find((wallet) => wallet.address === accountAddress);

    if (account) {
      // Find the emoji by name (account.name should match emoji.name)
      const emojiIndex = emojis.findIndex((emoji) => emoji.name === account.name);

      if (emojiIndex !== -1) {
        const selectedEmoji = emojis[emojiIndex];
        const walletDetailInfo = { wallet: account, selectedEmoji };
        storage.set('walletDetail', JSON.stringify(walletDetailInfo));
      }
    }

    if (parentAddress && accountAddress !== parentAddress) {
      // Check if this is an EVM account or a Flow linked account
      if (isValidEthereumAddress(accountAddress)) {
        history.push(`/dashboard/setting/accountlist/detail/${accountAddress}`);
      } else {
        // For Flow linked accounts, navigate to linked detail page with parent address name
        const parentAccount = walletList?.find((wallet) => wallet.address === parentAddress);
        const parentName = parentAccount?.name || '';
        history.push(
          `/dashboard/setting/linkeddetail/${accountAddress}?parentName=${encodeURIComponent(parentName)}`
        );
      }
    } else {
      // For main accounts, navigate to account detail page
      history.push(`/dashboard/setting/accountlist/detail/${accountAddress}`);
    }
  };

  const setUserWallet = useCallback(async () => {
    await usewallet.setDashIndex(3);
    const emojires = await usewallet.getEmoji();
    setEmojis(emojires);
    setIsInitialized(true);
  }, [usewallet]);

  useEffect(() => {
    setUserWallet();
  }, [setUserWallet]);

  // Don't render anything until we have the network and walletList
  if (!network || !walletList || walletList.length === 0 || !isInitialized) {
    return (
      <div className="page">
        <LLHeader title={chrome.i18n.getMessage('Acc__list')} help={false} />
        <Box sx={{ gap: '0px', padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="body1"
            color="text.primary"
            sx={{
              color: 'rgba(255, 255, 255, 0.80)',
              fontFamily: 'Inter,sans-serif',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: '400',
              lineHeight: '16px',
              marginBottom: '8px',
            }}
          >
            {chrome.i18n.getMessage('main_wallet')}
          </Typography>

          <Box sx={{ gap: '8px', display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                display: 'flex',
                padding: '10px',
                flexDirection: 'column',
                gap: '18px',
                alignSelf: 'stretch',
                borderRadius: '16px',
                border: '1px solid #1A1A1A',
                background: 'rgba(255, 255, 255, 0.10)',
              }}
            >
              <Box sx={{ gap: '0px', display: 'flex', flexDirection: 'column' }}>
                <AccountCard showCard={false} />
                <AccountCard showCard={false} showLink={true} />
                <AccountCard showCard={false} showLink={true} />
              </Box>
            </Box>
          </Box>
        </Box>
      </div>
    );
  }

  return (
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Acc__list')} help={false} />
      <Box sx={{ gap: '0px', padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ gap: '8px', display: 'flex', flexDirection: 'column' }}>
          {walletList.map((account) => (
            <Box
              key={account.address}
              sx={{
                display: 'flex',
                padding: '10px',
                flexDirection: 'column',
                gap: '18px',
                alignSelf: 'stretch',
                borderRadius: '16px',
                border: '1px solid #1A1A1A',
                background: 'rgba(255, 255, 255, 0.10)',
              }}
            >
              <BaseAccountHierarchy
                account={account}
                network={network}
                activeAccount={currentWallet}
                onAccountClick={handleAccountClick}
                showCard={false}
                showLink={true}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </div>
  );
};

export default AccountList;
