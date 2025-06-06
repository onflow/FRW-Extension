import { Box, Typography } from '@mui/material';
import React from 'react';

import { type WalletAccount } from '@/shared/types/wallet-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import { FlowIcon } from '@/ui/assets/icons/FlowIcon';
import {
  useChildAccounts,
  useEvmAccount,
  usePendingAccountCreationTransactions,
} from '@/ui/hooks/use-account-hooks';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80 } from '@/ui/style/color';

import { AccountCard } from './account-card';
import { EnableEvmAccountCard } from './enable-evm-account-card';

type AccountHierarchyProps = {
  network?: string;
  account?: WalletAccount;
  activeAccount?: WalletAccount;
  onAccountClick?: (address: string, parentAddress?: string) => void;
  onAccountClickSecondary?: (address: string, parentAddress?: string) => void;
  secondaryIcon?: React.ReactNode;
};
const AccountHierarchy = ({
  network,
  account,
  activeAccount,
  onAccountClick,
  onAccountClickSecondary,
  secondaryIcon,
}: AccountHierarchyProps) => {
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
        showCard={false}
      />

      {/* If the EVM account is valid, show the EVM account card */}
      {evmAccount && isValidEthereumAddress(evmAccount.address) && (
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
          showLink={true}
          showCard={false}
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
              showLink={true}
              showCard={false}
            />
          );
        })}
    </Box>
  );
};

type AccountListingProps = {
  network?: string;
  accountList?: WalletAccount[];
  activeAccount?: WalletAccount;
  activeParentAccount?: WalletAccount;
  onAccountClick?: (address: string, parentAddress?: string) => void;
  onAccountClickSecondary?: (address: string, parentAddress?: string) => void;
  secondaryIcon?: React.ReactNode;
  showActiveAccount?: boolean;
};

export const AccountListing = ({
  network,
  accountList,
  activeAccount,
  activeParentAccount,
  onAccountClick,
  onAccountClickSecondary,
  secondaryIcon,
  showActiveAccount = false,
}: AccountListingProps) => {
  // Get the EVM account for the active account provided it's a main account
  const evmAccount = useEvmAccount(
    network,
    activeParentAccount === undefined || activeAccount?.address === activeParentAccount?.address
      ? activeAccount?.address
      : undefined
  );
  // Check if the EVM account is not valid
  const noEvmAccount = evmAccount && !isValidEthereumAddress(evmAccount.address);
  const { pendingAccountTransactions } = useProfiles();
  return (
    <Box sx={{ gap: '0px', padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
      {/* Active account */}
      {showActiveAccount && (
        <>
          <Typography
            variant="body1"
            color="text.primary"
            sx={{
              color: COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80,
              fontFamily: 'Inter,sans-serif',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: '400',
              lineHeight: '16px',
              marginBottom: '8px',
            }}
          >
            {chrome.i18n.getMessage('Active_account')}
          </Typography>
          {/* Handle loading state */}
          <AccountCard
            network={network}
            account={activeAccount}
            parentAccount={activeParentAccount}
            onClick={
              onAccountClick && activeAccount?.address
                ? () => onAccountClick(activeAccount.address, activeAccount.address)
                : undefined
            }
            onClickSecondary={
              onAccountClickSecondary && activeAccount?.address
                ? () => onAccountClickSecondary(activeAccount.address, activeAccount.address)
                : undefined
            }
            secondaryIcon={secondaryIcon}
            active={true}
            showCard={true}
            showLink={false}
            data-testid="active-account-card"
          />
          {/* If the EVM account is not valid, show the EnableEvmAccountCard */}
          {noEvmAccount && <EnableEvmAccountCard showCard={false} />}

          <Typography
            variant="body1"
            color="text.primary"
            sx={{
              color: COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80,
              fontFamily: 'Inter,sans-serif',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: '400',
              lineHeight: '16px',
              marginTop: '24px',
              marginBottom: '8px',
            }}
          >
            {chrome.i18n.getMessage('Other_accounts')}
          </Typography>
        </>
      )}
      {/* Loading state */}
      {accountList === undefined && (
        <AccountHierarchy network={network} account={undefined} activeAccount={activeAccount} />
      )}
      {accountList?.map((account) => {
        return (
          <AccountHierarchy
            network={network}
            key={account.address}
            account={account}
            activeAccount={activeAccount}
            onAccountClick={onAccountClick}
            onAccountClickSecondary={onAccountClickSecondary}
            secondaryIcon={secondaryIcon}
          />
        );
      })}
      {pendingAccountTransactions &&
        pendingAccountTransactions.map((transaction) => {
          return (
            <AccountCard
              key={transaction.txId}
              account={transaction}
              showCard={false}
              isPending={true}
              showLink={false}
              network={network}
              spinning={true}
            />
          );
        })}
    </Box>
  );
};
