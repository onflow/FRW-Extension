import { Box } from '@mui/material';
import React from 'react';

import { type WalletAccount, type MainAccount } from '@/shared/types/wallet-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import { useChildAccounts, useEvmAccount } from '@/ui/hooks/use-account-hooks';

import { AccountCard } from './account-card';

export interface BaseAccountHierarchyProps {
  account: WalletAccount;
  network?: string;
  activeAccount?: WalletAccount | MainAccount | null;
  onAccountClick?: (address: string, parentAddress?: string) => void;
  onAccountClickSecondary?: (address: string, parentAddress?: string) => void;
  secondaryIcon?: React.ReactNode;
  showCard?: boolean;
  showLink?: boolean;
}

export interface AccountHierarchyData {
  childAccounts: WalletAccount[] | undefined;
  evmAccount: WalletAccount | undefined;
  loading: boolean;
}

export const BaseAccountHierarchy = React.memo(
  ({
    account,
    network,
    activeAccount,
    onAccountClick,
    onAccountClickSecondary,
    secondaryIcon,
    showCard = false,
    showLink = false,
  }: BaseAccountHierarchyProps) => {
    const childAccounts = useChildAccounts(network, account?.address);
    const evmAccount = useEvmAccount(network, account?.address);
    const loading = network === undefined || account === undefined;

    if (loading) {
      return (
        <Box sx={{ gap: '0px', display: 'flex', flexDirection: 'column' }}>
          <AccountCard showCard={false} />
          <AccountCard showCard={false} showLink={true} />
          <AccountCard showCard={false} showLink={true} />
        </Box>
      );
    }

    return (
      <Box sx={{ gap: '0px', display: 'flex', flexDirection: 'column' }}>
        <AccountCard
          network={network}
          key={account.address}
          account={account}
          active={activeAccount?.address === account.address}
          onClick={
            onAccountClick ? () => onAccountClick(account.address, account.address) : undefined
          }
          onClickSecondary={
            onAccountClickSecondary
              ? () => onAccountClickSecondary(account.address, account.address)
              : undefined
          }
          secondaryIcon={secondaryIcon}
          showCard={showCard}
        />

        {/* If the EVM account is valid, show the EVM account card */}
        {evmAccount && evmAccount.address && isValidEthereumAddress(evmAccount.address) && (
          <AccountCard
            network={network}
            key={evmAccount.address}
            account={evmAccount}
            parentAccount={account}
            active={activeAccount?.address === evmAccount.address}
            onClick={
              onAccountClick ? () => onAccountClick(evmAccount.address, account.address) : undefined
            }
            onClickSecondary={
              onAccountClickSecondary
                ? () => onAccountClickSecondary(evmAccount.address, account.address)
                : undefined
            }
            secondaryIcon={secondaryIcon}
            showLink={showLink}
            showCard={showCard}
          />
        )}

        {childAccounts &&
          childAccounts.map((linkedAccount) => {
            return (
              <AccountCard
                network={network}
                key={linkedAccount.address}
                account={linkedAccount}
                parentAccount={account}
                active={activeAccount?.address === linkedAccount.address}
                onClick={
                  onAccountClick
                    ? () => onAccountClick(linkedAccount.address, account.address)
                    : undefined
                }
                onClickSecondary={
                  onAccountClickSecondary
                    ? () => onAccountClickSecondary(linkedAccount.address, account.address)
                    : undefined
                }
                secondaryIcon={secondaryIcon}
                showLink={showLink}
                showCard={showCard}
              />
            );
          })}
      </Box>
    );
  }
);

BaseAccountHierarchy.displayName = 'BaseAccountHierarchy';
