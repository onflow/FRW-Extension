import { Box } from '@mui/material';
import React from 'react';

import { type WalletAccount } from '@/shared/types/wallet-types';

import { AccountCard } from './account-card';

type WalletHierarchy = {
  account: WalletAccount;
  linkedAccounts: WalletAccount[];
};

type AccountListingProps = {
  network: string;
  accounts: WalletHierarchy[];
  activeAddress?: string;
  onAccountClick?: (address: string) => void;
  onAccountClickSecondary?: (address: string) => void;
  secondaryIcon?: React.ReactNode;
};

export const AccountListing = ({
  network,
  accounts,
  activeAddress,
  onAccountClick,
  onAccountClickSecondary,
  secondaryIcon,
}: AccountListingProps) => {
  const AccountHierarchy = ({ account, linkedAccounts }: WalletHierarchy) => {
    return (
      <Box sx={{ gap: '0px', display: 'flex', flexDirection: 'column' }}>
        <AccountCard
          network={network}
          key={account.address}
          account={account}
          active={activeAddress === account.address}
          onClick={onAccountClick ? () => onAccountClick(account.address) : undefined}
          onClickSecondary={
            onAccountClickSecondary ? () => onAccountClickSecondary(account.address) : undefined
          }
          secondaryIcon={secondaryIcon}
          showCard={false}
        />
        {linkedAccounts.map((linkedAccount) => {
          return (
            <AccountCard
              network={network}
              key={linkedAccount.address}
              account={linkedAccount}
              active={activeAddress === linkedAccount.address}
              onClick={onAccountClick ? () => onAccountClick(linkedAccount.address) : undefined}
              onClickSecondary={
                onAccountClickSecondary
                  ? () => onAccountClickSecondary(linkedAccount.address)
                  : undefined
              }
              secondaryIcon={secondaryIcon}
              showLink={true}
              showCard={false}
            />
          );
        })}
      </Box>
    );
  };
  return (
    <Box sx={{ gap: '0px', display: 'flex', flexDirection: 'column' }}>
      {accounts.map((account) => {
        return (
          <AccountHierarchy
            key={account.account.address}
            account={account.account}
            linkedAccounts={account.linkedAccounts}
          />
        );
      })}
    </Box>
  );
};
