import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardMedia,
  IconButton,
  Skeleton,
  Typography,
} from '@mui/material';
import React from 'react';

import { type WalletAccount } from '@/shared/types/wallet-types';
import { isValidEthereumAddress } from '@/shared/utils/address';
import { CopyIcon } from '@/ui/assets/icons/CopyIcon';
import { LinkIcon } from '@/ui/assets/icons/LinkIcon';
import { useAccountBalance } from '@/ui/hooks/use-account-hooks';
import { useNftCatalogCollections } from '@/ui/hooks/useNftHook';
import {
  COLOR_DARKMODE_BACKGROUND_CARDS_1A1A1A,
  COLOR_DARKMODE_TEXT_PRIMARY_FFFFFF,
  COLOR_DARKMODE_TEXT_SECONDARY_B3B3B3,
  COLOR_ACCENT_EVM_627EEA,
  COLOR_GREY_ICONS_767676,
} from '@/ui/style/color';
import { formatAddress } from '@/ui/utils';

import { TokenBalance } from '../TokenLists/TokenBalance';

import { AccountAvatar } from './account-avatar';

type AccountCardWithCopyProps = {
  network?: string;
  account?: WalletAccount;
  parentAccount?: WalletAccount; // Could be a MainAccount but we don't need all the rest of the fields
  active?: boolean;
  spinning?: boolean;
  onClick?: () => void;
  showLink?: boolean;
  showCard?: boolean;
  isPending?: boolean;
  'data-testid'?: string;
};

type AccountCardProps = AccountCardWithCopyProps & {
  onClickSecondary?: () => void;
  secondaryIcon?: React.ReactNode;
};

export const AccountCard = ({
  network,
  account,
  parentAccount,
  active = false,
  spinning = false,
  onClick,
  onClickSecondary = () => account?.address && navigator.clipboard.writeText(account.address),
  secondaryIcon = <CopyIcon width={24} />,
  showLink = false,
  showCard = false,
  isPending = false,
  'data-testid': dataTestId,
}: AccountCardProps) => {
  const { name, icon, color, address, nfts } = account || {};
  const { icon: parentIcon, color: parentColor } =
    account && parentAccount && parentAccount.address !== account.address ? parentAccount : {};

  const hasParentAccount = account && parentAccount && parentAccount.address !== account.address;
  const isEvmAccount = account && isValidEthereumAddress(account.address);
  const isChildAccount = hasParentAccount && !isEvmAccount;

  // Only show NFTs for child accounts
  const nftCatalogCollections = useNftCatalogCollections(
    network,
    isChildAccount ? address : undefined
  );

  const testId =
    dataTestId ||
    (isEvmAccount
      ? `evm-account-${address}`
      : hasParentAccount
        ? `child-account-${address}`
        : `main-account-${address}`);
  const accountBalance = useAccountBalance(network, address);
  const balance = accountBalance === undefined ? account?.balance : accountBalance;

  const nftCount = nfts || nftCatalogCollections?.reduce((acc, curr) => acc + curr.count, 0);
  return (
    <Card
      sx={{
        paddingLeft: showCard ? '8px' : '0',
        paddingRight: showCard ? '16px' : '0',
        paddingTop: showCard ? '10px' : '0',
        paddingBottom: showCard ? '10px' : '0',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: '16px',
        backgroundColor: showCard ? COLOR_DARKMODE_BACKGROUND_CARDS_1A1A1A : 'transparent',
        overflow: 'hidden',
        maxWidth: '500px',
      }}
      elevation={showCard ? 1 : 0}
      data-testid={testId}
    >
      <CardActionArea
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          padding: '0px',
          alignItems: 'center',
          overflow: 'hidden',
          paddingTop: showCard ? '0' : '8px',
          paddingBottom: showCard ? '0' : '8px',
        }}
        onClick={onClick}
      >
        <CardMedia sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {showLink && (
            <Box paddingLeft="10px" paddingRight="6px">
              <LinkIcon width={20} height={20} color={COLOR_GREY_ICONS_767676} />
            </Box>
          )}
          <AccountAvatar
            network={network}
            emoji={icon}
            color={color}
            parentEmoji={showLink ? undefined : parentIcon}
            parentColor={parentColor}
            active={active}
            spinning={spinning}
            isPending={isPending}
          />
        </CardMedia>
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
          <Typography
            fontStyle="Inter"
            color={COLOR_DARKMODE_TEXT_PRIMARY_FFFFFF}
            fontSize="14px"
            fontWeight="600"
            lineHeight="17px"
            noWrap
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            {name || <Skeleton variant="text" width="50px" />}

            {isValidEthereumAddress(address) && (
              <span
                style={{
                  padding: '0px 4px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '16px',
                  background: COLOR_ACCENT_EVM_627EEA,
                  color: COLOR_DARKMODE_TEXT_PRIMARY_FFFFFF,
                  fontSize: '8px',
                  marginLeft: '4px',
                  fontWeight: '400',
                  letterSpacing: '0.128px',
                  lineHeight: '1.5em',
                }}
              >
                EVM
              </span>
            )}
          </Typography>
          <Typography
            fontStyle="Inter"
            color={COLOR_DARKMODE_TEXT_SECONDARY_B3B3B3}
            fontSize="12px"
            fontWeight="400"
            lineHeight="17px"
            noWrap
          >
            {address ? formatAddress(address) : <Skeleton variant="text" width="120px" />}
          </Typography>
          <Typography
            fontStyle="Inter"
            color={COLOR_DARKMODE_TEXT_SECONDARY_B3B3B3}
            fontSize="12px"
            fontWeight="400"
            lineHeight="17px"
            noWrap
          >
            {isChildAccount ? ( // Child account
              nftCount !== undefined ? ( // NFT count is available
                <span>{`${nftCount} NFTs`}</span>
              ) : (
                <Skeleton variant="text" width="130px" />
              )
            ) : // Main account or EVM account
            balance !== undefined ? ( // Balance is available
              <TokenBalance value={balance} decimals={2} showFull={false} postFix="Flow" />
            ) : (
              <Skeleton variant="text" width="130px" />
            )}
          </Typography>
        </Box>
      </CardActionArea>
      {onClickSecondary && !isPending && (
        <CardActions sx={{ padding: '0px', marginLeft: 'auto' }}>
          <IconButton onClick={onClickSecondary} aria-label="Copy address" disabled={!address}>
            {secondaryIcon}
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
};
