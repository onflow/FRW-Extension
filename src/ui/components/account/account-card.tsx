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
import {
  COLOR_DARKMODE_BACKGROUND_CARDS_1A1A1A,
  COLOR_DARKMODE_TEXT_PRIMARY_FFFFFF,
  COLOR_DARKMODE_TEXT_SECONDARY_B3B3B3,
  COLOR_ACCENT_EVM_627EEA,
  COLOR_GREY_ICONS_767676,
} from '@/ui/style/color';
import { formatAddress } from '@/ui/utils';
import { ReactComponent as IconLink } from 'ui/assets/svg/Iconlink.svg';

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
}: AccountCardProps) => {
  const { name, icon, color, address, balance, nfts } = account || {};
  const { icon: parentIcon, color: parentColor } =
    account && parentAccount && parentAccount.address !== account.address ? parentAccount : {};

  return (
    <Card
      sx={{
        paddingLeft: '8px',
        paddingRight: '16px',
        paddingTop: showCard ? '10px' : '8px',
        paddingBottom: showCard ? '10px' : '8px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: '16px',
        backgroundColor: showCard ? COLOR_DARKMODE_BACKGROUND_CARDS_1A1A1A : 'transparent',
        overflow: 'hidden',
        maxWidth: '500px',
      }}
      elevation={showCard ? 1 : 0}
    >
      <CardActionArea
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          padding: '0px',
          alignItems: 'center',
          overflow: 'hidden',
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
            onClick={onClick}
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
            {balance ? (
              <TokenBalance value={balance} decimals={8} showFull={false} postFix="Flow" />
            ) : (
              <Skeleton variant="text" width="130px" />
            )}
            {nfts && <span>{` | ${nfts} NFTs`}</span>}
          </Typography>
        </Box>
      </CardActionArea>
      {onClickSecondary && (
        <CardActions sx={{ padding: '0px', marginLeft: 'auto' }}>
          <IconButton onClick={onClickSecondary} aria-label="Copy address" disabled={!address}>
            {secondaryIcon}
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
};
