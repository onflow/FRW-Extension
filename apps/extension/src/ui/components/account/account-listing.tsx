import { Box, Typography } from '@mui/material';
import React from 'react';

import {
  type MainAccount,
  type WalletAccount,
} from '@onflow/flow-wallet-shared/types/wallet-types';
import { isValidEthereumAddress } from '@onflow/flow-wallet-shared/utils/address';

import { useHiddenAccounts } from '@/ui/hooks/preference-hooks';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80 } from '@/ui/style/color';

import { AccountCard } from './account-card';
import { EnableEvmAccountCard } from './enable-evm-account-card';

type AccountHierarchyProps = {
  network?: string;
  account?: MainAccount;
  activeAccount?: WalletAccount;
  onAccountClick?: (address: WalletAccount, parentAddress?: WalletAccount) => void;
  onAccountClickSecondary?: (address: WalletAccount, parentAddress?: WalletAccount) => void;
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
  const childAccounts = account?.childAccounts;
  const evmAccount = account?.evmAccount;
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
      {/* Main account */}
      <AccountCard
        network={network}
        key={account.address}
        account={account}
        active={activeAccount?.address === account.address}
        onClick={onAccountClick ? () => onAccountClick(account) : undefined}
        onClickSecondary={
          onAccountClickSecondary ? () => onAccountClickSecondary(account) : undefined
        }
        secondaryIcon={secondaryIcon}
        showCard={false}
      />

      {/* EVM account */}
      {evmAccount && evmAccount.address && isValidEthereumAddress(evmAccount.address) && (
        <AccountCard
          network={network}
          key={evmAccount.address}
          account={evmAccount}
          parentAccount={account}
          active={activeAccount?.address === evmAccount.address}
          onClick={onAccountClick ? () => onAccountClick(evmAccount, account) : undefined}
          onClickSecondary={
            onAccountClickSecondary ? () => onAccountClickSecondary(evmAccount, account) : undefined
          }
          secondaryIcon={secondaryIcon}
          showLink={true}
          showCard={false}
        />
      )}

      {/* Child accounts */}
      {childAccounts &&
        childAccounts.map((linkedAccount) => (
          <AccountCard
            network={network}
            key={linkedAccount.address}
            account={linkedAccount}
            parentAccount={account}
            active={activeAccount?.address === linkedAccount.address}
            onClick={onAccountClick ? () => onAccountClick(linkedAccount, account) : undefined}
            onClickSecondary={
              onAccountClickSecondary
                ? () => onAccountClickSecondary(linkedAccount, account)
                : undefined
            }
            secondaryIcon={secondaryIcon}
            showLink={true}
            showCard={false}
          />
        ))}
    </Box>
  );
};

type AccountListingProps = {
  network?: string;
  accountList?: MainAccount[];
  activeAccount?: WalletAccount;
  activeParentAccount?: MainAccount;
  onAccountClick?: (address: WalletAccount, parentAddress?: WalletAccount) => void;
  onAccountClickSecondary?: (address: WalletAccount, parentAddress?: WalletAccount) => void;
  onEnableEvmClick?: (parentAddress: string) => void;
  secondaryIcon?: React.ReactNode;
  showActiveAccount?: boolean;
  itemSx?: any;
  ignoreHidden?: boolean;
};

export const AccountListing = ({
  network,
  accountList,
  activeAccount,
  activeParentAccount,
  onAccountClick,
  onAccountClickSecondary,
  onEnableEvmClick,
  secondaryIcon,
  showActiveAccount = false,
  itemSx,
  ignoreHidden = false,
}: AccountListingProps) => {
  // Get the EVM account for the active account provided it's a main account
  const evmAccount = activeParentAccount?.evmAccount;
  // Check if the EVM account is not valid
  const noEvmAccount = evmAccount && !isValidEthereumAddress(evmAccount.address);
  const { pendingAccountTransactions } = useProfiles();
  const hiddenAccounts = useHiddenAccounts();

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
                ? () => onAccountClick(activeAccount, activeAccount)
                : undefined
            }
            onClickSecondary={
              onAccountClickSecondary && activeAccount?.address
                ? () => onAccountClickSecondary(activeAccount, activeAccount)
                : undefined
            }
            secondaryIcon={secondaryIcon}
            active={true}
            showCard={true}
            showLink={false}
            data-testid="active-account-card"
          />
          {/* If the EVM account is not valid, show the EnableEvmAccountCard */}
          {noEvmAccount && (
            <EnableEvmAccountCard
              showCard={false}
              onEnableEvmClick={() =>
                activeParentAccount?.address
                  ? onEnableEvmClick?.(activeParentAccount?.address)
                  : undefined
              }
            />
          )}

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
      {accountList &&
        accountList
          .filter((account) => ignoreHidden || !hiddenAccounts.includes(account.address))
          .map((account, idx, arr) => (
            <Box
              key={account.address}
              sx={{
                ...(itemSx || {}),
                marginBottom: idx !== arr.length - 1 ? '8px' : 0,
              }}
            >
              <AccountHierarchy
                network={network}
                account={account}
                activeAccount={activeAccount}
                onAccountClick={onAccountClick}
                onAccountClickSecondary={onAccountClickSecondary}
                secondaryIcon={secondaryIcon}
              />
            </Box>
          ))}
      {pendingAccountTransactions &&
        pendingAccountTransactions.map((transaction) => {
          return (
            <AccountCard
              key={transaction}
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
