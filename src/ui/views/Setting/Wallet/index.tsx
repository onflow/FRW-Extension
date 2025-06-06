import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import {
  Typography,
  List,
  ListItemText,
  ListItemIcon,
  ListItem,
  ListItemButton,
  Divider,
  CardMedia,
  Box,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';

import {
  type MainAccountWithBalance,
  type MainAccount,
  type WalletAccount,
  type WalletAccountWithBalance,
  type Emoji,
} from '@/shared/types/wallet-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import { LLHeader } from '@/ui/components';
import IconEnd from '@/ui/components/iconfont/IconAVector11Stroke';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useWallet } from '@/ui/utils';
import { storage } from 'background/webapi';
import { formatAddress } from 'ui/utils';

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

const Wallet = () => {
  const usewallet = useWallet();
  const { currentWallet } = useProfiles();
  const [userMainAccounts, setUserMainAccounts] = useState<MainAccountWithBalance[]>([]);
  const [evmList, setEvmList] = useState<WalletAccountWithBalance[]>([]);
  const [currentAddress, setCurrentWallet] = useState('');
  const [emojis, setEmojis] = useState<Emoji[]>(tempEmoji);

  function handleWalletClick(
    wallet: MainAccountWithBalance | WalletAccountWithBalance,
    eindex: number
  ) {
    const selectedEmoji = emojis[eindex];
    const walletDetailInfo = { wallet, selectedEmoji };
    storage.set('walletDetail', JSON.stringify(walletDetailInfo));
  }

  const fetchFlowBalances = useCallback(
    async (mainAccounts: MainAccount[]) => {
      const updatedData = await Promise.all(
        mainAccounts.map(async (account: MainAccount) => {
          const mainAccountWithBalance: MainAccountWithBalance = {
            ...account,
            balance: await usewallet.getFlowBalance(account.address),
          };
          return mainAccountWithBalance;
        })
      );
      return updatedData;
    },
    [usewallet]
  );

  const fetchEvmBalances = useCallback(
    async (evmAccounts: WalletAccount[]): Promise<WalletAccountWithBalance[]> => {
      return Promise.all(
        evmAccounts.map(async (item) => {
          let balance = '';
          if (isValidEthereumAddress(item.address)) {
            balance = await usewallet.getEvmBalance(item.address);
          }
          return { ...item, balance };
        })
      );
    },
    [usewallet]
  );

  const setUserWallet = useCallback(async () => {
    await usewallet.setDashIndex(3);
    const emojires = await usewallet.getEmoji();
    const mainAccounts: MainAccount[] | null = await usewallet.getMainAccounts();
    if (mainAccounts) {
      const mainAccountsWithBalances: MainAccountWithBalance[] =
        await fetchFlowBalances(mainAccounts);
      setCurrentWallet(currentWallet?.address ?? '');
      const evmWallet: WalletAccount | null = await usewallet.getEvmWallet();
      if (evmWallet) {
        const filteredEvm = [evmWallet].filter((evm) => evm?.address);
        if (filteredEvm.length > 0) {
          const fetchedEvm = await fetchEvmBalances(filteredEvm);
          setEvmList(fetchedEvm);
        }
      }
      setEmojis(emojires);
      setUserMainAccounts(mainAccountsWithBalances);
    }
  }, [usewallet, currentWallet, fetchFlowBalances, fetchEvmBalances]);

  useEffect(() => {
    setUserWallet();
  }, [setUserWallet]);

  return (
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Acc__list')} help={false} />
      <Box sx={{ justifyContent: 'center', alignItems: 'center', width: '100%', px: '18px' }}>
        <Typography
          sx={{ fontSize: '14px', fontWeight: '600', color: '#787878', margin: '20px 0 8px' }}
        >
          {chrome.i18n.getMessage('main_wallet')}
        </Typography>
        <List
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#292929',
            margin: '8px auto 16px auto',
            pt: 0,
            pb: 0,
          }}
        >
          {userMainAccounts.map((item) => (
            <ListItem
              key={item.address}
              component={Link}
              to={`/dashboard/setting/wallet/detail?address=${item.address}`}
              onClick={() => handleWalletClick(item, 0)}
              disablePadding
              sx={{
                height: '72px',
                width: '100%',
                overflow: 'hidden',
              }}
            >
              <ListItemButton
                sx={{
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  margin: '0 auto',
                  padding: '16px 20px',
                  '&:hover': {
                    backgroundColor: '#262626',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    height: '32px',
                    width: '32px',
                    borderRadius: '32px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: item.color,
                    marginRight: '12px',
                  }}
                >
                  <Typography sx={{ fontSize: '20px', fontWeight: '600' }}>{item.icon}</Typography>
                </Box>
                <Box key={item.address} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography
                      sx={{
                        color: '##FFFFFF',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginRight: '4px',
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Typography
                      sx={{ color: '#808080', fontSize: '12px', fontWeight: '400' }}
                    >{`(${item.address})`}</Typography>
                    {item.address === currentAddress && (
                      <ListItemIcon style={{ display: 'flex', alignItems: 'center' }}>
                        <FiberManualRecordIcon
                          style={{
                            fontSize: '10px',
                            color: '#40C900',
                            marginLeft: '10px',
                          }}
                        />
                      </ListItemIcon>
                    )}
                  </Box>
                  <Typography sx={{ color: '#808080', fontSize: '12px', fontWeight: '400' }}>
                    {item.balance} Flow
                  </Typography>
                </Box>
                <Box sx={{ flex: '1' }}></Box>
                <IconEnd size={12} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {evmList.length > 0 && (
          <Typography
            sx={{ fontSize: '14px', fontWeight: '600', color: '#787878', margin: '20px 0 8px' }}
          >
            {chrome.i18n.getMessage('multi_vm')}
          </Typography>
        )}

        <List
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#292929',
            margin: '8px auto 16px auto',
            pt: 0,
            pb: 0,
          }}
        >
          {evmList.map((item) => (
            <ListItem
              key={item.address}
              component={Link}
              to="/dashboard/setting/wallet/detail"
              onClick={() => handleWalletClick(item, 1)}
              disablePadding
              sx={{
                height: '72px',
                width: '100%',
                overflow: 'hidden',
              }}
            >
              <ListItemButton
                sx={{
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  margin: '0 auto',
                  padding: '16px 20px',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    height: '32px',
                    width: '32px',
                    borderRadius: '32px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: item.color,
                    marginRight: '12px',
                  }}
                >
                  <Typography sx={{ fontSize: '20px', fontWeight: '600' }}>{item.icon}</Typography>
                </Box>
                <Box key={item.address} sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography
                      sx={{
                        color: '##FFFFFF',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginRight: '4px',
                      }}
                    >
                      {item.name}
                    </Typography>
                    <Typography
                      sx={{ color: '#808080', fontSize: '12px', fontWeight: '400' }}
                    >{`(${formatAddress(item.address)})`}</Typography>
                    <Typography
                      variant="body1"
                      component="span"
                      color="#FFF"
                      fontSize={'9px'}
                      sx={{
                        backgroundColor: '#627EEA',
                        padding: '0 8px',
                        borderRadius: '18px',
                        textAlign: 'center',
                        marginLeft: '8px',
                        lineHeight: '16px',
                        height: '16px',
                      }}
                    >
                      EVM
                    </Typography>
                  </Box>
                  <Typography sx={{ color: '#808080', fontSize: '12px', fontWeight: '400' }}>
                    {item.balance} Flow
                  </Typography>
                </Box>
                <Box sx={{ flex: '1' }}></Box>
                <IconEnd size={12} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </div>
  );
};

export default Wallet;
